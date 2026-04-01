import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const products = await prisma.customProduct.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "Brak użytkownika" }, { status: 401 });

    const body = await req.json();
    const { name, kcal, proteins, carbs, fats, isRecipe, ingredients } = body;

    const product = await prisma.customProduct.create({
      data: {
        userId: user.id,
        name,
        kcal: parseFloat(kcal) || 0,
        proteins: parseFloat(proteins) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        isRecipe: isRecipe || false,
        ingredients: ingredients ? JSON.stringify(ingredients) : null
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Wystąpił błąd podczas dodawania produktu/posiłku" }, { status: 500 });
  }
}
