import { useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useDashboardOverview } from "./hooks";
import { useDateRange } from "./context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { DashboardOverview } from "./components/DashboardOverview";
import { CompositionDonutChart } from "@/components/shared/charts/CompositionDonutChart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Period } from "./types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

export default function FinancePage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const {
    period,
    setPeriod,
    comparePrevious,
    setComparePrevious,
    toDashboardParams,
  } = useDateRange();

  const dashboardParams = useMemo(
    () => toDashboardParams(),
    [toDashboardParams],
  );

  const { dashboard, isLoading } = useDashboardOverview(
    establishmentId,
    dashboardParams,
  );

  // Use the revenueComposition directly from the backend response
  const composition = dashboard?.revenueComposition;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={comparePrevious ? "default" : "outline"}
          size="sm"
          onClick={() => setComparePrevious(!comparePrevious)}
        >
          Comparar periodo anterior
        </Button>
      </div>

      {/* Dashboard Overview (KPIs + highlights) */}
      <DashboardOverview dashboard={dashboard} isLoading={isLoading} />

      {/* Revenue Composition Donut Chart */}
      <CompositionDonutChart
        data={composition}
        isLoading={isLoading}
        title="Composicao de Receita"
      />
    </div>
  );
}
