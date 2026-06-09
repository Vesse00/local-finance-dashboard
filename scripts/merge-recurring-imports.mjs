/**
 * SKRYPT MIGRACYJNY: Scalanie transakcji importowanych z PENDING zleceń stałych
 *
 * Problem: import z oknem ±7 dni nie trafiał w PENDING jeśli data płatności
 * różniła się o więcej niż 7 dni od zaplanowanej daty.
 *
 * Co robi skrypt:
 * 1. Bierze wszystkie COMPLETED wydatki z bankTxHash (importowane) BEZ recurringId
 * 2. Dla każdego próbuje dopasować zlecenie stałe (po IBAN lub frazie)
 * 3. Jeśli znalazło zlecenie → szuka PENDING Expense z tego zlecenia w tym samym miesiącu
 * 4. Jeśli znalazło PENDING:
 *    - Aktualizuje PENDING → COMPLETED z faktyczną kwotą + bankTxHash
 *    - Usuwa duplikat COMPLETED (ten z importu)
 *    - Aktualizuje remainingAmount na zleceniu (jeśli kredyt/rata)
 *
 * Uruchomienie:
 *   node scripts/merge-recurring-imports.mjs [--dry-run]
 *
 * --dry-run: tylko pokazuje co by zrobiło, nic nie modyfikuje
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "prisma/dev.db" });
const prisma = new PrismaClient({ adapter });
const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) console.log("🔍 TRYB PODGLĄDU (--dry-run) – baza nie zostanie zmieniona\n");

async function main() {
  // 1. Pobierz wszystkie zlecenia stałe aktywne
  const recurringPayments = await prisma.recurringPayment.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      recipientAccountNo: true,
      matchPhrase: true,
      categoryId: true,
      remainingAmount: true,
      totalAmount: true,
      userId: true,
    },
  });

  // 2. Pobierz WSZYSTKIE importowane wydatki bez recurringId
  const importedExpenses = await prisma.expense.findMany({
    where: {
      bankTxHash: { not: null },
      recurringId: null,
      status: "COMPLETED",
    },
    orderBy: { date: "asc" },
  });

  console.log(`Znaleziono ${importedExpenses.length} importowanych wydatków bez zlecenia stałego`);
  console.log(`Znaleziono ${recurringPayments.length} aktywnych zleceń stałych\n`);

  // Cache: aktualne remainingAmount per recurringId (modyfikowane podczas przebiegu)
  const remainingCache = new Map(
    recurringPayments.map((r) => [r.id, r.remainingAmount])
  );

  let merged = 0;
  let skipped = 0;
  let noMatch = 0;
  let noPending = 0;

  for (const expense of importedExpenses) {
    const odbiorca = expense.recipient ?? "";
    const opis = expense.description ?? "";

    // Wyodrębnij IBAN z pola recipient (pierwsza linia, bez spacji)
    const odbiorczyIban = odbiorca.split(/\r?\n/)[0].replace(/\s/g, "").trim();

    // Dopasuj zlecenie stałe
    const recurring = recurringPayments
      .filter((r) => r.userId === expense.userId)
      .find((r) => {
        if (odbiorczyIban && r.recipientAccountNo && r.recipientAccountNo === odbiorczyIban) return true;
        if (r.matchPhrase) {
          const searchText = [odbiorca, opis].join(" ").toLowerCase();
          return searchText.includes(r.matchPhrase.toLowerCase());
        }
        return false;
      }) ?? null;

    if (!recurring) {
      noMatch++;
      continue;
    }

    // Szukaj PENDING Expense z tego zlecenia w tym samym miesiącu
    const d = expense.date;
    const windowStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const windowEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const pendingExpense = await prisma.expense.findFirst({
      where: {
        recurringId: recurring.id,
        status: "PENDING",
        date: { gte: windowStart, lte: windowEnd },
      },
    });

    if (!pendingExpense) {
      noPending++;
      console.log(
        `  ⚠  Brak PENDING dla "${recurring.name}" w ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")} ` +
        `(importowany: ${expense.id}, kwota: ${expense.amount})`
      );
      continue;
    }

    // Mamy PENDING do scalenia
    const currentRemaining = remainingCache.get(recurring.id) ?? null;
    const newRemaining =
      recurring.totalAmount !== null && currentRemaining !== null
        ? Math.max(0, currentRemaining - expense.amount)
        : null;

    console.log(
      `  ✅ Scalanie: "${recurring.name}" ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` +
      `\n     PENDING ${pendingExpense.id} (${pendingExpense.amount} PLN) → COMPLETED ${expense.amount} PLN` +
      `\n     Usuwanie duplikatu: ${expense.id}` +
      (newRemaining !== null ? `\n     remainingAmount: ${currentRemaining} → ${newRemaining}` : "")
    );

    if (!DRY_RUN) {
      await prisma.$transaction([
        // Aktualizuj PENDING → COMPLETED z faktyczną kwotą
        prisma.expense.update({
          where: { id: pendingExpense.id },
          data: {
            amount: expense.amount,
            date: expense.date,
            status: "COMPLETED",
            bankTxHash: expense.bankTxHash,
            bankTransactionType: expense.bankTransactionType,
            description: expense.description || pendingExpense.description,
            recipient: expense.recipient || pendingExpense.recipient,
          },
        }),
        // Usuń duplikat z importu
        prisma.expense.delete({ where: { id: expense.id } }),
        // Aktualizuj remainingAmount na zleceniu (jeśli kredyt)
        ...(newRemaining !== null
          ? [prisma.recurringPayment.update({
              where: { id: recurring.id },
              data: { remainingAmount: newRemaining },
            })]
          : []),
      ]);

      // Zaktualizuj lokalny cache
      if (newRemaining !== null) remainingCache.set(recurring.id, newRemaining);
    }

    merged++;
    skipped++;
  }

  console.log("\n=== PODSUMOWANIE ===");
  console.log(`Scalono:          ${merged}`);
  console.log(`Brak dopasowania: ${noMatch}`);
  console.log(`Brak PENDING:     ${noPending}`);
  if (DRY_RUN) console.log("\n⚠  To był tryb podglądu. Uruchom bez --dry-run żeby zastosować zmiany.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
