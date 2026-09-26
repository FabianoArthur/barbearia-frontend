import { KpiCard } from "@/components/blocks/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays, DollarSign, Percent } from "lucide-react";
import type { BarberEarningsSummary } from "@/types";

interface EarningsSummaryProps {
  todayCount: number;
  earnings: BarberEarningsSummary | undefined;
}

export function EarningsSummary({
  todayCount,
  earnings,
}: EarningsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        title="Agendados Hoje"
        value={todayCount}
        icon={CalendarDays}
        variant="primary"
      />
      <KpiCard
        title={`Minha Parte (${earnings?.commissionPercent ?? 50}%)`}
        value={formatCurrency(earnings?.totalEarned ?? 0)}
        icon={DollarSign}
        variant="success"
      />
      <KpiCard
        title="Total de Cortes"
        value={earnings?.totalAppointments ?? 0}
        icon={Percent}
        variant="warning"
      />
    </div>
  );
}
