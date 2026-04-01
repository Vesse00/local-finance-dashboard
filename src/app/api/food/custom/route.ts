import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

    const products = await prisma.customProduct.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = { id: (session.user as any).id };

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
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d podczas dodawania produktu/posiĹ‚ku" }, { status: 500 });
  }
}

