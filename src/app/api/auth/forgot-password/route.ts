import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { username } = await req.json(); // Zakładamy, że username to e-mail, lub w systemie masz e-maile. Zastosujemy tu wyszukanie po username.

    // Używamy zmiennej 'username' (ponieważ tak nazywa się pole formularza wysyłane z frontendu) 
    // i szukamy użytkownika po 'email' (lub 'username', w zależności od struktury Twojej bazy, zazwyczaj email=username)
    const user = await prisma.user.findUnique({ where: { email: username } });
    
    if (!user) {
      // Ze względów bezpieczeństwa nie informujemy, czy użytkownik istnieje
      return NextResponse.json({ success: true, message: "Jeśli konto istnieje, wysłano e-mail." });
    }

    // 1. Generowanie bezpiecznego tokenu
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token ważny 1 godzinę

    // 2. Zapisanie tokenu w bazie
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    // 3. Konfiguracja Nodemailera (korzysta z danych w .env)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Tworzenie linku resetującego
    // Zmienisz "localhost:3000" na swoją domenę, gdy wrzucisz to do internetu
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3003"}/reset-password?token=${resetToken}`;

    // 5. Wysyłka E-maila
    const mailOptions = {
      from: `"Twój Dashboard" <${process.env.EMAIL_USER}>`,
      to: user.email, // ZAKŁADAMY, ŻE USERNAME TO E-MAIL! Jeśli jest inaczej, wyślij na sztywno do siebie w ramach testów, lub dodaj pole `email` do modelu User.
      subject: "Odzyskiwanie hasła - Dashboard Finansowy",
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Resetowanie hasła</h2>
          <p style="color: #333; font-size: 16px;">Witaj,</p>
          <p style="color: #333; font-size: 16px;">Otrzymaliśmy prośbę o reset hasła dla Twojego konta. Kliknij w poniższy przycisk, aby ustawić nowe hasło. Link jest ważny przez 1 godzinę.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Ustaw nowe hasło</a>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "E-mail z linkiem do resetu został wysłany." });
  } catch (error) {
    console.error("Błąd wysyłki e-maila:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas wysyłania wiadomości." }, { status: 500 });
  }
}