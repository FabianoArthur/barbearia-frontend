import { api } from "@/lib/api";
import type { WorkingHour, TimeOff, ScheduleOverride } from "@/types";
import type {
  CreateWorkingHourDto,
  CreateTimeOffDto,
  CreateScheduleOverrideDto,
} from "./types";

// Working Hours
export async function getWorkingHours(
  barberId: string,
): Promise<WorkingHour[]> {
  const res = await api.get<WorkingHour[]>(
    `/schedule/working-hours/${barberId}`,
  );
  return res.data;
}

export async function createWorkingHour(
  data: CreateWorkingHourDto,
): Promise<WorkingHour> {
  const res = await api.post<WorkingHour>("/schedule/working-hours", data);
  return res.data;
}

export async function deleteWorkingHour(id: string): Promise<void> {
  await api.delete(`/schedule/working-hours/${id}`);
}

// Time Off
export async function getTimeOff(barberId: string): Promise<TimeOff[]> {
  const res = await api.get<TimeOff[]>(`/schedule/time-off/${barberId}`);
  return res.data;
}

export async function createTimeOff(data: CreateTimeOffDto): Promise<TimeOff> {
  const res = await api.post<TimeOff>("/schedule/time-off", data);
  return res.data;
}

export async function deleteTimeOff(id: string): Promise<void> {
  await api.delete(`/schedule/time-off/${id}`);
}

// Schedule Overrides
export async function getOverrides(
  barberId: string,
): Promise<ScheduleOverride[]> {
  const res = await api.get<ScheduleOverride[]>(
    `/schedule/overrides/${barberId}`,
  );
  return res.data;
}

export async function createOverride(
  data: CreateScheduleOverrideDto,
): Promise<ScheduleOverride> {
  const res = await api.post<ScheduleOverride>("/schedule/overrides", data);
  return res.data;
}

export async function deleteOverride(id: string): Promise<void> {
  await api.delete(`/schedule/overrides/${id}`);
}
