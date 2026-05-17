import { z } from "zod";

export const transactionSchema = z
  .object({
    memberId: z.string().min(1, "Selecciona un miembro"),
    type: z.enum(["DEPOSIT", "EXPENSE"]),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    currency: z.enum(["PEN", "USD"]),
    description: z.string().max(500).transform((v) => v?.trim() || undefined).optional(),
    date: z.string().min(1, "La fecha es obligatoria"),
  })
  .refine(
    (data) => {
      if (data.type === "EXPENSE") {
        return data.description && data.description.trim().length > 0;
      }
      return true;
    },
    {
      message: "La descripción es obligatoria para un gasto",
      path: ["description"],
    }
  );

export type TransactionFormData = z.infer<typeof transactionSchema>;
