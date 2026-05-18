import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { BalanceDisplay } from "@/components/shared/balance-display";
import { cn } from "@/lib/utils";
import { formatCurrency, formatMemberName } from "@/lib/format";
import type { Balance } from "@/lib/balance";
import type { Loan } from "@/lib/loans";

interface MemberBalanceCardProps {
  id: string;
  name: string;
  alias: string | null;
  balance: Balance;
  pendingLoans?: Loan[];
}

export function MemberBalanceCard({ id, name, alias, balance, pendingLoans = [] }: MemberBalanceCardProps) {
  const isNegative = balance.PEN < 0 || balance.USD < 0;

  const loanTotals = pendingLoans.reduce(
    (acc, loan) => {
      acc[loan.currency] = (acc[loan.currency] ?? 0) + loan.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Link
      href={`/miembros/${id}`}
      className={cn(
        "flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-muted transition-colors",
        isNegative
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{formatMemberName(name, alias)}</p>
          {isNegative && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>
        <BalanceDisplay balance={balance} />
        {pendingLoans.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Préstamo pendiente:{" "}
            {Object.entries(loanTotals)
              .map(([cur, amt]) => formatCurrency(amt, cur as "PEN" | "USD"))
              .join(" + ")}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
