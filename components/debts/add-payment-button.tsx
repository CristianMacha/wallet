"use client";

import { useState } from "react";
import { format } from "date-fns";
import { addDebtPayment } from "@/actions/debt-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusCircle, X } from "lucide-react";

interface AddPaymentButtonProps {
  debtId: string;
  pendingAmount: number;
  currency: "PEN" | "USD";
}

export function AddPaymentButton({ debtId, pendingAmount, currency }: AddPaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await addDebtPayment({
      debtId,
      amount: parseFloat(amount),
      date,
      note,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Abono registrado");
      setOpen(false);
      setAmount("");
      setNote("");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Registrar abono
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Nuevo abono</p>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <span className="text-xs text-muted-foreground self-center w-6 shrink-0">
          {currency === "PEN" ? "S/." : "$"}
        </span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={pendingAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Máx. ${pendingAmount.toFixed(2)}`}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" size="sm" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Confirmar abono"}
      </Button>
    </form>
  );
}
