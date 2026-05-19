import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { getTransactions, getUserTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE = 30;

async function getActiveMembers(userId: string) {
  const snap = await adminDb
    .collection("users").doc(userId)
    .collection("members")
    .where("isActive", "==", true)
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    alias: (doc.data().alias as string) ?? null,
  }));
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{
    memberId?: string;
    type?: string;
    currency?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const userId = await getCurrentUserId();
  const filters = await searchParams;
  const page = Math.max(1, parseInt(filters.page ?? "1"));

  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userName = (userDoc.data()?.name as string) ?? "Mi cuenta";

  const txFilters = {
    type: filters.type as "DEPOSIT" | "EXPENSE" | undefined,
    currency: filters.currency as "PEN" | "USD" | undefined,
    from: filters.from,
    to: filters.to,
  };

  const isSelf = filters.memberId === "_self";
  const hasMemberFilter = !!filters.memberId && !isSelf;

  const [members, memberTxs, userTxs] = await Promise.all([
    getActiveMembers(userId),
    // Si filtra por "_self" no traer miembros, si no filtra traer todos
    isSelf
      ? Promise.resolve([])
      : getTransactions(userId, { ...txFilters, memberId: hasMemberFilter ? filters.memberId : undefined }),
    // Si filtra por un miembro específico no traer cuenta propia
    hasMemberFilter
      ? Promise.resolve([])
      : getUserTransactions(userId, userName, txFilters),
  ]);

  const allTransactions = [...userTxs, ...memberTxs].sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime();
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime();
  });

  const filtered = filters.q
    ? allTransactions.filter((tx) =>
        tx.description?.toLowerCase().includes(filters.q!.toLowerCase())
      )
    : allTransactions;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const transactions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Agrupar por fecha
  const groups: { label: string; txs: typeof transactions }[] = [];
  for (const tx of transactions) {
    const key = format(tx.date, "yyyy-MM-dd");
    const label = format(tx.date, "EEEE d 'de' MMMM", { locale: es });
    const last = groups[groups.length - 1];
    if (last && format(last.txs[0].date, "yyyy-MM-dd") === key) {
      last.txs.push(tx);
    } else {
      groups.push({ label: label.charAt(0).toUpperCase() + label.slice(1), txs: [tx] });
    }
  }

  return (
    <>
      <PageHeader title="Historial" />
      <div className="px-4 py-4 space-y-4">
        <Suspense>
          <TransactionFilters members={members} showMemberFilter />
        </Suspense>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No hay movimientos con esos filtros.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
              {totalPages > 1 && ` · página ${page} de ${totalPages}`}
            </p>
            <div className="space-y-3">
              {groups.map(({ label, txs }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-muted-foreground px-1 pb-1.5">{label}</p>
                  <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                    {txs.map((tx) => (
                      <TransactionItem
                        key={`${tx.memberId}-${tx.id}`}
                        {...tx}
                        showMember
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationControls page={page} totalPages={totalPages} />
            )}
          </>
        )}
      </div>
    </>
  );
}
