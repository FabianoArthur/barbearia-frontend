import { useBarberAppointments } from "@/features/manager/appointments/hooks";
import { useBarberEarnings } from "@/features/manager/finance/hooks";

export function useBarberDashboard(barberId: string | undefined) {
  const { appointments, isLoading: apptLoading } =
    useBarberAppointments(barberId);
  const { earnings, isLoading: earningsLoading } = useBarberEarnings(barberId);

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) =>
    a.date.startsWith(today),
  );

  return {
    appointments,
    todayAppointments,
    earnings,
    isLoading: apptLoading || earningsLoading,
  };
}
