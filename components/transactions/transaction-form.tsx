"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { transactionSchema, type TransactionFormData } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

interface TransactionFormProps {
  members: Member[];
  defaultValues?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<{ ok?: boolean; error?: string }>;
  submitLabel: string;
  redirectOnSuccess?: boolean;
  onMemberChange?: (memberId: string) => void;
}

export function TransactionForm({
  members,
  defaultValues,
  onSubmit,
  submitLabel,
  redirectOnSuccess = false,
  onMemberChange,
}: TransactionFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "DEPOSIT",
      currency: "PEN",
      date: today,
      ...defaultValues,
    },
  });

  const type = watch("type");

  async function submit(data: TransactionFormData) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result.error) {
      setServerError(result.error);
      toast.error(result.error);
    } else if (redirectOnSuccess) {
      router.push("/dashboard");
      router.refresh();
    } else {
      reset({
        memberId: data.memberId,
        type: data.type,
        currency: data.currency,
        date: data.date,
        amount: "" as unknown as number,
        description: "",
      });
      const memberName = data.memberId === "_self"
        ? "mi cuenta"
        : (members.find((m) => m.id === data.memberId)?.alias ||
           members.find((m) => m.id === data.memberId)?.name || "");
      const typeLabel = data.type === "DEPOSIT" ? "Depósito" : "Gasto";
      toast.success(`${typeLabel} registrado para ${memberName}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 px-4 py-6">
      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["DEPOSIT", "EXPENSE"] as const).map((t) => (
            <label
              key={t}
              className={`flex items-center justify-center rounded-md border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                type === t
                  ? t === "DEPOSIT"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-destructive bg-destructive text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <input {...register("type")} type="radio" value={t} className="sr-only" />
              {t === "DEPOSIT" ? "Depósito" : "Gasto"}
            </label>
          ))}
        </div>
      </div>

      {/* Miembro */}
      <div className="space-y-1.5">
        <Label htmlFor="memberId">
          Miembro <span className="text-destructive">*</span>
        </Label>
        <select
          id="memberId"
          {...register("memberId")}
          onChange={(e) => {
            register("memberId").onChange(e);
            onMemberChange?.(e.target.value);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecciona una cuenta</option>
          <option value="_self">Mi cuenta personal</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.alias ? `${m.name} - ${m.alias}` : m.name}
            </option>
          ))}
        </select>
        {errors.memberId && (
          <p className="text-xs text-destructive">{errors.memberId.message}</p>
        )}
      </div>

      {/* Monto y moneda */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">
          Monto <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            {...register("amount")}
            placeholder="0.00"
            className="flex-1"
            aria-invalid={!!errors.amount}
          />
          <div className="flex rounded-md border border-input overflow-hidden">
            {(["PEN", "USD"] as const).map((c) => (
              <label
                key={c}
                className={`flex items-center px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
                  watch("currency") === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <input {...register("currency")} type="radio" value={c} className="sr-only" />
                {c === "PEN" ? "S/." : "$"}
              </label>
            ))}
          </div>
        </div>
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label htmlFor="date">
          Fecha <span className="text-destructive">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          {...register("date")}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Descripción{" "}
          {type === "EXPENSE" ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="text-muted-foreground">(opcional)</span>
          )}
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={2}
          placeholder={type === "EXPENSE" ? "Ej: Pago de luz" : "Ej: Depósito mensual"}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>

      {!redirectOnSuccess && (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Ir al dashboard
        </button>
      )}
    </form>
  );
}
