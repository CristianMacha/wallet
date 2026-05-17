import { formatPEN, formatUSD } from "@/lib/format";
import type { Balance } from "@/lib/balance";

interface TotalsSummaryProps {
  total: Balance;
}

export function TotalsSummary({ total }: TotalsSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Total en custodia
      </p>
      <div className="flex gap-6">
        <div>
          <p className="text-lg font-bold tabular-nums">{formatPEN(total.PEN)}</p>
          <p className="text-xs text-muted-foreground">Soles</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="text-lg font-bold tabular-nums">{formatUSD(total.USD)}</p>
          <p className="text-xs text-muted-foreground">Dólares</p>
        </div>
      </div>
    </div>
  );
}
