import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/layout/page-header";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import { format } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";

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

async function getTransaction(memberId: string, transactionId: string) {
  const doc = await adminDb
    .collection("members")
    .doc(memberId)
    .collection("transactions")
    .doc(transactionId)
    .get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    memberId,
    type: data.type as "DEPOSIT" | "EXPENSE",
    amount: data.amount as number,
    currency: data.currency as "PEN" | "USD",
    description: (data.description as string) ?? "",
    date: format((data.date as Timestamp).toDate(), "yyyy-MM-dd"),
  };
}

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ memberId?: string }>;
}) {
  const { id } = await params;
  const { memberId } = await searchParams;

  if (!memberId) notFound();

  const [members, transaction] = await Promise.all([
    getActiveMembers(),
    getTransaction(memberId, id),
  ]);

  if (!transaction) notFound();

  return (
    <>
      <PageHeader title="Editar movimiento" backHref="/historial" />
      <EditTransactionForm
        members={members}
        defaultValues={transaction}
        memberId={memberId}
        transactionId={id}
      />
    </>
  );
}
