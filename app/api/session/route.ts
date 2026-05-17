import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 días en ms

export async function POST(request: NextRequest) {
  const { idToken, name } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const decoded = await adminAuth.verifyIdToken(idToken);

  if (!decoded.email_verified) {
    return NextResponse.json({ error: "Email no verificado" }, { status: 403 });
  }

  // Guardar/actualizar el perfil del usuario en Firestore
  const userRef = adminDb.collection("users").doc(decoded.uid);
  await userRef.set(
    {
      email: decoded.email,
      name: name ?? decoded.name ?? decoded.email,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

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
