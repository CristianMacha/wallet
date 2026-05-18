import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Debt {
  id: string;
  debtorType: "SELF" | "MEMBER";
  debtorMemberId: string | null;
  debtorName: string;
  creditorName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  currency: "PEN" | "USD";
  description: string | null;
  date: Date;
  status: "PENDING" | "PAID";
  createdAt: Date;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: Date;
  note: string | null;
  createdAt: Date;
}

export async function getAllDebts(userId: string): Promise<Debt[]> {
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.collection("debts").orderBy("createdAt", "desc").get();

  const debts = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const paymentsSnap = await doc.ref.collection("payments").get();
      const paidAmount = paymentsSnap.docs.reduce((sum, p) => sum + (p.data().amount as number), 0);
      const pendingAmount = Math.max(0, (data.totalAmount as number) - paidAmount);
      return {
        id: doc.id,
        debtorType: data.debtorType as "SELF" | "MEMBER",
        debtorMemberId: data.debtorMemberId ?? null,
        debtorName: data.debtorName as string,
        creditorName: data.creditorName as string,
        totalAmount: data.totalAmount as number,
        paidAmount,
        pendingAmount,
        currency: data.currency as "PEN" | "USD",
        description: (data.description as string) || null,
        date: (data.date as Timestamp).toDate(),
        status: data.status as "PENDING" | "PAID",
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
      };
    })
  );

  return debts;
}

export async function getPendingDebts(userId: string): Promise<Debt[]> {
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.collection("debts").where("status", "==", "PENDING").orderBy("createdAt", "desc").get();

  const debts = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const paymentsSnap = await doc.ref.collection("payments").get();
      const paidAmount = paymentsSnap.docs.reduce((sum, p) => sum + (p.data().amount as number), 0);
      const pendingAmount = Math.max(0, (data.totalAmount as number) - paidAmount);
      return {
        id: doc.id,
        debtorType: data.debtorType as "SELF" | "MEMBER",
        debtorMemberId: data.debtorMemberId ?? null,
        debtorName: data.debtorName as string,
        creditorName: data.creditorName as string,
        totalAmount: data.totalAmount as number,
        paidAmount,
        pendingAmount,
        currency: data.currency as "PEN" | "USD",
        description: (data.description as string) || null,
        date: (data.date as Timestamp).toDate(),
        status: data.status as "PENDING" | "PAID",
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
      };
    })
  );

  return debts;
}

export async function getDebtPayments(userId: string, debtId: string): Promise<DebtPayment[]> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("debts").doc(debtId)
    .collection("payments")
    .orderBy("date", "desc")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      amount: data.amount as number,
      date: (data.date as Timestamp).toDate(),
      note: (data.note as string) || null,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
    };
  });
}
