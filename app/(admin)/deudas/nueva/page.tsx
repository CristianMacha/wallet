import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { DebtForm } from "@/components/debts/debt-form";

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
    alias: (doc.data().alias as string) || null,
  }));
}

export default async function NuevaDeudaPage() {
  const userId = await getCurrentUserId();
  const members = await getActiveMembers(userId);

  return (
    <>
      <PageHeader title="Nueva deuda" backHref="/deudas" />
      <DebtForm members={members} />
    </>
  );
}
