"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { exchangeRateSchema } from "@/lib/validations/exchange-rate";
import { FieldValue } from "firebase-admin/firestore";

export async function saveExchangeRate(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = exchangeRateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await adminDb.collection("users").doc(userId).collection("exchangeRates").add({
    rate: parsed.data.rate,
    date: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
