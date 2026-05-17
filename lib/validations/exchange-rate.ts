import { z } from "zod";

export const exchangeRateSchema = z.object({
  rate: z.coerce
    .number()
    .positive("El tipo de cambio debe ser mayor a 0")
    .max(100, "Valor fuera de rango"),
});

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;
