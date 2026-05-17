"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLoan } from "@/actions/loan-actions";
import { toast } from "sonner";

export function DeleteLoanButton({ loanId }: { loanId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteLoan(loanId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Préstamo eliminado");
    }
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="destructive"
          className="h-7 px-2 text-xs"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "..." : "Eliminar"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setConfirming(false)}
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Eliminar préstamo"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
