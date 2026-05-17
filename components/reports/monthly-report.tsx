import { formatPEN, formatUSD } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Transaction } from "@/lib/transactions";
import type { Balance } from "@/lib/balance";

interface MemberReport {
  id: string;
  name: string;
  alias: string | null;
  monthBalance: Balance;
  cumulativeBalance: Balance;
  transactions: Transaction[];
}

interface MonthlyReportProps {
  month: string;
  members: MemberReport[];
}

function SignedAmount({ amount, currency }: { amount: number; currency: "PEN" | "USD" }) {
  const formatted = currency === "PEN" ? formatPEN(Math.abs(amount)) : formatUSD(Math.abs(amount));
  const color = amount >= 0 ? "text-green-700" : "text-red-600";
  return <span className={color}>{amount >= 0 ? "+" : "-"}{formatted}</span>;
}

export function MonthlyReport({ month, members }: MonthlyReportProps) {
  const [year, m] = month.split("-");
  const monthLabel = format(new Date(Number(year), Number(m) - 1, 1), "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-8 print:text-black">
      <div className="border-b border-border pb-4 print:border-black">
        <h1 className="text-xl font-bold">FamilyWallet — Reporte Mensual</h1>
        <p className="text-muted-foreground capitalize">{monthLabel}</p>
      </div>

      {/* Resumen por miembro */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium">Miembro</th>
                <th className="pb-2 font-medium text-right">Depósitos</th>
                <th className="pb-2 font-medium text-right">Gastos</th>
                <th className="pb-2 font-medium text-right">Neto mes</th>
                <th className="pb-2 font-medium text-right">Saldo total</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const deposits = member.transactions
                  .filter((t) => t.type === "DEPOSIT")
                  .reduce(
                    (acc, t) => ({ ...acc, [t.currency]: (acc[t.currency] ?? 0) + t.amount }),
                    {} as Record<string, number>
                  );
                const expenses = member.transactions
                  .filter((t) => t.type === "EXPENSE")
                  .reduce(
                    (acc, t) => ({ ...acc, [t.currency]: (acc[t.currency] ?? 0) + t.amount }),
                    {} as Record<string, number>
                  );

                return (
                  <tr key={member.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{member.alias ?? member.name}</td>
                    <td className="py-2 text-right text-xs space-y-0.5">
                      {deposits.PEN ? <div className="text-green-700">{formatPEN(deposits.PEN)}</div> : null}
                      {deposits.USD ? <div className="text-green-700">{formatUSD(deposits.USD)}</div> : null}
                      {!deposits.PEN && !deposits.USD && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 text-right text-xs space-y-0.5">
                      {expenses.PEN ? <div className="text-red-600">{formatPEN(expenses.PEN)}</div> : null}
                      {expenses.USD ? <div className="text-red-600">{formatUSD(expenses.USD)}</div> : null}
                      {!expenses.PEN && !expenses.USD && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 text-right text-xs space-y-0.5">
                      {(member.monthBalance.PEN !== 0 || member.monthBalance.USD !== 0) ? (
                        <>
                          {member.monthBalance.PEN !== 0 && (
                            <div><SignedAmount amount={member.monthBalance.PEN} currency="PEN" /></div>
                          )}
                          {member.monthBalance.USD !== 0 && (
                            <div><SignedAmount amount={member.monthBalance.USD} currency="USD" /></div>
                          )}
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 text-right text-xs space-y-0.5">
                      <div className={member.cumulativeBalance.PEN < 0 ? "text-red-600" : ""}>
                        {formatPEN(member.cumulativeBalance.PEN)}
                      </div>
                      <div className={member.cumulativeBalance.USD < 0 ? "text-red-600" : ""}>
                        {formatUSD(member.cumulativeBalance.USD)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle por miembro */}
      {members.map((member) => (
        member.transactions.length > 0 && (
          <section key={member.id} className="space-y-2 page-break-inside-avoid">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {member.alias ?? member.name}
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-1.5 font-medium">Fecha</th>
                  <th className="pb-1.5 font-medium">Descripción</th>
                  <th className="pb-1.5 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {member.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/40">
                    <td className="py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      {format(tx.date, "d MMM", { locale: es })}
                    </td>
                    <td className="py-1.5 text-xs">
                      {tx.description || (tx.type === "DEPOSIT" ? "Depósito" : "Gasto")}
                    </td>
                    <td className="py-1.5 text-xs text-right whitespace-nowrap">
                      <SignedAmount
                        amount={tx.type === "DEPOSIT" ? tx.amount : -tx.amount}
                        currency={tx.currency}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      ))}

      <div className="text-xs text-muted-foreground pt-4 border-t border-border print:border-black">
        Generado el {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
      </div>
    </div>
  );
}
