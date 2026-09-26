import { api } from "@/lib/api";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentListResponse,
} from "@/types";
import type { CreateAppointmentDto } from "./types";

/** Status filter includes LATE (server-side virtual status for overdue appointments). */
export type AppointmentStatusFilter = AppointmentStatus | "LATE";

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  establishmentId?: string;
  barberId?: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatusFilter[];
  sortBy?: "startsAt" | "endsAt" | "status" | "createdAt" | "priceSnapshot";
  sortOrder?: "asc" | "desc";
}

export async function findAppointments(
  params: AppointmentQueryParams,
): Promise<AppointmentListResponse> {
  const { status, ...rest } = params;
  const res = await api.get<AppointmentListResponse>("/appointments", {
    params: {
      ...rest,
      ...(status && status.length > 0 && { status: status.join(",") }),
    },
  });
  return res.data;
}

export async function findById(id: string): Promise<Appointment> {
  const res = await api.get<Appointment>(`/appointments/${id}`);
  return res.data;
}

export async function create(data: CreateAppointmentDto): Promise<Appointment> {
  const res = await api.post<Appointment>("/appointments", data);
  return res.data;
}

export async function updateStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const res = await api.patch<Appointment>(`/appointments/${id}/status`, {
    status,
  });
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}

// ─── Dedicated Action Endpoints ────────────────────────────────────────

export async function startAppointment(id: string): Promise<Appointment> {
  const res = await api.post<Appointment>(`/appointments/${id}/start`);
  return res.data;
}

export async function finishAppointment(id: string): Promise<Appointment> {
  const res = await api.post<Appointment>(`/appointments/${id}/finish`);
  return res.data;
}

export async function noShowAppointment(id: string): Promise<Appointment> {
  const res = await api.post<Appointment>(`/appointments/${id}/no-show`);
  return res.data;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const res = await api.post<Appointment>(`/appointments/${id}/cancel`);
  return res.data;
}

// ─── Notifications ─────────────────────────────────────────────────────

export async function sendConfirmation(appointmentId: string): Promise<void> {
  await api.post(`/notifications/send-confirmation/${appointmentId}`);
}

export async function sendReminder(appointmentId: string): Promise<void> {
  await api.post(`/notifications/send-reminder/${appointmentId}`);
}
