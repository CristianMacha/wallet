"use client";

import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPEN, formatUSD } from "@/lib/format";
import type { Balance } from "@/lib/balance";
import type { Transaction } from "@/lib/transactions";

interface MemberReport {
  id: string;
  name: string;
  alias: string | null;
  monthBalance: Balance;
  cumulativeBalance: Balance;
  transactions: Transaction[];
}

interface WhatsAppShareButtonProps {
  month: string;
  members: MemberReport[];
}

function buildText(month: string, members: MemberReport[]): string {
  const [year, m] = month.split("-");
  const monthLabel = format(new Date(Number(year), Number(m) - 1, 1), "MMMM yyyy", { locale: es });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const lines: string[] = [
    `📊 *FamilyWallet — ${cap(monthLabel)}*`,
    "",
  ];

  for (const member of members) {
    if (member.transactions.length === 0) continue;

    const displayName = member.alias ?? member.name;
    lines.push(`👤 *${displayName}*`);

    const deposits = member.transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((acc, t) => ({ ...acc, [t.currency]: (acc[t.currency as keyof Balance] ?? 0) + t.amount }), { PEN: 0, USD: 0 });

    const expenses = member.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => ({ ...acc, [t.currency]: (acc[t.currency as keyof Balance] ?? 0) + t.amount }), { PEN: 0, USD: 0 });

    if (deposits.PEN || deposits.USD) {
      const parts = [];
      if (deposits.PEN) parts.push(formatPEN(deposits.PEN));
      if (deposits.USD) parts.push(formatUSD(deposits.USD));
      lines.push(`  ↑ Depósitos: ${parts.join(" + ")}`);
    }
    if (expenses.PEN || expenses.USD) {
      const parts = [];
      if (expenses.PEN) parts.push(formatPEN(expenses.PEN));
      if (expenses.USD) parts.push(formatUSD(expenses.USD));
      lines.push(`  ↓ Gastos: ${parts.join(" + ")}`);
    }

    const netParts = [];
    if (member.monthBalance.PEN !== 0) netParts.push(`${member.monthBalance.PEN >= 0 ? "+" : ""}${formatPEN(member.monthBalance.PEN)}`);
    if (member.monthBalance.USD !== 0) netParts.push(`${member.monthBalance.USD >= 0 ? "+" : ""}${formatUSD(member.monthBalance.USD)}`);
    if (netParts.length) lines.push(`  = Neto mes: ${netParts.join(", ")}`);

    lines.push(`  💰 Saldo total: ${formatPEN(member.cumulativeBalance.PEN)} / ${formatUSD(member.cumulativeBalance.USD)}`);
    lines.push("");
  }

  lines.push(`_Generado el ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}_`);
  return lines.join("\n");
}

export function WhatsAppShareButton({ month, members }: WhatsAppShareButtonProps) {
  function handleShare() {
    const text = buildText(month, members);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
    >
      <MessageCircle className="h-4 w-4" />
      Compartir
    </button>
  );
}
