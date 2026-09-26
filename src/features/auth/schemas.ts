import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["BARBER", "MANAGER", "SUPER_ADMIN"]),
  establishmentId: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
