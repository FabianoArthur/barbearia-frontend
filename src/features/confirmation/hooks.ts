import useSWRMutation from "swr/mutation";
import { api } from "@/lib/api";

export function useConfirmAppointment() {
  const { trigger, isMutating, error } = useSWRMutation(
    "public-confirm",
    async (_key: string, { arg }: { arg: { code: string } }) => {
      const res = await api.post(
        `/public/booking/appointments/${arg.code}/confirm`,
      );
      return res.data;
    },
  );

  return { confirm: trigger, isConfirming: isMutating, confirmError: error };
}

export function useCancelAppointment() {
  const { trigger, isMutating, error } = useSWRMutation(
    "public-cancel",
    async (_key: string, { arg }: { arg: { code: string } }) => {
      const res = await api.post(
        `/public/booking/appointments/${arg.code}/cancel`,
      );
      return res.data;
    },
  );

  return { cancel: trigger, isCanceling: isMutating, cancelError: error };
}

export function useRescheduleAppointment() {
  const { trigger, isMutating, error } = useSWRMutation(
    "public-reschedule",
    async (
      _key: string,
      { arg }: { arg: { code: string; startsAt: string } },
    ) => {
      const res = await api.post(
        `/public/booking/appointments/${arg.code}/reschedule`,
        { startsAt: arg.startsAt },
      );
      return res.data;
    },
  );

  return {
    reschedule: trigger,
    isRescheduling: isMutating,
    rescheduleError: error,
  };
}
