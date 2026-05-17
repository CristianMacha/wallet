import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 días en ms

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const decoded = await adminAuth.verifyIdToken(idToken);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && decoded.email !== adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return NextResponse.json({ ok: true });
}
