import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { getAllMembersBalances, getUserBalance, sumBalances } from "@/lib/balance";
import { getLatestExchangeRate } from "@/lib/exchange-rate";
import { getPendingLoansByMember } from "@/lib/loans";
import { getPendingDebts } from "@/lib/debts";
import { PageHeader } from "@/components/layout/page-header";
import { MemberBalanceCard } from "@/components/dashboard/member-balance-card";
import { TotalsSummary } from "@/components/dashboard/totals-summary";
import { ExchangeRateBanner } from "@/components/dashboard/exchange-rate-banner";
import { BalanceDisplay } from "@/components/shared/balance-display";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, CreditCard } from "lucide-react";

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

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  const [members, exchangeRate, pendingLoansByMember, memberBalances, userBalance, pendingDebts] = await Promise.all([
    getActiveMembers(userId),
    getLatestExchangeRate(userId),
    getPendingLoansByMember(userId),
    getAllMembersBalances(userId),
    getUserBalance(userId),
    getPendingDebts(userId),
  ]);

  const total = sumBalances([
    userBalance,
    ...members.map((m) => memberBalances[m.id] ?? { PEN: 0, USD: 0 }),
  ]);

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
        <ExchangeRateBanner
          rate={exchangeRate?.rate ?? null}
          date={exchangeRate?.date ?? null}
          isToday={exchangeRate?.isToday ?? false}
        />
        <TotalsSummary total={total} />

        {/* Mi cuenta */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mi cuenta
          </h2>
          <Link
            href="/mi-cuenta"
            className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Mi cuenta personal</p>
              <BalanceDisplay balance={userBalance} />
              {(pendingLoansByMember["_user"] ?? []).length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Préstamo pendiente:{" "}
                  {Object.entries(
                    (pendingLoansByMember["_user"] ?? []).reduce((acc, l) => {
                      acc[l.currency] = (acc[l.currency] ?? 0) + l.amount;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .map(([cur, amt]) => formatCurrency(amt, cur as "PEN" | "USD"))
                    .join(" + ")}
                </p>
              )}
            </div>
          </Link>
        </section>

        {/* Deudas pendientes */}
        {pendingDebts.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deudas pendientes
              </h2>
              <Link href="/deudas" className="text-xs text-primary">Ver todas</Link>
            </div>
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {pendingDebts.map((debt) => {
                const progress = debt.totalAmount > 0
                  ? Math.round((debt.paidAmount / debt.totalAmount) * 100)
                  : 0;
                return (
                  <Link key={debt.id} href="/deudas" className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors">
                    <CreditCard className="h-4 w-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {debt.debtorName} → {debt.creditorName}
                      </p>
                      {debt.description && (
                        <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-destructive tabular-nums">
                        {formatCurrency(debt.pendingAmount, debt.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        de {formatCurrency(debt.totalAmount, debt.currency)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Miembros */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Miembros
          </h2>
          {members.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground text-sm">No hay miembros activos aún.</p>
              <Link href="/miembros/nuevo">
                <Button variant="outline" size="sm">Agregar miembro</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <MemberBalanceCard
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  alias={m.alias}
                  balance={memberBalances[m.id] ?? { PEN: 0, USD: 0 }}
                  pendingLoans={pendingLoansByMember[m.id] ?? []}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
