import { adminDb } from "@/lib/firebase-admin";
import { getTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Suspense } from "react";

const PAGE_SIZE = 30;

async function getActiveMembers() {
  const snap = await adminDb
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
  const filters = await searchParams;
  const page = Math.max(1, parseInt(filters.page ?? "1"));

  const [members, allTransactions] = await Promise.all([
    getActiveMembers(),
    getTransactions({
      memberId: filters.memberId,
      type: filters.type as "DEPOSIT" | "EXPENSE" | undefined,
      currency: filters.currency as "PEN" | "USD" | undefined,
      from: filters.from,
      to: filters.to,
    }),
  ]);

  const filtered = filters.q
    ? allTransactions.filter((tx) =>
        tx.description?.toLowerCase().includes(filters.q!.toLowerCase())
      )
    : allTransactions;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const transactions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {transactions.map((tx) => (
                <TransactionItem
                  key={`${tx.memberId}-${tx.id}`}
                  {...tx}
                  showMember
                />
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
