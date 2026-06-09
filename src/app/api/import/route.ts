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
  if (!val) return "GŁÓWNE";
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
    const defaultCategory = await getOrCreateCategory(userId, "Inne", "❓");
    
    let importedCount = 0;
    const hasSavingsProduct = Boolean(savingsProduct);

    // ZMIENNE DO ZŁAPANIA FAKTYCZNEGO SALDA Z PLIKU
    let finalMainBalance: number | null = null;
    let finalSavingsBalance: number | null = null;

    for (const row of transactions) {
      const currentProduct = cleanProductName(row['Produkt'] || row['Konto']);
      let kwotaStr = row['Kwota'];
      let saldoStr = row['Saldo po transakcji']; // Łapiemy saldo z banku
      
      if (!kwotaStr) continue; 
      
      kwotaStr = String(kwotaStr).replace(/\s/g, '').replace(',', '.');
      const amount = parseFloat(kwotaStr);
      if (isNaN(amount) || amount === 0) continue;

      // Parsowanie Salda po transakcji (jeśli istnieje)
      let rowSaldo = NaN;
      if (saldoStr) {
        saldoStr = String(saldoStr).replace(/\s/g, '').replace(',', '.');
        rowSaldo = parseFloat(saldoStr);
      }

      const isMainProduct = mainProducts.includes(currentProduct) || (mainProducts.length === 0 && currentProduct === "GŁÓWNE");

      // --- ŁAPANIE NAJNOWSZEGO SALDA ---
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

      // Pomijamy transakcje odrzucone / anulowane (BNP Paribas i inne polskie banki)
      // BNP: kolumna "Data odrzucenia" niepusta = transakcja odrzucona
      const dataOdrzucenia = cleanText(row['Data odrzucenia'] || '');
      if (dataOdrzucenia) continue;
      const status = cleanText(row['Status'] || row['Status transakcji'] || '');
      const REJECTED_PATTERN = /odmow|odrzuc|anulow|nieautoryz|niezrealizow/i;
      if (REJECTED_PATTERN.test(status) || REJECTED_PATTERN.test(typ)) continue;
      
      const isInternal = /własny|wewnętrzny|lokacyjn|oszczędno/i.test(typ + opis);

      // --- ZAPISYWANIE TRANSAKCJI ---
      if (hasSavingsProduct && currentProduct === savingsProduct) {
        // Konta oszczędnościowe pomijamy w dodawaniu do bazy
        continue; 
      }

      if (isMainProduct) {
        if (amount > 0) {
          await prisma.income.create({
            data: {
              amount,
              source: isInternal ? "Przelew z oszczędności" : (nadawca || opis || "Import"),
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
                amount: absAmount, description: opis, recipient: "Własne Oszczędności",
                bankTransactionType: typ, date, type: "SAVING", userId
              }
            });
          } else {
            let categoryId = defaultCategory.id;
            const textToSearch = (odbiorca + " " + opis).toLowerCase();

            // SZUKANIE KATEGORII NA PODSTAWIE REGUŁ
            for (const rule of categoryRules) {
              const regex = new RegExp(rule.keywords.join('|'), 'i');
              if (regex.test(textToSearch)) {
                const cat = await getOrCreateCategory(userId, rule.name, rule.icon);
                categoryId = cat.id;
                break; 
              }
            }

            // Dodanie wydatku z już poprawną (znalezioną lub nową) kategorią
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
          importedCount++;
        }
      }
    } // koniec pętli for

    // Zapisujemy saldo konta oszczędnościowego (jeśli wykryto w pliku)
    if (finalSavingsBalance !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { savings: finalSavingsBalance }
      });
    }

    return NextResponse.json({ message: `Pomyślnie zaimportowano ${importedCount} transakcji.` }, { status: 200 });

  } catch (error: any) {
    console.error("Błąd importu:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas importu." }, { status: 500 });
  }
}
