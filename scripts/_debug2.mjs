import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/index.js";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

// Wydatki z recurringId BEZ bankTxHash (wygenerowane przez system, nie zaimportowane)
const systemGenerated = await prisma.expense.count({
  where: { recurringId: { not: null }, bankTxHash: null },
});
// Wydatki z recurringId I bankTxHash (zaimportowane i dopasowane)
const importedMatched = await prisma.expense.count({
  where: { recurringId: { not: null }, bankTxHash: { not: null } },
});

console.log(`System-generated (bez bankTxHash): ${systemGenerated}`);
console.log(`Imported+matched (z bankTxHash):   ${importedMatched}`);

// Sprawdź konkretnie dla "Rata laptop" (id: 0ac2b98d-8e38-4f72-901c-4df2895b0308)
const laptopSys = await prisma.expense.findMany({
  where: { recurringId: "0ac2b98d-8e38-4f72-901c-4df2895b0308", bankTxHash: null },
  select: { date: true, amount: true, status: true },
  orderBy: { date: "asc" },
});
const laptopImp = await prisma.expense.findMany({
  where: { recurringId: "0ac2b98d-8e38-4f72-901c-4df2895b0308", bankTxHash: { not: null } },
  select: { date: true, amount: true, status: true },
  orderBy: { date: "asc" },
});

console.log("\nRata laptop – system-generated:");
laptopSys.forEach(e => console.log(`  ${e.date.toISOString().slice(0,7)}  ${e.amount} PLN  ${e.status}`));
console.log("\nRata laptop – imported:");
laptopImp.forEach(e => console.log(`  ${e.date.toISOString().slice(0,7)}  ${e.amount} PLN  ${e.status}`));

await prisma.$disconnect();
