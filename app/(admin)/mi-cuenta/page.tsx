import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUserId } from "@/lib/session";
import { getUserBalance } from "@/lib/balance";
import { getUserTransactions } from "@/lib/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceDisplay } from "@/components/shared/balance-display";
import { TransactionItem } from "@/components/transactions/transaction-item";

export default async function MiCuentaPage() {
  const userId = await getCurrentUserId();

  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userName = (userDoc.data()?.name as string) ?? "Mi cuenta";

  const [balance, transactions] = await Promise.all([
    getUserBalance(userId),
    getUserTransactions(userId, userName),
  ]);

  return (
    <>
      <PageHeader title="Mi cuenta" backHref="/dashboard" />
      <div className="px-4 py-4 space-y-6">
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Saldo actual
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <BalanceDisplay balance={balance} size="lg" />
          </div>
        </section>

        {transactions.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Movimientos recientes
            </h2>
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {transactions.slice(0, 30).map((tx) => (
                <TransactionItem key={tx.id} {...tx} showMember={false} />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">
            Aún no hay movimientos en tu cuenta personal.
          </p>
        )}
      </div>
    </>
  );
}
