import { z } from "zod";

export const appointmentCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Codigo do agendamento obrigatorio")
    .transform((val) => val.trim()),
});

export type AppointmentCodeFormData = z.infer<typeof appointmentCodeSchema>;

export const rescheduleSchema = z.object({
  date: z.date({ error: "Selecione uma data" }),
  time: z.string().min(1, "Selecione um horario"),
});

export type RescheduleFormData = z.infer<typeof rescheduleSchema>;
