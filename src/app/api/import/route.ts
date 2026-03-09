import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });
    const userId = user.id;

    const userCategories = await prisma.category.findMany({ where: { userId } });
    let defaultCategory = userCategories.find(c => c.name.toLowerCase() === "inne");
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({ data: { name: "Inne", icon: "❓", userId } });
    }

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
      // Ponieważ plik leci od najnowszych (góra) do najstarszych (dół), 
      // pierwsze napotkane saldo jest naszym "dzisiejszym" saldem.
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
      
      const isInternal = /własny|wewnętrzny|lokacyjn|oszczędno/i.test(typ + opis);

      // --- ZAPISYWANIE TRANSAKCJI ---
      if (hasSavingsProduct && currentProduct === savingsProduct) {
        // Konta oszczędnościowe pomijamy w dodawaniu do bazy (nie chcemy śmiecić na kalendarzu)
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
            
            if (textToSearch.includes('biedronka') || textToSearch.includes('lidl') || textToSearch.includes('zabka') || textToSearch.includes('żabka') || textToSearch.includes('kaufland') || textToSearch.includes('auchan')) {
              const cat = userCategories.find(c => c.name.toLowerCase() === 'jedzenie');
              if (cat) categoryId = cat.id;
            } else if (textToSearch.includes('orlen') || textToSearch.includes('bp') || textToSearch.includes('shell') || textToSearch.includes('circle')) {
              const cat = userCategories.find(c => c.name.toLowerCase() === 'transport');
              if (cat) categoryId = cat.id;
            } else if (textToSearch.includes('netflix') || textToSearch.includes('spotify') || textToSearch.includes('steam') || textToSearch.includes('kino')) {
              const cat = userCategories.find(c => c.name.toLowerCase() === 'rozrywka');
              if (cat) categoryId = cat.id;
            }

            await prisma.expense.create({
              data: {
                amount: absAmount, description: opis, recipient: odbiorca,
                bankTransactionType: typ, date, categoryId, userId
              }
            });
          }
          importedCount++;
        }
      }
    }

    // =========================================================
    // ETAP 2: AUTOMATYCZNE WYRÓWNYWANIE SALDA (MAGIA)
    // =========================================================

    // 1. Zapisujemy odczytane saldo oszczędności bezwzględnie w bazie
    if (finalSavingsBalance !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { savings: finalSavingsBalance }
      });
    }

    // 2. Wyrównujemy konto główne (Kwota Wolna)
    if (finalMainBalance !== null) {
      // Obliczamy ile apka uważa, że mamy teraz na koncie w obecnym miesiącu
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

      // Jeśli różnica to więcej niż 1 grosz, tworzymy wpis korygujący
      if (Math.abs(difference) > 0.01) {
        if (difference > 0) {
          // Aplikacja myśli, że masz za mało pieniędzy -> dodajemy ukryty przychód
          await prisma.income.create({
            data: {
              amount: difference,
              source: "Automatyczne wyrównanie po imporcie",
              date: new Date(),
              userId
            }
          });
        } else {
          // Aplikacja myśli, że masz za dużo pieniędzy -> dodajemy ukryty wydatek
          await prisma.expense.create({
            data: {
              amount: Math.abs(difference),
              description: "Automatyczne wyrównanie po imporcie",
              categoryId: defaultCategory.id,
              date: new Date(),
              userId
            }
          });
        }
      }
    }

    return NextResponse.json({ message: `Pomyślnie zaimportowano ${importedCount} transakcji i zaktualizowano salda na podstawie wyciągu.` }, { status: 200 });

  } catch (error: any) {
    console.error("Błąd importu:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas importu." }, { status: 500 });
  }
}