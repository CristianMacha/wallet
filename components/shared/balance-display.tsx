import { formatPEN, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Balance } from "@/lib/balance";

interface BalanceDisplayProps {
  balance: Balance;
  size?: "sm" | "lg";
}

export function BalanceDisplay({ balance, size = "sm" }: BalanceDisplayProps) {
  return (
    <div className="flex gap-4">
      <div className="space-y-0.5">
        <p className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-base",
          balance.PEN < 0 ? "text-destructive" : "text-foreground"
        )}>
          {formatPEN(balance.PEN)}
        </p>
        {size === "sm" && <p className="text-xs text-muted-foreground">Soles</p>}
      </div>
      <div className="w-px bg-border" />
      <div className="space-y-0.5">
        <p className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-base",
          balance.USD < 0 ? "text-destructive" : "text-foreground"
        )}>
          {formatUSD(balance.USD)}
        </p>
        {size === "sm" && <p className="text-xs text-muted-foreground">Dólares</p>}
      </div>
    </div>
  );
}
