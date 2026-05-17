import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { getMemberBalance, getUserBalance } from "@/lib/balance";
import { getTransactions, getUserTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { ReportWrapper } from "@/components/reports/report-wrapper";
import { MonthPicker } from "@/components/reports/month-picker";
import { ReportFilters } from "@/components/reports/report-filters";
import { format } from "date-fns";
import { Suspense } from "react";
import type { Balance } from "@/lib/balance";
import type { Transaction } from "@/lib/transactions";

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

function filterByMonth(transactions: Transaction[], month: string): Transaction[] {
  const [year, m] = month.split("-").map(Number);
  return transactions.filter((tx) =>
    tx.date.getFullYear() === year && tx.date.getMonth() + 1 === m
  );
}

function calcBalance(transactions: Transaction[]): Balance {
  return transactions.reduce(
    (acc, tx) => {
      const delta = tx.type === "DEPOSIT" ? tx.amount : -tx.amount;
      return { ...acc, [tx.currency]: acc[tx.currency as keyof Balance] + delta };
    },
    { PEN: 0, USD: 0 }
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; memberId?: string }>;
}) {
  const userId = await getCurrentUserId();
  const { month, memberId } = await searchParams;
  const selectedMonth = month ?? format(new Date(), "yyyy-MM");

  const [allMembers, userDoc] = await Promise.all([
    getActiveMembers(userId),
    adminDb.collection("users").doc(userId).get(),
  ]);
  const userName = (userDoc.data()?.name as string) ?? "Mi cuenta";

  const isSelf = memberId === "_self";
  const hasMemberFilter = !!memberId && !isSelf;
  // Si filtra por "_self" no mostrar miembros; si filtra por miembro no mostrar mi cuenta
  const filteredMembers = isSelf
    ? []
    : hasMemberFilter
      ? allMembers.filter((m) => m.id === memberId)
      : allMembers;

  // Reporte de miembros
  const memberReports = await Promise.all(
    filteredMembers.map(async (member) => {
      const [allTx, cumulativeBalance] = await Promise.all([
        getTransactions(userId, { memberId: member.id }),
        getMemberBalance(userId, member.id),
      ]);
      const monthTransactions = filterByMonth(allTx, selectedMonth);
      return { id: member.id, name: member.name, alias: member.alias, monthBalance: calcBalance(monthTransactions), cumulativeBalance, transactions: monthTransactions };
    })
  );

  // Reporte de cuenta propia (omitir si filtra por un miembro específico)
  const selfReport = !hasMemberFilter ? await (async () => {
    const [allTx, cumulativeBalance] = await Promise.all([
      getUserTransactions(userId, userName),
      getUserBalance(userId),
    ]);
    const monthTransactions = filterByMonth(allTx, selectedMonth);
    return { id: "_self", name: userName, alias: null, monthBalance: calcBalance(monthTransactions), cumulativeBalance, transactions: monthTransactions };
  })() : null;

  // Mi cuenta va primero si no filtra por miembro específico
  const allReports = [
    ...(selfReport ? [selfReport] : []),
    ...memberReports,
  ];

  // Para el filtro de ReportFilters, incluir "Mi cuenta"
  const filterMembers = allMembers;

  return (
    <>
      <PageHeader title="Reportes" />
      <div className="px-4 py-4 space-y-3">
        <MonthPicker value={selectedMonth} />
        <Suspense>
          <ReportFilters members={filterMembers} showSelf />
        </Suspense>
        {allReports.every((m) => m.transactions.length === 0) ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Sin movimientos en este mes.
          </p>
        ) : (
          <ReportWrapper month={selectedMonth} members={allReports} />
        )}
      </div>
    </>
  );
}
