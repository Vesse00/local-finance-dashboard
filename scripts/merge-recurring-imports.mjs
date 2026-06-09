/**
 * SKRYPT MIGRACYJNY: Scalanie transakcji importowanych z PENDING/systemowych zleceń stałych
 *
 * Rozwiązuje DWA problemy:
 *
 * PROBLEM B (aktualny): W danym miesiącu istnieje zarówno:
 *   - systemowy wpis (recurringId, brak bankTxHash) -- stary styl generowania
 *   - zaimportowany wpis (recurringId, ma bankTxHash)
 *   → usuń systemowy duplikat (zaimportowany jest dokładniejszy)
 *
 * PROBLEM A (stary): Importowane wydatki z bankTxHash ale BEZ recurringId
 *   → dopasuj do zlecenia stałego i scal z systemowym wpisem tego miesiąca
 *
 * Uruchomienie:
 *   node scripts/merge-recurring-imports.mjs [--dry-run]
 *
 * --dry-run: tylko pokazuje co by zrobiło, nic nie modyfikuje
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });
const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) console.log("🔍 TRYB PODGLĄDU (--dry-run) – baza nie zostanie zmieniona\n");

async function main() {
  let fixed = 0;

  // ── PROBLEM B: duplikaty (systemowy + zaimportowany w tym samym miesiącu) ──
  console.log("=== PROBLEM B: systemowe duplikaty obok zaimportowanych ===");

  const importedWithRecurring = await prisma.expense.findMany({
    where: { bankTxHash: { not: null }, recurringId: { not: null } },
    select: { id: true, recurringId: true, date: true, amount: true },
    orderBy: { date: "asc" },
  });

  for (const imp of importedWithRecurring) {
    const d = imp.date;
    const windowStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const windowEnd   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const sysDuplicate = await prisma.expense.findFirst({
      where: {
        id: { not: imp.id },
        recurringId: imp.recurringId,
        bankTxHash: null,
        date: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, amount: true, status: true },
    });

    if (!sysDuplicate) continue;

    console.log(
      `  ✅ Duplikat: recurringId=${imp.recurringId} ${d.toISOString().slice(0, 7)}` +
      `\n     Usuwam systemowy: ${sysDuplicate.id} (${sysDuplicate.amount} PLN, ${sysDuplicate.status})` +
      `\n     Zostawiam importowany: ${imp.id} (${imp.amount} PLN)`
    );

    if (!DRY_RUN) {
      await prisma.expense.delete({ where: { id: sysDuplicate.id } });
    }
    fixed++;
  }

  // ── PROBLEM A: importowane BEZ recurringId ──
  console.log("\n=== PROBLEM A: importowane bez zlecenia stałego ===");

  const recurringPayments = await prisma.recurringPayment.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, recipientAccountNo: true, matchPhrase: true,
      categoryId: true, remainingAmount: true, totalAmount: true, userId: true,
    },
  });

  const importedExpenses = await prisma.expense.findMany({
    where: { bankTxHash: { not: null }, recurringId: null, status: "COMPLETED" },
    orderBy: { date: "asc" },
  });

  console.log(`Znaleziono ${importedExpenses.length} importowanych bez zlecenia`);

  const remainingCache = new Map(recurringPayments.map((r) => [r.id, r.remainingAmount]));
  let merged = 0, noMatch = 0, noPending = 0;

  for (const expense of importedExpenses) {
    const odbiorca = expense.recipient ?? "";
    const opis = expense.description ?? "";
    const odbiorczyIban = odbiorca.split(/\r?\n/)[0].replace(/\s/g, "").trim();

    const recurring = recurringPayments
      .filter((r) => r.userId === expense.userId)
      .find((r) => {
        if (odbiorczyIban && r.recipientAccountNo && r.recipientAccountNo === odbiorczyIban) return true;
        if (r.matchPhrase) {
          return [odbiorca, opis].join(" ").toLowerCase().includes(r.matchPhrase.toLowerCase());
        }
        return false;
      }) ?? null;

    if (!recurring) { noMatch++; continue; }

    const d = expense.date;
    const windowStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const windowEnd   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const pendingExpense = await prisma.expense.findFirst({
      where: { recurringId: recurring.id, status: "PENDING", date: { gte: windowStart, lte: windowEnd } },
    });
    const targetExpense = pendingExpense ?? await prisma.expense.findFirst({
      where: { recurringId: recurring.id, bankTxHash: null, date: { gte: windowStart, lte: windowEnd } },
    });

    if (!targetExpense) {
      noPending++;
      console.log(`  ⚠  Brak celu dla "${recurring.name}" ${d.toISOString().slice(0, 7)}`);
      continue;
    }

    const currentRemaining = remainingCache.get(recurring.id) ?? null;
    const newRemaining = recurring.totalAmount !== null && currentRemaining !== null
      ? Math.max(0, currentRemaining - expense.amount) : null;

    console.log(`  ✅ Scalanie: "${recurring.name}" ${d.toISOString().slice(0, 7)} → ${expense.amount} PLN COMPLETED`);

    if (!DRY_RUN) {
      await prisma.$transaction([
        prisma.expense.update({
          where: { id: targetExpense.id },
          data: {
            amount: expense.amount, date: expense.date, status: "COMPLETED",
            bankTxHash: expense.bankTxHash, bankTransactionType: expense.bankTransactionType,
            description: expense.description || targetExpense.description,
            recipient: expense.recipient || targetExpense.recipient,
          },
        }),
        prisma.expense.delete({ where: { id: expense.id } }),
        ...(newRemaining !== null
          ? [prisma.recurringPayment.update({ where: { id: recurring.id }, data: { remainingAmount: newRemaining } })]
          : []),
      ]);
      if (newRemaining !== null) remainingCache.set(recurring.id, newRemaining);
    }
    merged++;
    fixed++;
  }

  console.log("\n=== PODSUMOWANIE ===");
  console.log(`Naprawiono łącznie:   ${fixed}`);
  console.log(`  B (duplikaty):      ${fixed - merged}`);
  console.log(`  A (scalono):        ${merged}`);
  console.log(`  A (brak dopasow.):  ${noMatch}`);
  console.log(`  A (brak celu):      ${noPending}`);
  if (DRY_RUN) console.log("\n⚠  Tryb podglądu. Uruchom bez --dry-run żeby zastosować.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
