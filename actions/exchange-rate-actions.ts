"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { exchangeRateSchema } from "@/lib/validations/exchange-rate";
import { FieldValue } from "firebase-admin/firestore";

export async function saveExchangeRate(data: unknown) {
  const parsed = exchangeRateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await adminDb.collection("exchangeRates").add({
    rate: parsed.data.rate,
    date: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
