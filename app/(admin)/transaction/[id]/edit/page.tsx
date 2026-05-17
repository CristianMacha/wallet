import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import { format } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";

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

async function getTransaction(userId: string, memberId: string, transactionId: string) {
  const userRef = adminDb.collection("users").doc(userId);
  const txRef = memberId === "_self"
    ? userRef.collection("transactions").doc(transactionId)
    : userRef.collection("members").doc(memberId).collection("transactions").doc(transactionId);

  const doc = await txRef.get();
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
  const userId = await getCurrentUserId();
  const { id } = await params;
  const { memberId } = await searchParams;

  if (!memberId) notFound();

  const [members, transaction] = await Promise.all([
    getActiveMembers(userId),
    getTransaction(userId, memberId, id),
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
