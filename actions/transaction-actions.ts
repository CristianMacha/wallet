"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { transactionSchema } from "@/lib/validations/transaction";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function createTransaction(data: unknown) {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { memberId, type, amount, currency, description, date } = parsed.data;

  await adminDb
    .collection("members")
    .doc(memberId)
    .collection("transactions")
    .add({
      type,
      amount,
      currency,
      description: description ?? null,
      date: Timestamp.fromDate(new Date(date)),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}

export async function updateTransaction(
  memberId: string,
  transactionId: string,
  data: unknown
) {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { amount, currency, description, date, type } = parsed.data;

  await adminDb
    .collection("members")
    .doc(memberId)
    .collection("transactions")
    .doc(transactionId)
    .update({
      type,
      amount,
      currency,
      description: description ?? null,
      date: Timestamp.fromDate(new Date(date)),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}

export async function createCurrencyExchange(data: {
  memberId: string;
  usdAmount: number;
  penAmount: number;
  date: string;
  direction: "USD_TO_PEN" | "PEN_TO_USD";
}) {
  if (!data.memberId) return { error: "Selecciona un miembro" };
  if (!data.usdAmount || data.usdAmount <= 0) return { error: "Ingresa el monto en dólares" };
  if (!data.penAmount || data.penAmount <= 0) return { error: "Ingresa el monto en soles" };
  if (!data.date) return { error: "La fecha es obligatoria" };

  const ref = adminDb.collection("members").doc(data.memberId).collection("transactions");
  const dateTs = Timestamp.fromDate(new Date(data.date));

  const isUsdToPen = data.direction === "USD_TO_PEN";
  const description = isUsdToPen
    ? `Cambio de moneda: $${data.usdAmount} → S/.${data.penAmount}`
    : `Cambio de moneda: S/.${data.penAmount} → $${data.usdAmount}`;

  const batch = adminDb.batch();
  // El que "sale" es un gasto, el que "entra" es un depósito
  batch.set(ref.doc(), {
    type: "EXPENSE",
    amount: isUsdToPen ? data.usdAmount : data.penAmount,
    currency: isUsdToPen ? "USD" : "PEN",
    description,
    date: dateTs,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(ref.doc(), {
    type: "DEPOSIT",
    amount: isUsdToPen ? data.penAmount : data.usdAmount,
    currency: isUsdToPen ? "PEN" : "USD",
    description,
    date: dateTs,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath(`/miembros/${data.memberId}`);
  return { ok: true };
}

export async function deleteTransaction(memberId: string, transactionId: string) {
  await adminDb
    .collection("members")
    .doc(memberId)
    .collection("transactions")
    .doc(transactionId)
    .delete();

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}
