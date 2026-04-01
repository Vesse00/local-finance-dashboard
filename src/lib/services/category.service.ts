import { prisma } from "@/lib/db";

export const DEFAULT_CATEGORIES = [
  { name: "Jedzenie", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Mieszkanie", icon: "🏠" },
  { name: "Rozrywka", icon: "🎉" },
  { name: "Zdrowie", icon: "💊" },
  { name: "Edukacja", icon: "📚" },
  { name: "Zakupy", icon: "🛍️" },
  { name: "Usługi", icon: "⚙️" },
  { name: "Rodzina", icon: "👶" },
  { name: "Samochód", icon: "🚘" },
  { name: "Tankowanie", icon: "⛽" },
  { name: "Inne", icon: "❓" }
];

export async function ensureDefaultCategories(userId: string) {
  const existing = await prisma.category.findMany({ where: { userId } });
  const existingNames = new Set(existing.map(c => c.name));
  
  const toCreate = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.name));
  
  if (toCreate.length > 0) {
    await prisma.category.createMany({
      data: toCreate.map(c => ({
        ...c,
        userId
      }))
    });
  }
}

export async function getOrCreateCategory(userId: string, name: string, defaultIcon: string = "❓") {
  let cat = await prisma.category.findFirst({ where: { userId, name } });
  if (!cat) {
    cat = await prisma.category.create({
      data: { name, icon: defaultIcon, userId }
    });
  }
  return cat;
}
