export interface CreateWorkingHourDto {
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface CreateTimeOffDto {
  barberId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface CreateScheduleOverrideDto {
  barberId: string;
  startDate: string;
  endDate: string;
  weekday?: number;
  startTime: string;
  endTime: string;
  reason?: string;
}
