export interface CreateAppointmentDto {
  establishmentId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startsAt: string;
}

export interface UpdateStatusDto {
  status: "SCHEDULED" | "DONE" | "CANCELED";
}
