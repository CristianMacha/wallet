"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

interface CreateDebtData {
  debtorType: "SELF" | "MEMBER";
  debtorMemberId?: string;
  creditorName: string;
  totalAmount: number;
  currency: "PEN" | "USD";
  description?: string;
  date: string;
}

interface AddPaymentData {
  debtId: string;
  amount: number;
  date: string;
  note?: string;
}

export async function createDebt(data: CreateDebtData) {
  const userId = await getCurrentUserId();
  if (!data.creditorName?.trim()) return { error: "Ingresa a quién le debes" };
  if (!data.totalAmount || data.totalAmount <= 0) return { error: "El monto debe ser mayor a 0" };
  if (!data.date) return { error: "La fecha es obligatoria" };
  if (data.debtorType === "MEMBER" && !data.debtorMemberId) return { error: "Selecciona el miembro" };

  const userRef = adminDb.collection("users").doc(userId);

  let debtorName: string;
  if (data.debtorType === "SELF") {
    const userDoc = await userRef.get();
    debtorName = (userDoc.data()?.name as string) ?? "Yo";
  } else {
    const memberDoc = await userRef.collection("members").doc(data.debtorMemberId!).get();
    const md = memberDoc.data();
    debtorName = md?.alias ? `${md.name} - ${md.alias}` : (md?.name as string) ?? "";
  }

  await userRef.collection("debts").add({
    debtorType: data.debtorType,
    debtorMemberId: data.debtorType === "MEMBER" ? data.debtorMemberId : null,
    debtorName,
    creditorName: data.creditorName.trim(),
    totalAmount: data.totalAmount,
    currency: data.currency,
    description: data.description?.trim() || null,
    date: Timestamp.fromDate(new Date(data.date)),
    status: "PENDING",
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/deudas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addDebtPayment(data: AddPaymentData) {
  const userId = await getCurrentUserId();
  if (!data.amount || data.amount <= 0) return { error: "El monto debe ser mayor a 0" };
  if (!data.date) return { error: "La fecha es obligatoria" };

  const userRef = adminDb.collection("users").doc(userId);
  const debtRef = userRef.collection("debts").doc(data.debtId);
  const debtDoc = await debtRef.get();
  if (!debtDoc.exists) return { error: "Deuda no encontrada" };

  const debt = debtDoc.data()!;
  if (debt.status === "PAID") return { error: "Esta deuda ya está saldada" };

  // Calcular cuánto falta pagar
  const paymentsSnap = await debtRef.collection("payments").get();
  const paidSoFar = paymentsSnap.docs.reduce((sum, p) => sum + (p.data().amount as number), 0);
  const pending = debt.totalAmount - paidSoFar;

  if (data.amount > pending) {
    return { error: `El abono no puede superar el saldo pendiente (${pending})` };
  }

  const dateTs = Timestamp.fromDate(new Date(data.date));
  const batch = adminDb.batch();

  // Registrar el pago
  const paymentRef = debtRef.collection("payments").doc();
  batch.set(paymentRef, {
    amount: data.amount,
    date: dateTs,
    note: data.note?.trim() || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Registrar EXPENSE en la cuenta del deudor
  const description = `Abono deuda — ${debt.creditorName}${debt.description ? ` (${debt.description})` : ""}`;
  const txCol = debt.debtorType === "SELF"
    ? userRef.collection("transactions")
    : userRef.collection("members").doc(debt.debtorMemberId).collection("transactions");

  batch.set(txCol.doc(), {
    type: "EXPENSE",
    amount: data.amount,
    currency: debt.currency,
    description,
    date: dateTs,
    debtId: data.debtId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Si el abono cubre el total, marcar como PAID
  if (data.amount >= pending) {
    batch.update(debtRef, { status: "PAID" });
  }

  await batch.commit();

  revalidatePath("/deudas");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  if (debt.debtorType === "MEMBER") revalidatePath(`/miembros/${debt.debtorMemberId}`);
  return { ok: true };
}

export async function deleteDebt(debtId: string) {
  try {
    const userId = await getCurrentUserId();
    const userRef = adminDb.collection("users").doc(userId);
    const debtRef = userRef.collection("debts").doc(debtId);
    const debtDoc = await debtRef.get();
    if (!debtDoc.exists) return { error: "Deuda no encontrada" };

    const debt = debtDoc.data()!;
    const batch = adminDb.batch();

    // Borrar pagos y sus transacciones asociadas
    const paymentsSnap = await debtRef.collection("payments").get();
    paymentsSnap.docs.forEach((p) => batch.delete(p.ref));

    // Borrar transacciones con debtId
    const txCol = debt.debtorType === "SELF"
      ? userRef.collection("transactions")
      : userRef.collection("members").doc(debt.debtorMemberId).collection("transactions");
    const txSnap = await txCol.where("debtId", "==", debtId).get();
    txSnap.docs.forEach((t) => batch.delete(t.ref));

    batch.delete(debtRef);
    await batch.commit();

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/historial");
    return { ok: true };
  } catch (err) {
    console.error("[deleteDebt] error:", err);
    return { error: err instanceof Error ? err.message : "Error al eliminar la deuda" };
  }
}
