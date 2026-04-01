import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    
    // Zwracamy teĹĽ lokalizacjÄ™
    return NextResponse.json({ 
      email: user.email, 
      username: user.username, 
      location: user.location || "",
      currency: user.currency || "PLN",
      payday: user.payday ?? 10
    });
  } catch (error) {
    return NextResponse.json({ error: "BĹ‚Ä…d serwera" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });

    const { currentPassword, newEmail, newPassword, location, currency, payday } = await req.json();

    const updateData: any = {};

    // 1. ZMIANA PREFERENCJI (Utilities) - Nie wymaga obecnego hasĹ‚a!
    if (location !== undefined && location !== user.location) {
      updateData.location = location;
    }
    if (currency !== undefined && currency !== user.currency) {
      updateData.currency = currency;
    }
    if (payday !== undefined && payday !== user.payday) {
      updateData.payday = Number(payday);
    }

    // 2. ZMIANA ZABEZPIECZEĹ (E-mail / HasĹ‚o) - Kategorycznie wymaga obecnego hasĹ‚a!
    if (newEmail || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Musisz podaÄ‡ obecne hasĹ‚o, aby zmieniÄ‡ e-mail lub hasĹ‚o." }, { status: 400 });
      }
      
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Obecne hasĹ‚o jest nieprawidĹ‚owe." }, { status: 400 });
      }

      if (newEmail && newEmail !== user.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingEmail) {
          return NextResponse.json({ error: "Ten adres e-mail jest juĹĽ przypisany do innego konta." }, { status: 400 });
        }
        updateData.email = newEmail;
      }

      if (newPassword) {
        if (newPassword.length < 6) {
           return NextResponse.json({ error: "Nowe hasĹ‚o musi mieÄ‡ min. 6 znakĂłw." }, { status: 400 });
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "Nie wprowadzono ĹĽadnych zmian." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "WystÄ…piĹ‚ bĹ‚Ä…d serwera podczas zapisywania zmian." }, { status: 500 });
  }
}
