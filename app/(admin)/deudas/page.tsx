import { getCurrentUserId } from "@/lib/session";
import { getAllDebts } from "@/lib/debts";
import { PageHeader } from "@/components/layout/page-header";
import { AddPaymentButton } from "@/components/debts/add-payment-button";
import { DeleteDebtButton } from "@/components/debts/delete-debt-button";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DeudasPage() {
  const userId = await getCurrentUserId();
  const debts = await getAllDebts(userId);

  const pending = debts.filter((d) => d.status === "PENDING");
  const paid = debts.filter((d) => d.status === "PAID");

  return (
    <>
      <PageHeader
        title="Deudas"
        action={
          <Link href="/deudas/nueva">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </Link>
        }
      />
      <div className="px-4 py-4 space-y-6">
        {debts.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-muted-foreground text-sm">No hay deudas registradas.</p>
            <Link href="/deudas/nueva">
              <Button variant="outline" size="sm">Registrar deuda</Button>
            </Link>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Pendientes ({pending.length})
                </h2>
                <div className="space-y-2">
                  {pending.map((debt) => {
                    const progress = debt.totalAmount > 0
                      ? Math.round((debt.paidAmount / debt.totalAmount) * 100)
                      : 0;
                    return (
                      <div key={debt.id} className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{debt.debtorName} → {debt.creditorName}</p>
                            {debt.description && (
                              <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(debt.date, "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-destructive tabular-nums">
                                {formatCurrency(debt.pendingAmount, debt.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                de {formatCurrency(debt.totalAmount, debt.currency)}
                              </p>
                            </div>
                            <DeleteDebtButton debtId={debt.id} />
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {progress}% pagado · {formatCurrency(debt.paidAmount, debt.currency)} abonado
                          </p>
                        </div>

                        <AddPaymentButton
                          debtId={debt.id}
                          pendingAmount={debt.pendingAmount}
                          currency={debt.currency}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {paid.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Saldadas ({paid.length})
                </h2>
                <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                  {paid.map((debt) => (
                    <div key={debt.id} className="flex items-start justify-between gap-2 px-4 py-3 opacity-60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{debt.debtorName} → {debt.creditorName}</p>
                        {debt.description && (
                          <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(debt.date, "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums shrink-0">
                        {formatCurrency(debt.totalAmount, debt.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
