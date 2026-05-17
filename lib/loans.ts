import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Loan {
  id: string;
  lenderMemberId: string;
  lenderName: string;
  borrowerType: "MEMBER" | "EXTERNAL";
  borrowerMemberId: string | null;
  borrowerName: string;
  amount: number;
  currency: "PEN" | "USD";
  description: string | null;
  date: Date;
  status: "PENDING" | "RETURNED";
  createdAt: Date;
}

export async function getPendingLoansByMember(): Promise<Record<string, Loan[]>> {
  const snap = await adminDb
    .collection("loans")
    .where("status", "==", "PENDING")
    .get();

  const result: Record<string, Loan[]> = {};

  for (const doc of snap.docs) {
    const data = doc.data();
    const loan: Loan = {
      id: doc.id,
      lenderMemberId: data.lenderMemberId,
      lenderName: data.lenderName,
      borrowerType: data.borrowerType,
      borrowerMemberId: data.borrowerMemberId ?? null,
      borrowerName: data.borrowerName,
      amount: data.amount,
      currency: data.currency,
      description: data.description ?? null,
      date: (data.date as Timestamp).toDate(),
      status: data.status,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
    };

    if (!result[data.lenderMemberId]) result[data.lenderMemberId] = [];
    result[data.lenderMemberId].push(loan);
  }

  return result;
}

export async function getAllLoans(): Promise<Loan[]> {
  const membersSnap = await adminDb.collection("members").where("isActive", "==", true).get();
  const memberMap: Record<string, string> = {};
  membersSnap.docs.forEach((doc) => {
    memberMap[doc.id] = (doc.data().alias as string) ?? (doc.data().name as string);
  });

  const snap = await adminDb.collection("loans").orderBy("createdAt", "desc").get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      lenderMemberId: data.lenderMemberId,
      lenderName: memberMap[data.lenderMemberId] ?? data.lenderName,
      borrowerType: data.borrowerType,
      borrowerMemberId: data.borrowerMemberId ?? null,
      borrowerName: data.borrowerType === "MEMBER"
        ? (memberMap[data.borrowerMemberId] ?? data.borrowerName)
        : data.borrowerName,
      amount: data.amount,
      currency: data.currency,
      description: data.description ?? null,
      date: (data.date as Timestamp).toDate(),
      status: data.status,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
    };
  });
}
