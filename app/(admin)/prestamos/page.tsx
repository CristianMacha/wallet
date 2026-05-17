import { getCurrentUserId } from "@/lib/session";
import { getAllLoans } from "@/lib/loans";
import { PageHeader } from "@/components/layout/page-header";
import { MarkReturnedButton } from "@/components/loans/mark-returned-button";
import { DeleteLoanButton } from "@/components/loans/delete-loan-button";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, CheckCircle2 } from "lucide-react";

export default async function PrestamosPage() {
  const userId = await getCurrentUserId();
  const loans = await getAllLoans(userId);

  const pending = loans.filter((l) => l.status === "PENDING");
  const returned = loans.filter((l) => l.status === "RETURNED");

  return (
    <>
      <PageHeader title="Préstamos" />
      <div className="px-4 py-4 space-y-6">
        {loans.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No hay préstamos registrados.
          </p>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Pendientes ({pending.length})
                </h2>
                <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                  {pending.map((loan) => (
                    <div key={loan.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {loan.lenderName} → {loan.borrowerName}
                          </p>
                          {loan.description && (
                            <p className="text-xs text-muted-foreground truncate">{loan.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(loan.date, "d MMM yyyy", { locale: es })}
                            {loan.borrowerType === "EXTERNAL" && (
                              <span className="ml-1.5 text-muted-foreground/70">· Externo</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatCurrency(loan.amount, loan.currency)}
                          </p>
                          <DeleteLoanButton loanId={loan.id} />
                        </div>
                      </div>
                      <MarkReturnedButton loanId={loan.id} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {returned.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Devueltos ({returned.length})
                </h2>
                <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                  {returned.map((loan) => (
                    <div key={loan.id} className="px-4 py-3 opacity-60">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{loan.lenderName} → {loan.borrowerName}</p>
                          {loan.description && (
                            <p className="text-xs text-muted-foreground truncate">{loan.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(loan.date, "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums shrink-0">
                          {formatCurrency(loan.amount, loan.currency)}
                        </p>
                      </div>
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
