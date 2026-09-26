import { z } from "zod";

export const createClientSchema = z.object({
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  name: z.string().min(2, "Nome obrigatorio"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 digitos"),
  phone: z.string().optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
