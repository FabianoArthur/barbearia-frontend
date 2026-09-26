import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ' -]+$/;

export const publicBookingSchema = z.object({
  clientName: z
    .string()
    .min(1, "Por favor, informe seu nome completo.")
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .refine(
          (val) => !/\d/.test(val),
          "O nome nao pode conter numeros. Verifique e tente novamente.",
        )
        .refine(
          (val) => NAME_PATTERN.test(val),
          "O nome contem caracteres invalidos. Use apenas letras.",
        )
        .refine((val) => {
          const words = val.split(/\s+/).filter(Boolean);
          return words.length >= 2;
        }, "Informe seu nome e sobrenome. Ex: Joao Silva")
        .refine((val) => {
          const words = val.split(/\s+/).filter(Boolean);
          return words.every((w) => w.length >= 2);
        }, "Cada parte do nome deve ter pelo menos 2 letras."),
    ),
  clientCpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{11}$/, "CPF invalido. Informe os 11 digitos.")),
  clientPhone: z
    .string()
    .min(1, "Por favor, informe seu telefone com DDD.")
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .refine(
          (val) => isValidPhoneNumber(`+55${val}`, "BR"),
          "Numero de telefone invalido. Informe com DDD. Ex: (11) 99999-9999",
        ),
    ),
});

export type PublicBookingFormData = z.infer<typeof publicBookingSchema>;
