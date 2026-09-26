import { api } from "@/lib/api";
import type { AvailabilityResponse, Appointment } from "@/types";
import type { CreatePublicAppointmentDto } from "./types";

export async function getAvailability(
  barberId: string,
  date: string,
  serviceId: string,
): Promise<AvailabilityResponse> {
  const res = await api.get<AvailabilityResponse>(
    `/public/booking/barbers/${barberId}/availability`,
    { params: { date, serviceId } },
  );
  return res.data;
}

export async function createPublicAppointment(
  data: CreatePublicAppointmentDto,
): Promise<Appointment> {
  const res = await api.post<Appointment>("/public/booking/appointments", data);
  return res.data;
}
