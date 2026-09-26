import { useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useFinancialBreakdown } from "../hooks";
import { useDateRange } from "../context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { Period, BreakdownQueryParams } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

interface BreakdownCardProps {
  label: string;
  value: string;
  subLabel?: string;
  variant?: "default" | "positive" | "negative";
}

function BreakdownCard({
  label,
  value,
  subLabel,
  variant = "default",
}: BreakdownCardProps) {
  const colorClass =
    variant === "positive"
      ? "text-chart-2"
      : variant === "negative"
        ? "text-destructive"
        : "text-primary";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        {subLabel && (
          <p className="text-xs text-muted-foreground mt-1">{subLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BreakdownPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, startDate, endDate } = useDateRange();

  const queryParams = useMemo<BreakdownQueryParams>(
    () => ({ startDate, endDate }),
    [startDate, endDate],
  );

  const { breakdown, isLoading } = useFinancialBreakdown(
    establishmentId,
    queryParams,
  );

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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !breakdown ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum dado disponivel para o periodo selecionado.
        </p>
      ) : (
        <>
          {/* Revenue Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Composicao de Receita
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BreakdownCard
                label="Receita de Agendamentos"
                value={formatCurrency(breakdown.bookingRevenue)}
                variant="positive"
              />
              <BreakdownCard
                label="Gorjetas Totais"
                value={formatCurrency(breakdown.totalTips)}
                variant="positive"
              />
              <BreakdownCard
                label="Receita Bruta"
                value={formatCurrency(breakdown.grossRevenue)}
                subLabel="Agendamentos + Gorjetas"
              />
            </div>
          </div>

          {/* Deductions Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Deducoes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BreakdownCard
                label="Taxas da Plataforma"
                value={formatCurrency(breakdown.totalPlatformFees)}
                subLabel={`${(breakdown.feeToRevenueRatio * 100).toFixed(1)}% da receita bruta`}
                variant="negative"
              />
              <BreakdownCard
                label="Reembolsos"
                value={formatCurrency(breakdown.totalRefunds)}
                subLabel={`Taxa de reembolso: ${(breakdown.refundRate * 100).toFixed(1)}%`}
                variant="negative"
              />
              <BreakdownCard
                label="Receita Liquida"
                value={formatCurrency(breakdown.netRevenue)}
                subLabel="Bruta - Taxas - Reembolsos"
              />
            </div>
          </div>

          {/* Ratios */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Indicadores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BreakdownCard
                label="Total de Agendamentos"
                value={String(breakdown.totalBookings)}
              />
              <BreakdownCard
                label="Taxa Media por Agendamento"
                value={formatCurrency(breakdown.averageFeePerBooking)}
              />
              <BreakdownCard
                label="Taxa de Reembolso"
                value={`${(breakdown.refundRate * 100).toFixed(1)}%`}
                variant={breakdown.refundRate > 0.05 ? "negative" : "default"}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
