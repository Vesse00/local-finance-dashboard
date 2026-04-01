import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json([]);
    }

    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&lc=pl`;
    
    // OpenFoodFacts bardzo często blokuje "anonimowe" boty wysyłając 503. Wymagają nagłówka User-Agent.
    const headers: Record<string, string> = {
      "User-Agent": "LocalFinanceDashboard/1.0 - MyPrivateHealthTracker",
      "Accept": "application/json"
    };

    // Opcjonalna autoryzacja - jeśli założysz konto, dodaj w pliku .env: 
    // OPENFOODFACTS_USERNAME=twojlogin oraz OPENFOODFACTS_PASSWORD=twojehaslo
    const offUser = process.env.OPENFOODFACTS_USERNAME;
    const offPass = process.env.OPENFOODFACTS_PASSWORD;
    if (offUser && offPass) {
      // Dla pewności ucinamy białe znaki w razie spacji w .env
      headers["Authorization"] = `Basic ${Buffer.from(`${offUser.trim()}:${offPass.trim()}`).toString("base64")}`;
    }

    const res = await fetch(apiUrl, { headers });
    
    if (!res.ok) {
      console.warn(`OpenFoodFacts api error: ${res.status}`);
      return NextResponse.json([]); // Zwracamy pustą tablicę zamiast błędu 500
    }

    const data = await res.json();
    
    const results = (data.products || [])
      .map((p: any) => {
        const baseName = p.product_name || p.product_name_pl || p.generic_name || "Produkt nieznany";
        const brand = p.brands ? ` | ${p.brands.split(',')[0].trim()}` : "";
        
        return {
          id: p._id || p.code || Math.random().toString(),
          name: `${baseName}${brand}`,
          kcal: Math.round(Number(p.nutriments?.['energy-kcal_100g'])) || 0,
          proteins: Math.round(Number(p.nutriments?.proteins_100g)) || 0,
          carbs: Math.round(Number(p.nutriments?.carbohydrates_100g)) || 0,
          fats: Math.round(Number(p.nutriments?.fat_100g)) || 0
        };
      })
      .filter((p: any) => !p.name.startsWith("Produkt nieznany") && p.kcal > 0);

    return NextResponse.json(results);
  } catch (error) {
    console.error("OpenFoodFacts Error:", error);
    return NextResponse.json([]); // Zwracamy pusty array, żeby nie crashować na pusto
  }
}
