import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs"; // Jeśli używasz zwykłego 'bcrypt', zmień import

export async function GET() {
  try {
    // Generujemy nowe hasło
    const newPassword = await bcrypt.hash("admin123", 10);
    
    // Nadpisujemy hasła wszystkim użytkownikom (skoro to lokalna baza)
    await prisma.user.updateMany({
      data: { password: newPassword }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "HAKOWANIE UDANE 🔓 Twoje nowe hasło to: admin123" 
    });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}