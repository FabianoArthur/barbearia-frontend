import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/api";
import type { WorkingHour, TimeOff, ScheduleOverride } from "@/types";
import * as scheduleService from "./services";
import type {
  CreateWorkingHourDto,
  CreateTimeOffDto,
  CreateScheduleOverrideDto,
} from "./types";

export function useWorkingHours(barberId: string | undefined) {
  const key = barberId ? `/schedule/working-hours/${barberId}` : null;
  const { data, error, isLoading } = useSWR<WorkingHour[]>(key, fetcher);
  return { workingHours: data ?? [], isLoading, isError: !!error };
}

export function useTimeOff(barberId: string | undefined) {
  const key = barberId ? `/schedule/time-off/${barberId}` : null;
  const { data, error, isLoading } = useSWR<TimeOff[]>(key, fetcher);
  return { timeOffs: data ?? [], isLoading, isError: !!error };
}

export function useOverrides(barberId: string | undefined) {
  const key = barberId ? `/schedule/overrides/${barberId}` : null;
  const { data, error, isLoading } = useSWR<ScheduleOverride[]>(key, fetcher);
  return { overrides: data ?? [], isLoading, isError: !!error };
}

export function useScheduleMutations(barberId: string | undefined) {
  async function addWorkingHour(data: CreateWorkingHourDto) {
    const result = await scheduleService.createWorkingHour(data);
    if (barberId) await globalMutate(`/schedule/working-hours/${barberId}`);
    return result;
  }

  async function removeWorkingHour(id: string) {
    await scheduleService.deleteWorkingHour(id);
    if (barberId) await globalMutate(`/schedule/working-hours/${barberId}`);
  }

  async function addTimeOff(data: CreateTimeOffDto) {
    const result = await scheduleService.createTimeOff(data);
    if (barberId) await globalMutate(`/schedule/time-off/${barberId}`);
    return result;
  }

  async function removeTimeOff(id: string) {
    await scheduleService.deleteTimeOff(id);
    if (barberId) await globalMutate(`/schedule/time-off/${barberId}`);
  }

  async function addOverride(data: CreateScheduleOverrideDto) {
    const result = await scheduleService.createOverride(data);
    if (barberId) await globalMutate(`/schedule/overrides/${barberId}`);
    return result;
  }

  async function removeOverride(id: string) {
    await scheduleService.deleteOverride(id);
    if (barberId) await globalMutate(`/schedule/overrides/${barberId}`);
  }

  return {
    addWorkingHour,
    removeWorkingHour,
    addTimeOff,
    removeTimeOff,
    addOverride,
    removeOverride,
  };
}
