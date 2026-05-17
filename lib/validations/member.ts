import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  alias: z.string().max(50).optional(),
  note: z.string().max(300).optional(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
