import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Pencil } from "lucide-react";
import { DeleteTransactionButton } from "./delete-transaction-button";

interface TransactionItemProps {
  id: string;
  memberId: string | null;
  memberName: string;
  type: "DEPOSIT" | "EXPENSE";
  amount: number;
  currency: "PEN" | "USD";
  description: string | null;
  date: Date;
  showMember?: boolean;
}

export function TransactionItem({
  id,
  memberId,
  memberName,
  type,
  amount,
  currency,
  description,
  date,
  showMember = true,
}: TransactionItemProps) {
  const isDeposit = type === "DEPOSIT";

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 shrink-0">
        {isDeposit ? (
          <ArrowUpCircle className="h-5 w-5 text-green-600" />
        ) : (
          <ArrowDownCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {description || (isDeposit ? "Depósito" : "Gasto")}
          </p>
          <p className={`text-sm font-semibold tabular-nums shrink-0 ${isDeposit ? "text-green-600" : "text-destructive"}`}>
            {isDeposit ? "+" : "-"}{formatCurrency(amount, currency)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {format(date, "d MMM yyyy", { locale: es })}
          </p>
          {showMember && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <p className="text-xs text-muted-foreground truncate">{memberName}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/transaction/${id}/edit?memberId=${memberId ?? "_self"}`}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <DeleteTransactionButton memberId={memberId ?? "_self"} transactionId={id} />
      </div>
    </div>
  );
}
