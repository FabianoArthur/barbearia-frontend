export interface CreatePublicAppointmentDto {
  establishmentId: string;
  barberId: string;
  serviceId: string;
  startsAt: string;
  clientName: string;
  clientCpf: string;
  clientPhone?: string;
}
