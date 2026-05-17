import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/layout/page-header";
import { NewTransactionPanel } from "@/components/transactions/new-transaction-panel";
import { getTransactions } from "@/lib/transactions";
import { format } from "date-fns";

async function getActiveMembers() {
  const snap = await adminDb
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
  const today = format(new Date(), "yyyy-MM-dd");

  const [members, todayTransactions] = await Promise.all([
    getActiveMembers(),
    getTransactions({ from: today, to: today }),
  ]);

  return (
    <>
      <PageHeader title="Nuevo movimiento" backHref="/dashboard" />
      <NewTransactionPanel members={members} todayTransactions={todayTransactions} />
    </>
  );
}
