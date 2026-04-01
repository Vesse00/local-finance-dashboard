import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { categoryRules } from "@/lib/categoryRules"; 
import { getOrCreateCategory, ensureDefaultCategories } from "@/lib/services/category.service";

const parseDateStr = (ds: string) => {
  if (!ds) return new Date();
  const match = ds.match(/^(\d{2})[.-](\d{2})[.-](\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00Z`);
  return new Date(ds); 
};

const cleanProductName = (val: any) => {
  if (!val) return "GĹĂ“WNE";
  return String(val).split('\n')[0].trim();
};

const cleanText = (val: any) => {
  if (!val) return "";
  return String(val).replace(/\r?\n/g, ' ').trim(); 
};

export async function POST(req: Request) {
  try {
    const { transactions, mainProducts, savingsProduct } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Brak danych" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };
    const userId = user.id;

    const userCategories = await prisma.category.findMany({ where: { userId } });
    const defaultCategory = await getOrCreateCategory(userId, "Inne", "âť“");
    
    let importedCount = 0;
    const hasSavingsProduct = Boolean(savingsProduct);

    // ZMIENNE DO ZĹAPANIA FAKTYCZNEGO SALDA Z PLIKU
    let finalMainBalance: number | null = null;
    let finalSavingsBalance: number | null = null;

    for (const row of transactions) {
      const currentProduct = cleanProductName(row['Produkt'] || row['Konto']);
      let kwotaStr = row['Kwota'];
      let saldoStr = row['Saldo po transakcji']; // Ĺapiemy saldo z banku
      
      if (!kwotaStr) continue; 
      
      kwotaStr = String(kwotaStr).replace(/\s/g, '').replace(',', '.');
      const amount = parseFloat(kwotaStr);
      if (isNaN(amount) || amount === 0) continue;

      // Parsowanie Salda po transakcji (jeĹ›li istnieje)
      let rowSaldo = NaN;
      if (saldoStr) {
        saldoStr = String(saldoStr).replace(/\s/g, '').replace(',', '.');
        rowSaldo = parseFloat(saldoStr);
      }

      const isMainProduct = mainProducts.includes(currentProduct) || (mainProducts.length === 0 && currentProduct === "GĹĂ“WNE");

      // --- ĹAPANIE NAJNOWSZEGO SALDA ---
      if (isMainProduct && finalMainBalance === null && !isNaN(rowSaldo)) {
        finalMainBalance = rowSaldo;
      }
      if (hasSavingsProduct && currentProduct === savingsProduct && finalSavingsBalance === null && !isNaN(rowSaldo)) {
        finalSavingsBalance = rowSaldo;
      }

      const date = parseDateStr(row['Data Transakcji'] || row['Data transakcji']);
      const opis = cleanText(row['Opis']);
      const nadawca = cleanText(row['NAdawca'] || row['Nadawca']);
      const odbiorca = cleanText(row['Odbiorca']);
      const typ = cleanText(row['Typ Transakcji'] || row['Typ transakcji']);
      
      const isInternal = /wĹ‚asny|wewnÄ™trzny|lokacyjn|oszczÄ™dno/i.test(typ + opis);

      // --- ZAPISYWANIE TRANSAKCJI ---
      if (hasSavingsProduct && currentProduct === savingsProduct) {
        // Konta oszczÄ™dnoĹ›ciowe pomijamy w dodawaniu do bazy
        continue; 
      }

      if (isMainProduct) {
        if (amount > 0) {
          await prisma.income.create({
            data: {
              amount,
              source: isInternal ? "Przelew z oszczÄ™dnoĹ›ci" : (nadawca || opis || "Import"),
              description: opis,
              bankTransactionType: typ,
              date,
              userId
            }
          });
          importedCount++;
        } 
        else if (amount < 0) {
          const absAmount = Math.abs(amount);
          
          if (isInternal) {
            await prisma.expense.create({
              data: {
                amount: absAmount, description: opis, recipient: "WĹ‚asne OszczÄ™dnoĹ›ci",
                bankTransactionType: typ, date, type: "SAVING", userId
              }
            });
          } else {
            let categoryId = defaultCategory.id;
            const textToSearch = (odbiorca + " " + opis).toLowerCase();

            // SZUKANIE KATEGORII NA PODSTAWIE REGUĹ
            for (const rule of categoryRules) {
              const regex = new RegExp(rule.keywords.join('|'), 'i');
              if (regex.test(textToSearch)) {
                const cat = await getOrCreateCategory(userId, rule.name, rule.icon);
                categoryId = cat.id;
                break; 
              }
            }

            // Dodanie wydatku z juĹĽ poprawnÄ… (znalezionÄ… lub nowÄ…) kategoriÄ…
            await prisma.expense.create({
              data: {
                amount: absAmount, 
                description: opis, 
                recipient: odbiorca,
                bankTransactionType: typ, 
                date, 
                categoryId, 
                userId
              }
            });
          }
          importedCount++; // Ten licznik musiaĹ‚ tu zostaÄ‡ i to on mĂłgĹ‚ powodowaÄ‡ bĹ‚Ä™dy przy rÄ™cznym kopiowaniu
        }
      }
    } // <-- TUTAJ KOĹCZY SIÄ GĹĂ“WNA PÄTLA FOR DLA TRANSAKCJI

    // =========================================================
    // ETAP 2: AUTOMATYCZNE WYRĂ“WNYWANIE SALDA (MAGIA)
    // =========================================================

    // 1. Zapisujemy odczytane saldo oszczÄ™dnoĹ›ci bezwzglÄ™dnie w bazie
    if (finalSavingsBalance !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { savings: finalSavingsBalance }
      });
    }

    // 2. WyrĂłwnujemy konto gĹ‚Ăłwne (Kwota Wolna)
    if (finalMainBalance !== null) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const expenses = await prisma.expense.aggregate({
        where: { userId, date: { gte: startOfMonth }, type: { in: ["EXPENSE", "SAVING"] } },
        _sum: { amount: true }
      });
      const incomes = await prisma.income.aggregate({
        where: { userId, date: { gte: startOfMonth } },
        _sum: { amount: true }
      });

      const dbBalance = (incomes._sum.amount || 0) - (expenses._sum.amount || 0);
      const difference = finalMainBalance - dbBalance;

      // JeĹ›li rĂłĹĽnica to wiÄ™cej niĹĽ 1 grosz, tworzymy wpis korygujÄ…cy
      if (Math.abs(difference) > 0.01) {
        if (difference > 0) {
          // Aplikacja myĹ›li, ĹĽe masz za maĹ‚o pieniÄ™dzy -> dodajemy ukryty przychĂłd
          await prisma.income.create({
            data: {
              amount: difference,
              source: "Automatyczne wyrĂłwnanie po imporcie",
              date: new Date(),
              userId
            }
          });
        } else {
          // Aplikacja myĹ›li, ĹĽe masz za duĹĽo pieniÄ™dzy -> dodajemy ukryty wydatek
          await prisma.expense.create({
            data: {
              amount: Math.abs(difference),
              description: "Automatyczne wyrĂłwnanie po imporcie",
              categoryId: defaultCategory.id,
              date: new Date(),
              userId
            }
          });
        }
      }
    }

    return NextResponse.json({ message: `PomyĹ›lnie zaimportowano ${importedCount} transakcji i zaktualizowano salda na podstawie wyciÄ…gu.` }, { status: 200 });

  } catch (error: any) {
    console.error("BĹ‚Ä…d importu:", error);
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d podczas importu." }, { status: 500 });
  }
}
