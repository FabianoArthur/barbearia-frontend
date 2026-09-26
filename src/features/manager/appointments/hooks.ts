import useSWR, { useSWRConfig } from "swr";
import type {
  Appointment,
  AppointmentListResponse,
  AppointmentStatus,
  PaginationMeta,
} from "@/types";
import { findAppointments, type AppointmentQueryParams } from "./services";
import * as appointmentService from "./services";

const EMPTY_META: PaginationMeta = {
  totalItems: 0,
  itemsPerPage: 20,
  currentPage: 1,
  totalPages: 0,
};

function buildQueryString(params: AppointmentQueryParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return `/appointments?${searchParams.toString()}`;
}

export function useAppointments(params: AppointmentQueryParams) {
  const key = buildQueryString(params);

  const { data, error, isLoading } = useSWR<AppointmentListResponse>(key, () =>
    findAppointments(params),
  );

  return {
    appointments: data?.data ?? [],
    meta: data?.meta ?? EMPTY_META,
    totalRevenue: data?.totalRevenue ?? 0,
    isLoading,
    isError: !!error,
  };
}

export function useBarberAppointments(barberId: string | undefined) {
  const params: AppointmentQueryParams = {
    barberId,
    limit: 100,
    sortBy: "startsAt",
    sortOrder: "asc",
  };
  const key = barberId ? buildQueryString(params) : null;

  const { data, error, isLoading } = useSWR<AppointmentListResponse>(key, () =>
    findAppointments(params),
  );

  return {
    appointments: data?.data ?? [],
    isLoading,
    isError: !!error,
  };
}

export function useAppointmentMutations(
  _establishmentId: string | undefined,
  _barberId?: string | undefined,
) {
  const { mutate } = useSWRConfig();

  function revalidateAppointments() {
    return mutate(
      (key: unknown) =>
        typeof key === "string" && key.startsWith("/appointments"),
      undefined,
      { revalidate: true },
    );
  }

  /**
   * Route to the correct dedicated action endpoint based on target status.
   * For DONE (finish), returns the appointment so the caller can look up
   * the auto-created PENDING payment and trigger the payment confirm dialog.
   */
  async function changeStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment | void> {
    let result: Appointment;
    switch (status) {
      case "IN_PROGRESS":
        result = await appointmentService.startAppointment(id);
        break;
      case "DONE":
        result = await appointmentService.finishAppointment(id);
        break;
      case "NO_SHOW":
        result = await appointmentService.noShowAppointment(id);
        break;
      case "CANCELED":
        result = await appointmentService.cancelAppointment(id);
        break;
      default:
        result = await appointmentService.updateStatus(id, status);
        break;
    }
    await revalidateAppointments();
    return result;
  }

  async function deleteAppointment(id: string) {
    await appointmentService.remove(id);
    await revalidateAppointments();
  }

  async function sendConfirmation(appointmentId: string) {
    await appointmentService.sendConfirmation(appointmentId);
    await revalidateAppointments();
  }

  async function sendReminder(appointmentId: string) {
    await appointmentService.sendReminder(appointmentId);
    await revalidateAppointments();
  }

  return { changeStatus, deleteAppointment, sendConfirmation, sendReminder };
}
