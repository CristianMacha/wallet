"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

interface CreateLoanData {
  lenderMemberId: string; // "_self" = cuenta propia del usuario
  borrowerType: "MEMBER" | "EXTERNAL";
  borrowerMemberId?: string;
  borrowerName: string;
  amount: number;
  currency: "PEN" | "USD";
  description?: string;
  date: string;
}

export async function createLoan(data: CreateLoanData) {
  const userId = await getCurrentUserId();
  if (!data.lenderMemberId) return { error: "Selecciona quien presta" };
  if (!data.borrowerName?.trim()) return { error: "Ingresa el nombre de quien recibe" };
  if (!data.amount || data.amount <= 0) return { error: "El monto debe ser mayor a 0" };
  if (!data.date) return { error: "La fecha es obligatoria" };
  if (data.borrowerType === "MEMBER" && !data.borrowerMemberId) return { error: "Selecciona el miembro que recibe" };
  if (data.borrowerType === "MEMBER" && data.borrowerMemberId === data.lenderMemberId) return { error: "El prestamista y el receptor no pueden ser el mismo" };

  const userRef = adminDb.collection("users").doc(userId);

  let lenderName: string;
  if (data.lenderMemberId === "_self") {
    const userDoc = await adminDb.collection("users").doc(userId).get();
    lenderName = (userDoc.data()?.name as string) ?? "Yo";
  } else {
    const lenderDoc = await userRef.collection("members").doc(data.lenderMemberId).get();
    lenderName = (lenderDoc.data()?.alias as string) ?? (lenderDoc.data()?.name as string) ?? "";
  }

  const dateTs = Timestamp.fromDate(new Date(data.date));
  const batch = adminDb.batch();

  const loanRef = userRef.collection("loans").doc();
  batch.set(loanRef, {
    lenderMemberId: data.lenderMemberId === "_self" ? null : data.lenderMemberId,
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
  const lenderTxRef = data.lenderMemberId === "_self"
    ? userRef.collection("transactions").doc()
    : userRef.collection("members").doc(data.lenderMemberId).collection("transactions").doc();

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
    const borrowerTxRef = data.borrowerMemberId === "_self"
      ? userRef.collection("transactions").doc()
      : userRef.collection("members").doc(data.borrowerMemberId).collection("transactions").doc();

    batch.set(borrowerTxRef, {
      type: "DEPOSIT",
      amount: data.amount,
      currency: data.currency,
      description: `Préstamo recibido de ${lenderName}${data.description?.trim() ? ` — ${data.description.trim()}` : ""}`,
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
  return { ok: true };
}

export async function deleteLoan(loanId: string) {
  try {
    const userId = await getCurrentUserId();
    const userRef = adminDb.collection("users").doc(userId);
    const loanDoc = await userRef.collection("loans").doc(loanId).get();
    if (!loanDoc.exists) return { error: "Préstamo no encontrado" };

    const loan = loanDoc.data()!;
    const batch = adminDb.batch();

    // Borrar transacciones del prestamista que tengan este loanId
    const lenderCollection = loan.lenderMemberId === null
      ? userRef.collection("transactions")
      : userRef.collection("members").doc(loan.lenderMemberId).collection("transactions");
    const lenderTxs = await lenderCollection.where("loanId", "==", loanId).get();
    lenderTxs.docs.forEach((doc) => batch.delete(doc.ref));

    // Borrar transacciones del receptor si era miembro
    if (loan.borrowerType === "MEMBER" && loan.borrowerMemberId) {
      const borrowerCollection = loan.borrowerMemberId === "_self"
        ? userRef.collection("transactions")
        : userRef.collection("members").doc(loan.borrowerMemberId).collection("transactions");
      const borrowerTxs = await borrowerCollection.where("loanId", "==", loanId).get();
      borrowerTxs.docs.forEach((doc) => batch.delete(doc.ref));
    }

    batch.delete(userRef.collection("loans").doc(loanId));
    await batch.commit();

    revalidatePath("/dashboard");
    revalidatePath("/historial");
    revalidatePath("/prestamos");
    return { ok: true };
  } catch (err) {
    console.error("[deleteLoan] error:", err);
    return { error: err instanceof Error ? err.message : "Error al eliminar el préstamo" };
  }
}

export async function markLoanReturned(loanId: string) {
  const userId = await getCurrentUserId();
  const userRef = adminDb.collection("users").doc(userId);
  const loanDoc = await userRef.collection("loans").doc(loanId).get();
  if (!loanDoc.exists) return { error: "Préstamo no encontrado" };

  const loan = loanDoc.data()!;
  if (loan.status === "RETURNED") return { error: "Este préstamo ya fue marcado como devuelto" };

  const now = Timestamp.now();
  const batch = adminDb.batch();

  batch.update(userRef.collection("loans").doc(loanId), {
    status: "RETURNED",
    returnedAt: FieldValue.serverTimestamp(),
  });

  const description = `Devolución de préstamo — ${loan.borrowerName}`;

  // DEPOSIT al que prestó
  const lenderTxRef = loan.lenderMemberId === null
    ? userRef.collection("transactions").doc()
    : userRef.collection("members").doc(loan.lenderMemberId).collection("transactions").doc();

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

  // Si era entre miembros: EXPENSE del que recibió
  if (loan.borrowerType === "MEMBER" && loan.borrowerMemberId) {
    const borrowerTxRef = loan.borrowerMemberId === "_self"
      ? userRef.collection("transactions").doc()
      : userRef.collection("members").doc(loan.borrowerMemberId).collection("transactions").doc();

    batch.set(borrowerTxRef, {
      type: "EXPENSE",
      amount: loan.amount,
      currency: loan.currency,
      description: `Devolución de préstamo a ${loan.lenderName}`,
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
  return { ok: true };
}
