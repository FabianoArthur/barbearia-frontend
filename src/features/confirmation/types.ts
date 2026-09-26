export interface ConfirmAppointmentDto {
  code: string;
}

export interface CancelAppointmentDto {
  code: string;
}

export interface RescheduleAppointmentDto {
  code: string;
  startsAt: string;
}
