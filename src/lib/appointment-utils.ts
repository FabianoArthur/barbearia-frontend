import type { AppointmentStatusFilter } from "@/features/manager/appointments/services";
import type { AppointmentListItem, AppointmentStatus } from "@/types";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMATION_PENDING: "Aguardando Confirmacao",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em Atendimento",
  DONE: "Concluido",
  CANCELED: "Cancelado",
  NO_SHOW: "Nao Compareceu",
};

export const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SCHEDULED: "outline",
  CONFIRMATION_PENDING: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "secondary",
  DONE: "default",
  CANCELED: "destructive",
  NO_SHOW: "destructive",
};

export const STATUS_FILTER_OPTIONS: {
  value: AppointmentStatusFilter;
  label: string;
}[] = [
  { value: "SCHEDULED", label: "Agendado" },
  { value: "CONFIRMATION_PENDING", label: "Aguardando Confirmacao" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "Em Atendimento" },
  { value: "DONE", label: "Concluido" },
  { value: "CANCELED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Nao Compareceu" },
  { value: "LATE", label: "Atrasado" },
];

const TERMINAL_STATUSES: AppointmentStatus[] = [
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
  "NO_SHOW",
];

/**
 * Returns true if the appointment is late:
 * current time is past date and the status is not a terminal one.
 */
export function isLate(appointment: AppointmentListItem): boolean {
  if (TERMINAL_STATUSES.includes(appointment.status)) return false;
  return new Date() > new Date(appointment.date);
}

/**
 * Returns true if the appointment is CONFIRMATION_PENDING and within
 * `thresholdMinutes` of its start time (or already past it).
 */
export function isUnconfirmedAndClose(
  appointment: AppointmentListItem,
  thresholdMinutes = 30,
): boolean {
  if (appointment.status !== "CONFIRMATION_PENDING") return false;
  const now = new Date();
  const start = new Date(appointment.date);
  const diffMs = start.getTime() - now.getTime();
  return diffMs <= thresholdMinutes * 60 * 1000;
}

/**
 * Returns the number of minutes until the appointment starts.
 * Negative values mean the appointment is overdue.
 */
export function getMinutesUntilStart(appointment: AppointmentListItem): number {
  const now = new Date();
  const start = new Date(appointment.date);
  return Math.floor((start.getTime() - now.getTime()) / (60 * 1000));
}
