"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createDebt } from "@/actions/debt-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatMemberName } from "@/lib/format";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

export function DebtForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [debtorType, setDebtorType] = useState<"SELF" | "MEMBER">("SELF");
  const [debtorMemberId, setDebtorMemberId] = useState("");
  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createDebt({
      debtorType,
      debtorMemberId: debtorType === "MEMBER" ? debtorMemberId : undefined,
      creditorName,
      totalAmount: parseFloat(totalAmount),
      currency,
      description,
      date,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Deuda registrada");
      router.push("/deudas");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 py-6">
      {/* Deudor */}
      <div className="space-y-1.5">
        <Label>Quién debe</Label>
        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted p-1">
          {(["SELF", "MEMBER"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setDebtorType(t); setDebtorMemberId(""); }}
              className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                debtorType === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "SELF" ? "Mi cuenta" : "Un miembro"}
            </button>
          ))}
        </div>
        {debtorType === "MEMBER" && (
          <select
            value={debtorMemberId}
            onChange={(e) => setDebtorMemberId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona un miembro</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{formatMemberName(m.name, m.alias)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Acreedor */}
      <div className="space-y-1.5">
        <Label>
          A quién le debe <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          value={creditorName}
          onChange={(e) => setCreditorName(e.target.value)}
          placeholder="Ej: Tienda Hiraoka, Juan Pérez"
        />
      </div>

      {/* Monto total y moneda */}
      <div className="space-y-1.5">
        <Label>
          Monto total de la deuda <span className="text-destructive">*</span>
        </Label>
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
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1"
          />
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label>
          Descripción <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: TV Samsung 55 pulgadas"
        />
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label>
          Fecha <span className="text-destructive">*</span>
        </Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registrando..." : "Registrar deuda"}
      </Button>
    </form>
  );
}
