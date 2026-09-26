import { z } from "zod";

export const createAppointmentSchema = z.object({
  establishmentId: z.string().min(1, "Estabelecimento obrigatorio"),
  barberId: z.string().min(1, "Barbeiro obrigatorio"),
  clientId: z.string().min(1, "Cliente obrigatorio"),
  serviceId: z.string().min(1, "Servico obrigatorio"),
  startsAt: z.string().min(1, "Horario obrigatorio"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "DONE", "CANCELED"]),
});

export type CreateAppointmentFormData = z.infer<typeof createAppointmentSchema>;
export type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;
