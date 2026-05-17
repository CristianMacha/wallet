import { formatCurrency } from "@/lib/format";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { Transaction } from "@/lib/transactions";

interface TodayTransactionsProps {
  transactions: Transaction[];
  memberId?: string;
}

export function TodayTransactions({ transactions, memberId }: TodayTransactionsProps) {
  const filtered = memberId
    ? transactions.filter((tx) => tx.memberId === memberId)
    : transactions;

  if (!memberId || filtered.length === 0) return null;

  return (
    <div className="px-4 pb-8 space-y-2">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Hoy — {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
      </h2>
      <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
        {filtered.map((tx) => {
          const isDeposit = tx.type === "DEPOSIT";
          return (
            <div key={`${tx.memberId}-${tx.id}`} className="flex items-center gap-3 px-3 py-2.5">
              <div className="shrink-0">
                {isDeposit ? (
                  <ArrowUpCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {tx.description || (isDeposit ? "Depósito" : "Gasto")}
                </p>
              </div>
              <p className={`text-sm font-semibold tabular-nums shrink-0 ${isDeposit ? "text-green-600" : "text-destructive"}`}>
                {isDeposit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
