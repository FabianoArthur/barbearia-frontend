import { useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useBarberDashboard } from "./hooks";
import { useBarberSSE } from "./useBarberSSE";
import { useAppointmentMutations } from "@/features/manager/appointments/hooks";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AgendaTable } from "./components/AgendaTable";
import { EarningsSummary } from "./components/EarningsSummary";
import { OfflineBanner } from "./components/OfflineBanner";
import { UnconfirmedWarningBanner } from "@/components/shared/UnconfirmedWarningBanner";
import type { AppointmentStatus } from "@/types";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

const statusMessages: Partial<Record<AppointmentStatus, string>> = {
  IN_PROGRESS: "Atendimento iniciado!",
  DONE: "Atendimento concluido!",
  NO_SHOW: "Cliente marcado como nao compareceu.",
  CANCELED: "Agendamento cancelado.",
};

export default function BarberDashboard() {
  const { user } = useAuth();

  // The barber's profile ID — for now we use the user ID.
  // In production the barber profile ID would come from the user's barber record.
  const barberId = user?.id;

  const { todayAppointments, earnings, isLoading } =
    useBarberDashboard(barberId);
  const { isOffline } = useBarberSSE(barberId);
  const { changeStatus, sendConfirmation, sendReminder } =
    useAppointmentMutations(undefined, barberId);

  const handleStatusChange = useCallback(
    async (id: string, status: AppointmentStatus) => {
      try {
        await changeStatus(id, status);
        toast.success(statusMessages[status] ?? "Status atualizado!");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [changeStatus],
  );

  const handleSendNotification = useCallback(
    async (id: string, type: "confirmation" | "reminder") => {
      try {
        if (type === "confirmation") {
          await sendConfirmation(id);
          toast.success("Confirmacao enviada via WhatsApp!");
        } else {
          await sendReminder(id);
          toast.success("Lembrete enviado via WhatsApp!");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [sendConfirmation, sendReminder],
  );

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Painel do Barbeiro
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <EarningsSummary
            todayCount={todayAppointments.length}
            earnings={earnings}
          />
        )}

        <Separator />

        {isOffline && <OfflineBanner />}

        {!isLoading && (
          <UnconfirmedWarningBanner appointments={todayAppointments} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-primary text-base">
              Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <AgendaTable
                appointments={todayAppointments}
                onStatusChange={handleStatusChange}
                onSendNotification={handleSendNotification}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
