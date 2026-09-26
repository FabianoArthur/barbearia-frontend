import { z } from "zod";

const numericField = (msg: string, min = 0) =>
  z.preprocess(
    (val: string | number) => (typeof val === "string" ? Number(val) : val),
    z.number({ message: msg }).min(min, msg),
  );

export const createServiceSchema = z.object({
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  name: z.string().min(2, "Nome obrigatorio"),
  price: numericField("Preco deve ser positivo", 0),
  durationMinutes: numericField("Duracao minima de 1 minuto", 1),
  notes: z.string().max(500, "Maximo de 500 caracteres").optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").optional(),
  price: numericField("Preco deve ser positivo", 0).optional(),
  durationMinutes: numericField("Duracao minima de 1 minuto", 1).optional(),
  notes: z.string().max(500, "Maximo de 500 caracteres").optional(),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;
