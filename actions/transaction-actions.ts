"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { transactionSchema } from "@/lib/validations/transaction";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function createTransaction(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { memberId, type, amount, currency, description, date } = parsed.data;
  const userRef = adminDb.collection("users").doc(userId);

  // Si memberId es "_self", va a la cuenta propia del usuario
  const txRef = memberId === "_self"
    ? userRef.collection("transactions")
    : userRef.collection("members").doc(memberId).collection("transactions");

  await txRef.add({
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
  if (memberId !== "_self") revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}

export async function updateTransaction(memberId: string, transactionId: string, data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { amount, currency, description, date, type } = parsed.data;
  const userRef = adminDb.collection("users").doc(userId);

  const txRef = memberId === "_self"
    ? userRef.collection("transactions").doc(transactionId)
    : userRef.collection("members").doc(memberId).collection("transactions").doc(transactionId);

  await txRef.update({
    type,
    amount,
    currency,
    description: description ?? null,
    date: Timestamp.fromDate(new Date(date)),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  if (memberId !== "_self") revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}

export async function createCurrencyExchange(data: {
  memberId: string;
  usdAmount: number;
  penAmount: number;
  date: string;
  direction: "USD_TO_PEN" | "PEN_TO_USD";
}) {
  const userId = await getCurrentUserId();
  if (!data.memberId) return { error: "Selecciona un miembro" };
  if (!data.usdAmount || data.usdAmount <= 0) return { error: "Ingresa el monto en dólares" };
  if (!data.penAmount || data.penAmount <= 0) return { error: "Ingresa el monto en soles" };
  if (!data.date) return { error: "La fecha es obligatoria" };

  const userRef = adminDb.collection("users").doc(userId);
  const txRef = data.memberId === "_self"
    ? userRef.collection("transactions")
    : userRef.collection("members").doc(data.memberId).collection("transactions");

  const dateTs = Timestamp.fromDate(new Date(data.date));
  const isUsdToPen = data.direction === "USD_TO_PEN";
  const description = isUsdToPen
    ? `Cambio de moneda: $${data.usdAmount} → S/.${data.penAmount}`
    : `Cambio de moneda: S/.${data.penAmount} → $${data.usdAmount}`;

  const batch = adminDb.batch();
  batch.set(txRef.doc(), {
    type: "EXPENSE",
    amount: isUsdToPen ? data.usdAmount : data.penAmount,
    currency: isUsdToPen ? "USD" : "PEN",
    description,
    date: dateTs,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(txRef.doc(), {
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
  if (data.memberId !== "_self") revalidatePath(`/miembros/${data.memberId}`);
  return { ok: true };
}

export async function deleteTransaction(memberId: string, transactionId: string) {
  const userId = await getCurrentUserId();
  const userRef = adminDb.collection("users").doc(userId);

  const txRef = memberId === "_self"
    ? userRef.collection("transactions").doc(transactionId)
    : userRef.collection("members").doc(memberId).collection("transactions").doc(transactionId);

  // Si la transacción tiene un loanId, eliminar también el loan y todas sus transacciones asociadas
  const txDoc = await txRef.get();
  const loanId: string | null = txDoc.data()?.loanId ?? null;

  const batch = adminDb.batch();
  batch.delete(txRef);

  if (loanId) {
    const loanRef = userRef.collection("loans").doc(loanId);
    const loanDoc = await loanRef.get();
    if (loanDoc.exists) {
      const loan = loanDoc.data()!;

      // Borrar todas las transacciones vinculadas al loan (del prestamista)
      const lenderCol = loan.lenderMemberId === null
        ? userRef.collection("transactions")
        : userRef.collection("members").doc(loan.lenderMemberId).collection("transactions");
      const lenderTxs = await lenderCol.where("loanId", "==", loanId).get();
      lenderTxs.docs.forEach((doc) => { if (doc.id !== transactionId) batch.delete(doc.ref); });

      // Borrar transacciones del receptor si era miembro
      if (loan.borrowerType === "MEMBER" && loan.borrowerMemberId) {
        const borrowerCol = loan.borrowerMemberId === "_self"
          ? userRef.collection("transactions")
          : userRef.collection("members").doc(loan.borrowerMemberId).collection("transactions");
        const borrowerTxs = await borrowerCol.where("loanId", "==", loanId).get();
        borrowerTxs.docs.forEach((doc) => { if (doc.id !== transactionId) batch.delete(doc.ref); });
      }

      batch.delete(loanRef);
    }
  }

  await batch.commit();

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/prestamos");
  if (memberId !== "_self") revalidatePath(`/miembros/${memberId}`);
  return { ok: true };
}
