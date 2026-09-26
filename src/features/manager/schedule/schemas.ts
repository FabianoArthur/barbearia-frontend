import { z } from "zod";

export const workingHourSchema = z.object({
  barberId: z.string().min(1, "Barbeiro obrigatorio"),
  weekday: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
});

export const timeOffSchema = z.object({
  barberId: z.string().min(1, "Barbeiro obrigatorio"),
  date: z.string().min(1, "Data obrigatoria"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:mm")
    .optional()
    .or(z.literal("")),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato HH:mm")
    .optional()
    .or(z.literal("")),
  reason: z.string().optional(),
});

export const overrideSchema = z.object({
  barberId: z.string().min(1, "Barbeiro obrigatorio"),
  startDate: z.string().min(1, "Data inicio obrigatoria"),
  endDate: z.string().min(1, "Data fim obrigatoria"),
  weekday: z.number().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  reason: z.string().optional(),
});

export type WorkingHourFormData = z.infer<typeof workingHourSchema>;
export type TimeOffFormData = z.infer<typeof timeOffSchema>;
export type OverrideFormData = z.infer<typeof overrideSchema>;
