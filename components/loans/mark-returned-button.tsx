"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { markLoanReturned } from "@/actions/loan-actions";

export function MarkReturnedButton({ loanId }: { loanId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (!confirm("¿Marcar este préstamo como devuelto? Se registrará la devolución automáticamente.")) return;
    setLoading(true);
    const result = await markLoanReturned(loanId);
    if (result.error) {
      alert(result.error);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  if (done) return <span className="text-xs text-green-600 font-medium">Devuelto ✓</span>;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {loading ? "Procesando..." : "Marcar devuelto"}
    </button>
  );
}
