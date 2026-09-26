import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getMinutesUntilStart } from "@/lib/appointment-utils";
import type { AppointmentListItem } from "@/types";
import { Clock } from "lucide-react";

interface CountdownBadgeProps {
  appointment: AppointmentListItem;
}

export function CountdownBadge({ appointment }: CountdownBadgeProps) {
  const [minutes, setMinutes] = useState(() =>
    getMinutesUntilStart(appointment),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(getMinutesUntilStart(appointment));
    }, 30_000); // update every 30s
    return () => clearInterval(interval);
  }, [appointment]);

  // Don't show for terminal statuses
  if (
    appointment.status === "DONE" ||
    appointment.status === "CANCELED" ||
    appointment.status === "NO_SHOW" ||
    appointment.status === "IN_PROGRESS"
  ) {
    return null;
  }

  if (minutes <= 0) {
    const overdue = Math.abs(minutes);
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <Clock className="h-3 w-3" />
        {overdue}min atrasado
      </Badge>
    );
  }

  if (minutes <= 30) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Clock className="h-3 w-3" />
        Em {minutes}min
      </Badge>
    );
  }

  return null;
}
