"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { memberSchema, type MemberFormData } from "@/lib/validations/member";
import { Button } from "@/components/ui/button";

interface MemberFormProps {
  defaultValues?: MemberFormData;
  onSubmit: (data: MemberFormData) => Promise<{ ok?: boolean; error?: string }>;
  submitLabel: string;
}

export function MemberForm({ defaultValues, onSubmit, submitLabel }: MemberFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  async function submit(data: MemberFormData) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result.error) {
      setServerError(result.error);
    } else {
      router.push("/miembros");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 px-4 py-6">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          {...register("name")}
          placeholder="Ej: María"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="alias" className="text-sm font-medium">
          Alias <span className="text-muted-foreground">(opcional)</span>
        </label>
        <input
          id="alias"
          {...register("alias")}
          placeholder="Ej: Mari"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note" className="text-sm font-medium">
          Nota <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="note"
          {...register("note")}
          rows={2}
          placeholder="Ej: Deuda pendiente de enero, acuerdo especial..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
