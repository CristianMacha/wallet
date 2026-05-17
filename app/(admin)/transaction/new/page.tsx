import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { NewTransactionPanel } from "@/components/transactions/new-transaction-panel";
import { getTransactions } from "@/lib/transactions";
import { format } from "date-fns";

async function getActiveMembers(userId: string) {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("members")
    .where("isActive", "==", true)
    .orderBy("createdAt")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    alias: (doc.data().alias as string) ?? null,
  }));
}

export default async function NewTransactionPage() {
  const userId = await getCurrentUserId();
  const today = format(new Date(), "yyyy-MM-dd");

  const [members, todayTransactions] = await Promise.all([
    getActiveMembers(userId),
    getTransactions(userId, { from: today, to: today }),
  ]);

  return (
    <>
      <PageHeader title="Nuevo movimiento" backHref="/dashboard" />
      <NewTransactionPanel members={members} todayTransactions={todayTransactions} />
    </>
  );
}
