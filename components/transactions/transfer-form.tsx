"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createTransfer } from "@/actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMemberName } from "@/lib/format";
import { ArrowRight } from "lucide-react";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

interface TransferFormProps {
  members: Member[];
  onMemberChange?: (memberId: string) => void;
}

export function TransferForm({ members, onMemberChange }: TransferFormProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const allAccounts = [
    { id: "_self", name: "Mi cuenta personal", alias: null },
    ...members,
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createTransfer({
      fromId,
      toId,
      amount: parseFloat(amount),
      currency,
      description,
      date,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      const fromName = allAccounts.find((a) => a.id === fromId);
      const toName = allAccounts.find((a) => a.id === toId);
      toast.success(
        `Transferencia registrada: ${fromName ? formatMemberName(fromName.name, fromName.alias) : ""} → ${toName ? formatMemberName(toName.name, toName.alias) : ""}`
      );
      setAmount("");
      setDescription("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 py-6">
      {/* Origen y destino */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Origen y destino</label>
        <div className="flex items-center gap-2">
          <select
            value={fromId}
            onChange={(e) => { setFromId(e.target.value); onMemberChange?.(e.target.value); }}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Desde...</option>
            {allAccounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === toId}>
                {formatMemberName(a.name, a.alias)}
              </option>
            ))}
          </select>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Hacia...</option>
            {allAccounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === fromId}>
                {formatMemberName(a.name, a.alias)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monto y moneda */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Monto <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1 shrink-0">
            {(["PEN", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  currency === c
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "PEN" ? "S/." : "$"}
              </button>
            ))}
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Descripción <span className="text-muted-foreground">(opcional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Para sus gastos del mes"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Fecha <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registrando..." : "Registrar transferencia"}
      </Button>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Ir al dashboard
      </button>
    </form>
  );
}
