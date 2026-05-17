"use client";

import { TransactionForm } from "./transaction-form";
import { updateTransaction } from "@/actions/transaction-actions";
import type { TransactionFormData } from "@/lib/validations/transaction";

interface EditTransactionFormProps {
  members: { id: string; name: string; alias: string | null }[];
  defaultValues: Partial<TransactionFormData>;
  memberId: string;
  transactionId: string;
}

export function EditTransactionForm({
  members,
  defaultValues,
  memberId,
  transactionId,
}: EditTransactionFormProps) {
  return (
    <TransactionForm
      members={members}
      defaultValues={defaultValues}
      onSubmit={(data) => updateTransaction(memberId, transactionId, data)}
      submitLabel="Guardar cambios"
    />
  );
}
