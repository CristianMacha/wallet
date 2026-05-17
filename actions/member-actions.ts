"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { memberSchema } from "@/lib/validations/member";
import { FieldValue } from "firebase-admin/firestore";

export async function createMember(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = memberSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { name, alias, note } = parsed.data;
  const accessToken = crypto.randomUUID();

  await adminDb.collection("users").doc(userId).collection("members").add({
    name,
    alias: alias ?? null,
    note: note ?? null,
    accessToken,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/miembros");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateMember(id: string, data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = memberSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { name, alias, note } = parsed.data;

  await adminDb.collection("users").doc(userId).collection("members").doc(id).update({
    name,
    alias: alias ?? null,
    note: note ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/miembros");
  revalidatePath(`/miembros/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleMemberActive(id: string, isActive: boolean) {
  const userId = await getCurrentUserId();
  await adminDb.collection("users").doc(userId).collection("members").doc(id).update({
    isActive,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/miembros");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function regenerateMemberToken(id: string) {
  const userId = await getCurrentUserId();
  const accessToken = crypto.randomUUID();

  await adminDb.collection("users").doc(userId).collection("members").doc(id).update({
    accessToken,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/miembros/${id}`);
  return { ok: true, accessToken };
}
