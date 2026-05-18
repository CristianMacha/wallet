import { adminDb } from "@/lib/firebase-admin";
import { getMemberBalance } from "@/lib/balance";
import { getTransactions } from "@/lib/transactions";
import { formatPEN, formatUSD, formatCurrency, formatMemberName } from "@/lib/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { Transaction } from "@/lib/transactions";

function groupByMonth(transactions: Transaction[]) {
  const groups: { key: string; label: string; transactions: Transaction[]; netPEN: number; netUSD: number }[] = [];
  const map = new Map<string, typeof groups[0]>();

  for (const tx of transactions) {
    const key = format(tx.date, "yyyy-MM");
    const label = format(tx.date, "MMMM yyyy", { locale: es });
    if (!map.has(key)) {
      const group = { key, label, transactions: [], netPEN: 0, netUSD: 0 };
      map.set(key, group);
      groups.push(group);
    }
    const g = map.get(key)!;
    g.transactions.push(tx);
    const delta = tx.type === "DEPOSIT" ? tx.amount : -tx.amount;
    if (tx.currency === "PEN") g.netPEN += delta;
    else g.netUSD += delta;
  }

  return groups;
}

async function getMemberByToken(token: string) {
  // Busca en todos los usuarios el miembro con este accessToken
  const usersSnap = await adminDb.collection("users").get();

  for (const userDoc of usersSnap.docs) {
    const snap = await adminDb
      .collection("users").doc(userDoc.id)
      .collection("members")
      .where("accessToken", "==", token)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      return {
        userId: userDoc.id,
        id: doc.id,
        name: doc.data().name as string,
        alias: (doc.data().alias as string) ?? null,
      };
    }
  }
  return null;
}

export default async function MemberViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const member = await getMemberByToken(token);

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold">Enlace no válido</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace no existe o ya no está activo.
          </p>
        </div>
      </div>
    );
  }

  const [balance, transactions] = await Promise.all([
    getMemberBalance(member.userId, member.id),
    getTransactions(member.userId, { memberId: member.id }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">{formatMemberName(member.name, member.alias)}</h1>
        <p className="text-xs text-muted-foreground">Tu resumen de cuenta</p>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Soles</p>
            <p className={`text-xl font-bold tabular-nums ${balance.PEN < 0 ? "text-destructive" : ""}`}>
              {formatPEN(balance.PEN)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Dólares</p>
            <p className={`text-xl font-bold tabular-nums ${balance.USD < 0 ? "text-destructive" : ""}`}>
              {formatUSD(balance.USD)}
            </p>
          </div>
        </div>

        {transactions.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Movimientos
            </h2>
            {groupByMonth(transactions).map((group) => (
              <div key={group.key} className="space-y-1.5">
                {/* Encabezado de mes */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{group.label}</h3>
                  <div className="flex items-center gap-2 text-xs tabular-nums">
                    {group.netPEN !== 0 && (
                      <span className={group.netPEN >= 0 ? "text-green-600" : "text-destructive"}>
                        {group.netPEN >= 0 ? "+" : ""}{formatPEN(group.netPEN)}
                      </span>
                    )}
                    {group.netUSD !== 0 && (
                      <span className={group.netUSD >= 0 ? "text-green-600" : "text-destructive"}>
                        {group.netUSD >= 0 ? "+" : ""}{formatUSD(group.netUSD)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Transacciones del mes */}
                <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
                  {group.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 shrink-0">
                        {tx.type === "DEPOSIT" ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {tx.description || (tx.type === "DEPOSIT" ? "Depósito" : "Gasto")}
                          </p>
                          <p className={`text-sm font-semibold tabular-nums shrink-0 ${tx.type === "DEPOSIT" ? "text-green-600" : "text-destructive"}`}>
                            {tx.type === "DEPOSIT" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(tx.date, "d MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            Aún no hay movimientos registrados.
          </p>
        )}
      </main>
    </div>
  );
}
