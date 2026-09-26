import { z } from "zod";

const optionalNumeric = z.preprocess(
  (val: string | number | null | undefined) =>
    val === "" || val === undefined || val === null
      ? undefined
      : typeof val === "string"
        ? Number(val)
        : val,
  z.number().optional(),
);

const optionalPositiveNumeric = z.preprocess(
  (val: string | number | null | undefined) =>
    val === "" || val === undefined || val === null
      ? undefined
      : typeof val === "string"
        ? Number(val)
        : val,
  z.number().min(0, "Custo deve ser positivo").optional(),
);

export const createEstablishmentSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  address: z.string().optional(),
  lat: optionalNumeric,
  lng: optionalNumeric,
  monthlyCost: optionalPositiveNumeric,
});

export const updateEstablishmentSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio").optional(),
  address: z.string().optional(),
  lat: optionalNumeric,
  lng: optionalNumeric,
  monthlyCost: optionalPositiveNumeric,
});

export type CreateEstablishmentFormData = z.infer<
  typeof createEstablishmentSchema
>;
export type UpdateEstablishmentFormData = z.infer<
  typeof updateEstablishmentSchema
>;
