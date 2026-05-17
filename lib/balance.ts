import { adminDb } from "@/lib/firebase-admin";

export interface Balance {
  PEN: number;
  USD: number;
}

function calcBalance(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Balance {
  const balance: Balance = { PEN: 0, USD: 0 };
  for (const doc of docs) {
    const { type, amount, currency } = doc.data() as {
      type: "DEPOSIT" | "EXPENSE";
      amount: number;
      currency: "PEN" | "USD";
    };
    balance[currency] += type === "DEPOSIT" ? amount : -amount;
  }
  return balance;
}

export async function getMemberBalance(userId: string, memberId: string): Promise<Balance> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("members").doc(memberId)
    .collection("transactions")
    .get();
  return calcBalance(snap.docs);
}

export async function getUserBalance(userId: string): Promise<Balance> {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("transactions")
    .get();
  return calcBalance(snap.docs);
}

export async function getAllMembersBalances(userId: string): Promise<Record<string, Balance>> {
  const membersSnap = await adminDb
    .collection("users").doc(userId)
    .collection("members")
    .where("isActive", "==", true)
    .get();

  const results: Record<string, Balance> = {};
  await Promise.all(
    membersSnap.docs.map(async (doc) => {
      results[doc.id] = await getMemberBalance(userId, doc.id);
    })
  );
  return results;
}

export function sumBalances(balances: Balance[]): Balance {
  return balances.reduce(
    (acc, b) => ({ PEN: acc.PEN + b.PEN, USD: acc.USD + b.USD }),
    { PEN: 0, USD: 0 }
  );
}
