"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyActivity } from "@/lib/transactions";

const chartConfig = {
  depositos: {
    label: "Depósitos",
    color: "oklch(0.6 0.2 250)",
  },
  gastos: {
    label: "Gastos",
    color: "var(--color-destructive)",
  },
} satisfies ChartConfig;

export function WeeklyActivityChart({ data }: { data: WeeklyActivity[] }) {
  const isEmpty = data.every((d) => d.depositos === 0 && d.gastos === 0);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Movimientos — últimas 4 semanas
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">En soles (S/.)</p>
      </div>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Sin movimientos en los últimos 30 días
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v) => `S/.${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              width={52}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="ml-auto font-medium tabular-nums" style={{ color: item.color }}>
                        S/. {Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="depositos" fill="oklch(0.6 0.2 250)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
