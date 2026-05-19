"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteTransactionButtonProps {
  memberId: string;
  transactionId: string;
}

export function DeleteTransactionButton({ memberId, transactionId }: DeleteTransactionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteTransaction(memberId, transactionId);
    toast.success("Movimiento eliminado");
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
      className="p-2.5 text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Eliminar"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
