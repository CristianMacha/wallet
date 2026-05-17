import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Loan {
  id: string;
  lenderMemberId: string | null; // null = cuenta propia del usuario
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

export async function getPendingLoansByMember(userId: string): Promise<Record<string, Loan[]>> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("loans")
    .where("status", "==", "PENDING")
    .get();

  const result: Record<string, Loan[]> = {};
  for (const doc of snap.docs) {
    const data = doc.data();
    const loan: Loan = {
      id: doc.id,
      lenderMemberId: data.lenderMemberId ?? null,
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
    const key = data.lenderMemberId ?? "_user";
    if (!result[key]) result[key] = [];
    result[key].push(loan);
  }
  return result;
}

export async function getAllLoans(userId: string): Promise<Loan[]> {
  const userRef = adminDb.collection("users").doc(userId);
  const membersSnap = await userRef.collection("members").where("isActive", "==", true).get();
  const memberMap: Record<string, string> = {};
  membersSnap.docs.forEach((doc) => {
    memberMap[doc.id] = (doc.data().alias as string) || (doc.data().name as string);
  });

  const snap = await userRef.collection("loans").orderBy("createdAt", "desc").get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      lenderMemberId: data.lenderMemberId ?? null,
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
