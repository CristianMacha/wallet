import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: "DEPOSIT" | "EXPENSE";
  amount: number;
  currency: "PEN" | "USD";
  description: string | null;
  date: Date;
  createdAt: Date;
}

interface FilterOptions {
  memberId?: string;
  type?: "DEPOSIT" | "EXPENSE";
  currency?: "PEN" | "USD";
  from?: string;
  to?: string;
}

export async function getTransactions(filters: FilterOptions = {}): Promise<Transaction[]> {
  const membersSnap = await adminDb
    .collection("members")
    .where("isActive", "==", true)
    .get();

  const memberMap: Record<string, string> = {};
  const memberIds = membersSnap.docs
    .filter((doc) => !filters.memberId || doc.id === filters.memberId)
    .map((doc) => {
      memberMap[doc.id] = (doc.data().alias as string) ?? (doc.data().name as string);
      return doc.id;
    });

  const allTransactions: Transaction[] = [];

  await Promise.all(
    memberIds.map(async (memberId) => {
      let query = adminDb
        .collection("members")
        .doc(memberId)
        .collection("transactions")
        .orderBy("date", "desc")
        .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

      if (filters.type) {
        query = query.where("type", "==", filters.type);
      }
      if (filters.currency) {
        query = query.where("currency", "==", filters.currency);
      }
      if (filters.from) {
        query = query.where("date", ">=", Timestamp.fromDate(new Date(filters.from)));
      }
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.where("date", "<=", Timestamp.fromDate(toDate));
      }

      const snap = await query.get();

      for (const doc of snap.docs) {
        const data = doc.data();
        allTransactions.push({
          id: doc.id,
          memberId,
          memberName: memberMap[memberId],
          type: data.type as "DEPOSIT" | "EXPENSE",
          amount: data.amount as number,
          currency: data.currency as "PEN" | "USD",
          description: (data.description as string) ?? null,
          date: (data.date as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(0),
        });
      }
    })
  );

  // Ordenar por fecha del movimiento desc, luego por hora de registro desc
  allTransactions.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return allTransactions;
}
