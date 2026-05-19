import Link from "next/link";
import { BalanceDisplay } from "@/components/shared/balance-display";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
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
  const initial = name.charAt(0).toUpperCase();

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
        "flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted transition-colors",
        isNegative ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        isNegative
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary"
      )}>
        {initial}
      </div>

      {/* Nombre + préstamo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{name}</p>
          {isNegative && (
            <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              Negativo
            </span>
          )}
        </div>
        {alias && (
          <p className="text-xs text-muted-foreground truncate">{alias}</p>
        )}
        {pendingLoans.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
            Préstamo:{" "}
            {Object.entries(loanTotals)
              .map(([cur, amt]) => formatCurrency(amt, cur as "PEN" | "USD"))
              .join(" + ")}
          </p>
        )}
      </div>

      {/* Saldo — zona derecha, más prominente */}
      <div className="shrink-0 text-right">
        <BalanceDisplay balance={balance} />
      </div>
    </Link>
  );
}
