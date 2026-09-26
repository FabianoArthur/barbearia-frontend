import { useMemo } from "react";
import { isUnconfirmedAndClose } from "@/lib/appointment-utils";
import type { AppointmentListItem } from "@/types";
import { AlertTriangle } from "lucide-react";

interface UnconfirmedWarningBannerProps {
  appointments: AppointmentListItem[];
  thresholdMinutes?: number;
}

export function UnconfirmedWarningBanner({
  appointments,
  thresholdMinutes = 30,
}: UnconfirmedWarningBannerProps) {
  const unconfirmedClose = useMemo(
    () =>
      appointments.filter((a) => isUnconfirmedAndClose(a, thresholdMinutes)),
    [appointments, thresholdMinutes],
  );

  if (unconfirmedClose.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>
        <strong>{unconfirmedClose.length}</strong>{" "}
        {unconfirmedClose.length === 1
          ? "agendamento nao confirmado proximo do horario"
          : "agendamentos nao confirmados proximos do horario"}
      </span>
    </div>
  );
}
