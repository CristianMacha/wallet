"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

interface CreateLoanData {
  lenderMemberId: string;
  borrowerType: "MEMBER" | "EXTERNAL";
  borrowerMemberId?: string;
  borrowerName: string;
  amount: number;
  currency: "PEN" | "USD";
  description?: string;
  date: string;
}

export async function createLoan(data: CreateLoanData) {
  if (!data.lenderMemberId) return { error: "Selecciona el miembro que presta" };
  if (!data.borrowerName?.trim()) return { error: "Ingresa el nombre de quien recibe" };
  if (!data.amount || data.amount <= 0) return { error: "El monto debe ser mayor a 0" };
  if (!data.date) return { error: "La fecha es obligatoria" };
  if (data.borrowerType === "MEMBER" && !data.borrowerMemberId) return { error: "Selecciona el miembro que recibe" };
  if (data.borrowerType === "MEMBER" && data.borrowerMemberId === data.lenderMemberId) return { error: "El prestamista y el receptor no pueden ser el mismo" };

  const lenderDoc = await adminDb.collection("members").doc(data.lenderMemberId).get();
  const lenderData = lenderDoc.data();
  const lenderName = (lenderData?.alias as string) ?? (lenderData?.name as string) ?? "";

  const dateTs = Timestamp.fromDate(new Date(data.date));
  const batch = adminDb.batch();

  // Crear el préstamo
  const loanRef = adminDb.collection("loans").doc();
  batch.set(loanRef, {
    lenderMemberId: data.lenderMemberId,
    lenderName,
    borrowerType: data.borrowerType,
    borrowerMemberId: data.borrowerMemberId ?? null,
    borrowerName: data.borrowerName.trim(),
    amount: data.amount,
    currency: data.currency,
    description: data.description?.trim() || null,
    date: dateTs,
    status: "PENDING",
    createdAt: FieldValue.serverTimestamp(),
  });

  const description = data.description?.trim()
    ? `Préstamo a ${data.borrowerName.trim()} — ${data.description.trim()}`
    : `Préstamo a ${data.borrowerName.trim()}`;

  // EXPENSE del que presta
  const lenderTxRef = adminDb.collection("members").doc(data.lenderMemberId).collection("transactions").doc();
  batch.set(lenderTxRef, {
    type: "EXPENSE",
    amount: data.amount,
    currency: data.currency,
    description,
    date: dateTs,
    loanId: loanRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Si es entre miembros: DEPOSIT del que recibe
  if (data.borrowerType === "MEMBER" && data.borrowerMemberId) {
    const lenderShort = lenderData?.alias ?? lenderData?.name ?? "";
    const borrowerTxRef = adminDb.collection("members").doc(data.borrowerMemberId).collection("transactions").doc();
    batch.set(borrowerTxRef, {
      type: "DEPOSIT",
      amount: data.amount,
      currency: data.currency,
      description: `Préstamo recibido de ${lenderShort}${data.description?.trim() ? ` — ${data.description.trim()}` : ""}`,
      date: dateTs,
      loanId: loanRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/prestamos");
  revalidatePath(`/miembros/${data.lenderMemberId}`);
  if (data.borrowerType === "MEMBER" && data.borrowerMemberId) {
    revalidatePath(`/miembros/${data.borrowerMemberId}`);
  }
  return { ok: true };
}

export async function markLoanReturned(loanId: string) {
  const loanDoc = await adminDb.collection("loans").doc(loanId).get();
  if (!loanDoc.exists) return { error: "Préstamo no encontrado" };

  const loan = loanDoc.data()!;
  if (loan.status === "RETURNED") return { error: "Este préstamo ya fue marcado como devuelto" };

  const now = Timestamp.now();
  const batch = adminDb.batch();

  // Marcar el préstamo como devuelto
  batch.update(adminDb.collection("loans").doc(loanId), {
    status: "RETURNED",
    returnedAt: FieldValue.serverTimestamp(),
  });

  const description = `Devolución de préstamo — ${loan.borrowerName}`;

  // DEPOSIT al que prestó (le devuelven el dinero)
  const lenderTxRef = adminDb.collection("members").doc(loan.lenderMemberId).collection("transactions").doc();
  batch.set(lenderTxRef, {
    type: "DEPOSIT",
    amount: loan.amount,
    currency: loan.currency,
    description,
    date: now,
    loanId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Si era entre miembros: EXPENSE del que recibió (devuelve)
  if (loan.borrowerType === "MEMBER" && loan.borrowerMemberId) {
    const lenderShort = loan.lenderName;
    const borrowerTxRef = adminDb.collection("members").doc(loan.borrowerMemberId).collection("transactions").doc();
    batch.set(borrowerTxRef, {
      type: "EXPENSE",
      amount: loan.amount,
      currency: loan.currency,
      description: `Devolución de préstamo a ${lenderShort}`,
      date: now,
      loanId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/prestamos");
  revalidatePath(`/miembros/${loan.lenderMemberId}`);
  if (loan.borrowerType === "MEMBER" && loan.borrowerMemberId) {
    revalidatePath(`/miembros/${loan.borrowerMemberId}`);
  }
  return { ok: true };
}
