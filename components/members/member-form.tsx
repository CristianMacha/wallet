"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { memberSchema, type MemberFormData } from "@/lib/validations/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        <Label htmlFor="name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej: María"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="alias">
          Alias <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="alias"
          {...register("alias")}
          placeholder="Ej: Mari"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">
          Nota <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="note"
          {...register("note")}
          rows={2}
          placeholder="Ej: Deuda pendiente de enero, acuerdo especial..."
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
