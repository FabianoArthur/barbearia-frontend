import { z } from "zod";

export const addBarberSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  commissionPercent: z.preprocess(
    (val: string | number) => (typeof val === "string" ? Number(val) : val),
    z.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
  ),
});

export const createBarberSchema = z.object({
  userId: z.string().min(1, "Usuario obrigatorio"),
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  commissionPercent: z
    .preprocess(
      (val: string | number) => (typeof val === "string" ? Number(val) : val),
      z.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
    )
    .optional(),
});

export const updateBarberSchema = z.object({
  commissionPercent: z.preprocess(
    (val: string | number) => (typeof val === "string" ? Number(val) : val),
    z.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
  ),
});

export type AddBarberFormData = z.infer<typeof addBarberSchema>;
export type CreateBarberFormData = z.infer<typeof createBarberSchema>;
export type UpdateBarberFormData = z.infer<typeof updateBarberSchema>;
