import { adminDb } from "@/lib/firebase-admin";

export interface Balance {
  PEN: number;
  USD: number;
}

export async function getMemberBalance(memberId: string): Promise<Balance> {
  const snap = await adminDb
    .collection("members")
    .doc(memberId)
    .collection("transactions")
    .get();

  const balance: Balance = { PEN: 0, USD: 0 };

  for (const doc of snap.docs) {
    const { type, amount, currency } = doc.data() as {
      type: "DEPOSIT" | "EXPENSE";
      amount: number;
      currency: "PEN" | "USD";
    };
    const delta = type === "DEPOSIT" ? amount : -amount;
    balance[currency] = (balance[currency] ?? 0) + delta;
  }

  return balance;
}

export async function getAllMembersBalances(): Promise<
  Record<string, Balance>
> {
  const membersSnap = await adminDb
    .collection("members")
    .where("isActive", "==", true)
    .get();

  const results: Record<string, Balance> = {};

  await Promise.all(
    membersSnap.docs.map(async (memberDoc) => {
      results[memberDoc.id] = await getMemberBalance(memberDoc.id);
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
