import { adminDb } from "@/lib/firebase-admin";
import { getAllMembersBalances, sumBalances } from "@/lib/balance";
import { getLatestExchangeRate } from "@/lib/exchange-rate";
import { getPendingLoansByMember } from "@/lib/loans";
import { PageHeader } from "@/components/layout/page-header";
import { MemberBalanceCard } from "@/components/dashboard/member-balance-card";
import { TotalsSummary } from "@/components/dashboard/totals-summary";
import { ExchangeRateBanner } from "@/components/dashboard/exchange-rate-banner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

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

export default async function DashboardPage() {
  const [members, exchangeRate, pendingLoansByMember, balances] = await Promise.all([
    getActiveMembers(),
    getLatestExchangeRate(),
    getPendingLoansByMember(),
    getAllMembersBalances(),
  ]);
  const total = sumBalances(members.map((m) => balances[m.id] ?? { PEN: 0, USD: 0 }));

  return (
    <>
      <PageHeader
        title="FamilyWallet"
        action={
          <Link href="/transaction/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground text-sm">No hay miembros activos aún.</p>
            <Link href="/miembros/nuevo">
              <Button variant="outline" size="sm">Agregar miembro</Button>
            </Link>
          </div>
        ) : (
          <>
            <ExchangeRateBanner
              rate={exchangeRate?.rate ?? null}
              date={exchangeRate?.date ?? null}
              isToday={exchangeRate?.isToday ?? false}
            />
            <TotalsSummary total={total} />

            <section className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Miembros
              </h2>
              <div className="space-y-2">
                {members.map((m) => (
                  <MemberBalanceCard
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    alias={m.alias}
                    balance={balances[m.id] ?? { PEN: 0, USD: 0 }}
                    pendingLoans={pendingLoansByMember[m.id] ?? []}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
