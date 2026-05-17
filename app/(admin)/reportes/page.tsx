import { adminDb } from "@/lib/firebase-admin";
import { getMemberBalance } from "@/lib/balance";
import { getTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { ReportWrapper } from "@/components/reports/report-wrapper";
import { MonthPicker } from "@/components/reports/month-picker";
import { ReportFilters } from "@/components/reports/report-filters";
import { format } from "date-fns";
import { Suspense } from "react";
import type { Balance } from "@/lib/balance";
import type { Transaction } from "@/lib/transactions";

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

function filterByMonth(transactions: Transaction[], month: string): Transaction[] {
  const [year, m] = month.split("-").map(Number);
  return transactions.filter((tx) => {
    return tx.date.getFullYear() === year && tx.date.getMonth() + 1 === m;
  });
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
  const { month, memberId } = await searchParams;
  const selectedMonth = month ?? format(new Date(), "yyyy-MM");

  const allMembers = await getActiveMembers();
  const filteredMembers = memberId
    ? allMembers.filter((m) => m.id === memberId)
    : allMembers;

  const memberReports = await Promise.all(
    filteredMembers.map(async (member) => {
      const [allTransactions, cumulativeBalance] = await Promise.all([
        getTransactions({ memberId: member.id }),
        getMemberBalance(member.id),
      ]);

      const monthTransactions = filterByMonth(allTransactions, selectedMonth);
      const monthBalance = calcBalance(monthTransactions);

      return {
        ...member,
        monthBalance,
        cumulativeBalance,
        transactions: monthTransactions,
      };
    })
  );

  return (
    <>
      <PageHeader title="Reportes" />
      <div className="px-4 py-4 space-y-3">
        <MonthPicker value={selectedMonth} />
        <Suspense>
          <ReportFilters members={allMembers} />
        </Suspense>
        {memberReports.every((m) => m.transactions.length === 0) ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Sin movimientos en este mes.
          </p>
        ) : (
          <ReportWrapper month={selectedMonth} members={memberReports} />
        )}
      </div>
    </>
  );
}
