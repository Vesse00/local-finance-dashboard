import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { categoryRules } from "@/lib/categoryRules"; 
import { getOrCreateCategory, ensureDefaultCategories } from "@/lib/services/category.service";
import { createHash } from "crypto";

// Rola konta: co robić z transakcjami na danym produkcie
type AccountRole =
  | { role: "MAIN" }                                   // konto główne / karta – liczymy przychody i wydatki
  | { role: "SAVINGS"; savingsAccountId: string | null } // konto oszczędnościowe – aktualizuj saldo w SavingsAccount
  | { role: "IGNORE" };                                 // ignoruj wszystkie transakcje

const parseDateStr = (ds: string) => {
  if (!ds) return new Date();
  const match = ds.match(/^(\d{2})[.-](\d{2})[.-](\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00Z`);
  return new Date(ds); 
};

const cleanProductName = (val: unknown) => {
  if (!val) return "GŁÓWNE";
  return String(val).split('\n')[0].trim();
};

const cleanText = (val: unknown) => {
  if (!val) return "";
  return String(val).replace(/\r?\n/g, ' ').trim(); 
};

// Wstępnie posortowane reguły (malejąco wg priorytetu) – obliczamy raz
const sortedCategoryRules = [...categoryRules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const { transactions, accountRoles } = body as {
      transactions: Record<string, string>[];
      // Mapa: nazwa produktu → rola
      accountRoles: Record<string, AccountRole>;
    };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    await ensureDefaultCategories(userId);
    const defaultCategory = await getOrCreateCategory(userId, "Inne", "❓");

    // Zbieramy nazwy wszystkich znanych produktów (żeby wykrywać przelewy między nimi)
    const allKnownProducts = new Set(Object.keys(accountRoles ?? {}));

    // Wczytujemy zlecenia stałe z polami do dopasowania
    const recurringPayments = await prisma.recurringPayment.findMany({
      where: { userId, isActive: true },
      select: { id: true, recipientAccountNo: true, matchPhrase: true, categoryId: true, remainingAmount: true, totalAmount: true },
    });

    // Najnowsze saldo per produkt
    const latestBalanceByProduct = new Map<string, number>();

    let importedCount = 0;

    for (const row of transactions) {
      const currentProduct = cleanProductName(row['Produkt'] || row['Konto']);
      const role: AccountRole = accountRoles?.[currentProduct] ?? { role: "IGNORE" };

      let kwotaStr = row['Kwota'];
      if (!kwotaStr) continue;
      kwotaStr = String(kwotaStr).replace(/\s/g, '').replace(',', '.');
      const amount = parseFloat(kwotaStr);
      if (isNaN(amount) || amount === 0) continue;

      // Saldo po transakcji – zbieramy najnowsze per produkt
      const saldoStr = String(row['Saldo po transakcji'] || '').replace(/\s/g, '').replace(',', '.');
      const rowSaldo = parseFloat(saldoStr);
      if (!isNaN(rowSaldo) && !latestBalanceByProduct.has(currentProduct)) {
        latestBalanceByProduct.set(currentProduct, rowSaldo);
      }

      const date = parseDateStr(row['Data Transakcji'] || row['Data transakcji']);
      const opis = cleanText(row['Opis']);
      const nadawca = cleanText(row['NAdawca'] || row['Nadawca']);
      const odbiorca = cleanText(row['Odbiorca']);
      const typ = cleanText(row['Typ Transakcji'] || row['Typ transakcji']);

      // --- FILTR: transakcje odrzucone / anulowane ---
      const dataOdrzucenia = cleanText(row['Data odrzucenia'] || '');
      if (dataOdrzucenia) continue;
      const status = cleanText(row['Status'] || row['Status transakcji'] || '');
      const REJECTED_PATTERN = /odmow|odrzuc|anulow|nieautoryz|niezrealizow/i;
      if (REJECTED_PATTERN.test(status) || REJECTED_PATTERN.test(typ)) continue;

      // --- FILTR: przelew własny między swoimi kontami ---
      // Wykrywamy po opisie ("przelew własny") LUB po tym, że produkt nadawcy/odbiorcy jest znany
      const opisLower = opis.toLowerCase();
      const isOwnTransfer =
        /przelew własny|przelew wewnętrzny/i.test(opisLower) ||
        allKnownProducts.has(cleanProductName(odbiorca)) ||
        allKnownProducts.has(cleanProductName(nadawca));

      // Jeśli nie MAIN (SAVINGS lub IGNORE) lub przelew własny – pomijamy
      if (role.role !== "MAIN" || isOwnTransfer) continue;

      // --- Konta MAIN: normalny import przychodów i wydatków ---
      if (amount > 0) {
        await prisma.income.create({
          data: {
            amount,
            source: nadawca || opis || "Import",
            description: opis,
            bankTransactionType: typ,
            date,
            userId,
          },
        });
        importedCount++;
      } else if (amount < 0) {
        const absAmount = Math.abs(amount);

        // IBAN odbiorcy – pierwsza linia pola Odbiorca (bez spacji)
        const odbiorczyIban = String(row['Odbiorca'] || '').split(/\r?\n/)[0].replace(/\s/g, '').trim();

        // --- HASH DEDUPLICATION: pomijamy jeśli transakcja była już importowana ---
        const hashInput = `${row['Data transakcji'] || row['Data Transakcji']}|${absAmount}|${odbiorczyIban}|${userId}`;
        const bankTxHash = createHash('sha256').update(hashInput).digest('hex');
        const existingByHash = await prisma.expense.findUnique({ where: { bankTxHash } });
        if (existingByHash) continue;

        // --- MATCHING: czy ta transakcja pasuje do zlecenia stałego? ---
        let matchedRecurring: typeof recurringPayments[number] | null = null;

        // 1. Priorytet: IBAN
        if (odbiorczyIban) {
          matchedRecurring = recurringPayments.find(r => r.recipientAccountNo && r.recipientAccountNo === odbiorczyIban) ?? null;
        }
        // 2. Fallback: fraza w opisie/odbiorcy
        if (!matchedRecurring) {
          const searchText = [odbiorca, opis, nadawca].join(" ").toLowerCase();
          matchedRecurring = recurringPayments.find(r => r.matchPhrase && searchText.includes(r.matchPhrase.toLowerCase())) ?? null;
        }

        if (matchedRecurring) {
          // Szukamy w całym miesiącu transakcji
          const windowStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
          const windowEnd   = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

          // 1. Priorytet: PENDING (zaplanowana rata czekająca na potwierdzenie)
          const pendingExpense = await prisma.expense.findFirst({
            where: { recurringId: matchedRecurring.id, status: "PENDING", date: { gte: windowStart, lte: windowEnd } },
          });

          // 2. Fallback: systemowo wygenerowany COMPLETED bez bankTxHash (stary styl)
          const targetExpense = pendingExpense ?? await prisma.expense.findFirst({
            where: { recurringId: matchedRecurring.id, bankTxHash: null, date: { gte: windowStart, lte: windowEnd } },
          });

          if (targetExpense) {
            // Scalamy: faktyczna kwota zastępuje zaplanowaną, status → COMPLETED
            await prisma.expense.update({
              where: { id: targetExpense.id },
              data: { amount: absAmount, date, status: "COMPLETED", bankTxHash, bankTransactionType: typ },
            });

            // Jeśli to kredyt/rata – odejmujemy FAKTYCZNĄ zapłaconą kwotę od remainingAmount
            if (matchedRecurring.totalAmount !== null && matchedRecurring.remainingAmount !== null) {
              const newRemaining = Math.max(0, matchedRecurring.remainingAmount - absAmount);
              await prisma.recurringPayment.update({
                where: { id: matchedRecurring.id },
                data: { remainingAmount: newRemaining },
              });
              // Aktualizujemy lokalne cache żeby kolejne raty z tego pliku miały poprawne saldo
              matchedRecurring.remainingAmount = newRemaining;
            }

            importedCount++;
            continue;
          }
        }

        // --- Brak PENDING do scalenia: tworzymy nowy wydatek ---
        const textToSearch = [odbiorca, nadawca, opis, typ].filter(Boolean).join(" ");
        let categoryId = matchedRecurring?.categoryId ?? defaultCategory.id;

        if (!matchedRecurring?.categoryId) {
          for (const rule of sortedCategoryRules) {
            const regex = new RegExp(rule.keywords.join('|'), 'i');
            if (regex.test(textToSearch)) {
              const cat = await getOrCreateCategory(userId, rule.name, rule.icon);
              categoryId = cat.id;
              break;
            }
          }
        }

        await prisma.expense.create({
          data: {
            amount: absAmount,
            description: opis,
            recipient: odbiorca,
            bankTransactionType: typ,
            date,
            categoryId,
            bankTxHash,
            status: "COMPLETED",
            ...(matchedRecurring ? { recurringId: matchedRecurring.id } : {}),
            userId,
          },
        });
        importedCount++;
      }
    } // koniec pętli for

    // --- Aktualizacja sald kont oszczędnościowych ---
    for (const [product, role] of Object.entries(accountRoles ?? {})) {
      if (role.role !== "SAVINGS") continue;
      const balance = latestBalanceByProduct.get(product);
      if (balance === undefined) continue;

      if (role.savingsAccountId) {
        // Aktualizuj konkretne konto SavingsAccount w bazie
        await prisma.savingsAccount.updateMany({
          where: { id: role.savingsAccountId, userId },
          data: { balance },
        });
      } else {
        // Stare pole savings na userze (fallback gdy brak przypisanego konta)
        await prisma.user.update({
          where: { id: userId },
          data: { savings: balance },
        });
      }
    }

    return NextResponse.json({
      message: `Zaimportowano ${importedCount} transakcji.`,
      imported: importedCount,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Błąd importu:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas importu." }, { status: 500 });
  }
}