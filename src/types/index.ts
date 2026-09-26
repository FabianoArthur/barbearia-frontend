export type Role = "BARBER" | "MANAGER" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  establishmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Establishment {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  monthlyCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Barber {
  id: string;
  userId: string;
  establishmentId: string;
  commissionPercent: number;
  user?: User;
  establishment?: Establishment;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  establishmentId: string;
  name: string;
  cpf: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  establishmentId?: string;
  barberId?: string;
  name: string;
  price: number;
  durationMinutes: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkingHour {
  id: string;
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface TimeOff {
  id: string;
  barberId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface ScheduleOverride {
  id: string;
  barberId: string;
  startDate: string;
  endDate: string;
  weekday?: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMATION_PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  code?: string;
  establishmentId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startsAt: string;
  endsAt?: string;
  status: AppointmentStatus;
  priceSnapshot?: number;
  barber?: Barber;
  client?: Client;
  service?: Service;
  createdAt?: string;
}

/** Flat read-model returned by GET /api/appointments (CQRS) */
export interface AppointmentListItem {
  id: string;
  barberName: string;
  barberId: string;
  date: string;
  clientName: string;
  clientId: string;
  serviceName: string;
  serviceId: string;
  serviceValue: number;
  status: AppointmentStatus;
}

export interface PaginationMeta {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AppointmentListResponse {
  data: AppointmentListItem[];
  meta: PaginationMeta;
  totalRevenue: number;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  slots: AvailabilitySlot[];
  serviceDurationMinutes: number;
  workingPeriods: { startTime: string; endTime: string }[];
}

export interface WorkingPeriod {
  startTime: string;
  endTime: string;
}

export interface PublicWorkingHoursDay {
  date: string;
  weekday: number;
  periods: WorkingPeriod[];
}

export interface BarberEarningsSummary {
  totalEarned: number;
  totalAppointments: number;
  commissionPercent: number;
}

export interface AuthResponse {
  user: User;
}
