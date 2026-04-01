import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      gender = "MALE", 
      weight = 80, 
      height = 180, 
      age = 30, 
      activity = 1.55, 
      goal = 0 
    } = data;

    // Mifflina-St Jeora
    let baseBMR;
    if (gender === "MALE") {
      baseBMR = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      baseBMR = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const tdee = baseBMR * activity;
    const targetKcal = Math.round(tdee + goal);

    // Przykładowe proporcje (2g białka/kg, 1g tłuszczu/kg, reszta węgle)
    const targetProteins = Math.round(weight * 2);
    const targetFats = Math.round(weight * 1);
    
    // 1g białka to 4kcal, 1g węgli to 4kcal, 1g tłuszczy to 9kcal
    const carbsKcal = targetKcal - (targetProteins * 4) - (targetFats * 9);
    const targetCarbs = carbsKcal > 0 ? Math.round(carbsKcal / 4) : 0; 

    return NextResponse.json({
      bmr: Math.round(baseBMR),
      tdee: Math.round(tdee),
      targetKcal,
      targetProteins,
      targetFats,
      targetCarbs
    });
    
  } catch (error) {
    console.error("Błąd kalkulatora:", error);
    return NextResponse.json({ error: "Nie udało się obliczyć zapotrzebowania" }, { status: 500 });
  }
}
