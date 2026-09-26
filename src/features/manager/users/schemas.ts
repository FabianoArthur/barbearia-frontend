import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["BARBER", "MANAGER", "SUPER_ADMIN"], {
    error: "Selecione uma funcao",
  }),
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  commissionPercent: z
    .preprocess(
      (val: string | number) => (typeof val === "string" ? Number(val) : val),
      z.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
    )
    .optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserInfoSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  role: z.enum(["BARBER", "MANAGER", "SUPER_ADMIN"], {
    error: "Selecione uma funcao",
  }),
  commissionPercent: z
    .preprocess(
      (val: string | number) => (typeof val === "string" ? Number(val) : val),
      z.number().min(0, "Minimo 0%").max(100, "Maximo 100%"),
    )
    .optional(),
});

export type UpdateUserInfoFormData = z.infer<typeof updateUserInfoSchema>;
