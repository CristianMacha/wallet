"use client";

import { useState } from "react";
import { TransactionForm } from "./transaction-form";
import { CurrencyExchangeForm } from "./currency-exchange-form";
import { LoanForm } from "./loan-form";
import { TransferForm } from "./transfer-form";
import { TodayTransactions } from "./today-transactions";
import { createTransaction } from "@/actions/transaction-actions";
import type { Transaction } from "@/lib/transactions";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

type Mode = "TRANSACTION" | "EXCHANGE" | "LOAN" | "TRANSFER";

const MODES: { value: Mode; label: string }[] = [
  { value: "TRANSACTION", label: "Movimiento" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "EXCHANGE", label: "Cambio" },
  { value: "LOAN", label: "Préstamo" },
];

interface NewTransactionPanelProps {
  members: Member[];
  todayTransactions: Transaction[];
}

export function NewTransactionPanel({ members, todayTransactions }: NewTransactionPanelProps) {
  const [mode, setMode] = useState<Mode>("TRANSACTION");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  return (
    <>
      {/* Selector de modo */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-muted p-1">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-md px-1 py-2 text-xs font-medium transition-colors ${
                mode === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "EXCHANGE" ? (
        <CurrencyExchangeForm members={members} onMemberChange={setSelectedMemberId} />
      ) : mode === "LOAN" ? (
        <LoanForm members={members} onMemberChange={setSelectedMemberId} />
      ) : mode === "TRANSFER" ? (
        <TransferForm members={members} onMemberChange={setSelectedMemberId} />
      ) : (
        <TransactionForm
          members={members}
          onSubmit={createTransaction}
          submitLabel="Registrar movimiento"
          onMemberChange={setSelectedMemberId}
        />
      )}

      <TodayTransactions transactions={todayTransactions} memberId={selectedMemberId} />
    </>
  );
}
