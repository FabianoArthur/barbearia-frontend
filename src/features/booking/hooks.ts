import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, api } from "@/lib/api";
import type {
  Establishment,
  Barber,
  Service,
  PublicWorkingHoursDay,
  AvailabilityResponse,
  Appointment,
} from "@/types";
import type { CreatePublicAppointmentDto } from "./types";

// ── Public data hooks (no auth required) ──

export function usePublicEstablishments() {
  const { data, error, isLoading } = useSWR<Establishment[]>(
    "/public/booking/establishments",
    fetcher,
  );

  return { establishments: data ?? [], isLoading, isError: !!error };
}

export function usePublicEstablishment(id: string | undefined) {
  const { data, error, isLoading } = useSWR<Establishment>(
    id ? `/public/booking/establishments/${id}` : null,
    fetcher,
  );

  return { establishment: data, isLoading, isError: !!error };
}

export function useBarberServices(barberId: string | undefined) {
  const { data, error, isLoading } = useSWR<Service[]>(
    barberId ? `/public/booking/barbers/${barberId}/services` : null,
    fetcher,
  );

  return { services: data ?? [], isLoading, isError: !!error };
}

export function usePublicBarbers(establishmentId: string | undefined) {
  const { data, error, isLoading } = useSWR<Barber[]>(
    establishmentId
      ? `/public/booking/establishments/${establishmentId}/barbers`
      : null,
    fetcher,
  );

  return { barbers: data ?? [], isLoading, isError: !!error };
}

export function useEstablishmentServices(establishmentId: string | undefined) {
  const { data, error, isLoading } = useSWR<Service[]>(
    establishmentId
      ? `/public/booking/establishments/${establishmentId}/services`
      : null,
    fetcher,
  );

  return { services: data ?? [], isLoading, isError: !!error };
}

export function useServiceBarbers(
  establishmentId: string | undefined,
  serviceId: string | undefined,
) {
  const { data, error, isLoading } = useSWR<Barber[]>(
    establishmentId && serviceId
      ? `/public/booking/establishments/${establishmentId}/services/${serviceId}/barbers`
      : null,
    fetcher,
  );

  return { barbers: data ?? [], isLoading, isError: !!error };
}

export function usePublicWorkingHours(
  barberId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();

  const { data, error, isLoading } = useSWR<PublicWorkingHoursDay[]>(
    barberId
      ? `/public/booking/barbers/${barberId}/working-hours${qs ? `?${qs}` : ""}`
      : null,
    fetcher,
  );

  return { workingHours: data ?? [], isLoading, isError: !!error };
}

// ── Availability & Booking ──

export function useAvailability(
  barberId: string | undefined,
  date: string | undefined,
  serviceId: string | undefined,
) {
  const key =
    barberId && date && serviceId
      ? `/public/booking/barbers/${barberId}/availability?date=${date}&serviceId=${serviceId}`
      : null;
  const { data, error, isLoading } = useSWR<AvailabilityResponse>(key, fetcher);

  return {
    slots: data?.slots ?? [],
    serviceDurationMinutes: data?.serviceDurationMinutes,
    workingPeriods: data?.workingPeriods ?? [],
    isLoading,
    isError: !!error,
  };
}

export function useBooking() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/public/booking/appointments",
    async (_url: string, { arg }: { arg: CreatePublicAppointmentDto }) => {
      const res = await api.post<Appointment>(
        "/public/booking/appointments",
        arg,
      );
      return res.data;
    },
  );

  return { book: trigger, isBooking: isMutating, bookingError: error };
}
