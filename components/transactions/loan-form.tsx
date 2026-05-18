"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createLoan } from "@/actions/loan-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

interface LoanFormProps {
  members: Member[];
  onMemberChange?: (memberId: string) => void;
}

type BorrowerType = "MEMBER" | "EXTERNAL";

export function LoanForm({ members, onMemberChange }: LoanFormProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [lenderMemberId, setLenderMemberId] = useState("");
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("MEMBER");
  const [borrowerMemberId, setBorrowerMemberId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const availableBorrowers = members.filter((m) => m.id !== lenderMemberId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const selectedBorrower = borrowerType === "MEMBER"
      ? members.find((m) => m.id === borrowerMemberId)
      : null;

    const result = await createLoan({
      lenderMemberId,
      borrowerType,
      borrowerMemberId: borrowerType === "MEMBER" ? borrowerMemberId : undefined,
      borrowerName: borrowerType === "MEMBER"
        ? (selectedBorrower?.alias || selectedBorrower?.name || "")
        : borrowerName,
      amount: parseFloat(amount),
      currency,
      description,
      date,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      const lender = lenderMemberId === "_self" ? null : members.find((m) => m.id === lenderMemberId);
      const lenderLabel = lenderMemberId === "_self" ? "Mi cuenta" : (lender?.alias || lender?.name || "");
      const borrowerLabel = borrowerType === "MEMBER"
        ? (selectedBorrower?.alias || selectedBorrower?.name || "")
        : borrowerName;
      toast.success(`Préstamo registrado: ${lenderLabel} → ${borrowerLabel}`);
      setAmount("");
      setDescription("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 py-6">
      {/* Quien presta */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Quien presta <span className="text-destructive">*</span>
        </label>
        <select
          value={lenderMemberId}
          onChange={(e) => {
            setLenderMemberId(e.target.value);
            onMemberChange?.(e.target.value);
            setBorrowerMemberId("");
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecciona una cuenta</option>
          <option value="_self">Mi cuenta personal</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.alias ? `${m.name} - ${m.alias}` : m.name}</option>
          ))}
        </select>
      </div>

      {/* Tipo de receptor */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Quien recibe</label>
        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted p-1">
          {(["MEMBER", "EXTERNAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setBorrowerType(t); setBorrowerMemberId(""); setBorrowerName(""); }}
              className={`rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                borrowerType === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "MEMBER" ? "Miembro del sistema" : "Persona externa"}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de receptor */}
      {borrowerType === "MEMBER" ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Miembro receptor <span className="text-destructive">*</span>
          </label>
          <select
            value={borrowerMemberId}
            onChange={(e) => setBorrowerMemberId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona un miembro</option>
            {availableBorrowers.map((m) => (
              <option key={m.id} value={m.id}>{m.alias ? `${m.name} - ${m.alias}` : m.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Nombre de la persona <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

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
          placeholder="Ej: Para emergencia médica"
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
        {loading ? "Registrando..." : "Registrar préstamo"}
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
