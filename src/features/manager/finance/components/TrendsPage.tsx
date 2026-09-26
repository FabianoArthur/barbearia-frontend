import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useTrends } from "../hooks";
import { useDateRange } from "../context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { TimeSeriesChart } from "@/components/shared/charts/TimeSeriesChart";
import type { ChartTimeSeriesPoint } from "@/components/shared/charts/TimeSeriesChart";
import { RevenueBarChart } from "@/components/shared/charts/RevenueBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { TrendingUp, TrendingDown, Zap, Minus } from "lucide-react";
import type {
  Period,
  Granularity,
  TrendMetric,
  TrendsQueryParams,
} from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "hour", label: "Por Hora" },
  { value: "day", label: "Diario" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
  { value: "year", label: "Anual" },
];

const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: "revenue", label: "Receita" },
  { value: "bookings", label: "Agendamentos" },
  { value: "tips", label: "Gorjetas" },
  { value: "fees", label: "Taxas" },
];

type ChartMetricKey =
  "grossRevenue" | "bookingCount" | "totalTips" | "totalPlatformFees";

const METRIC_TO_CHART_KEY: Record<TrendMetric, ChartMetricKey> = {
  revenue: "grossRevenue",
  bookings: "bookingCount",
  tips: "totalTips",
  fees: "totalPlatformFees",
};

export default function TrendsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, granularity, setGranularity, toTrendsParams } =
    useDateRange();

  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>("revenue");

  // Build query params with the metric appended
  const queryParams = useMemo<TrendsQueryParams | undefined>(() => {
    const base = toTrendsParams();
    if (!base) return undefined;
    return { ...base, metric: selectedMetric };
  }, [toTrendsParams, selectedMetric]);

  const { trends, isLoading } = useTrends(establishmentId, queryParams);

  const chartKey = METRIC_TO_CHART_KEY[selectedMetric];

  // Map backend `current` array to chart format
  const chartData = useMemo<ChartTimeSeriesPoint[]>(() => {
    if (!trends?.current) return [];
    return trends.current.map((p) => ({
      period: p.period,
      grossRevenue: p.grossRevenue,
      netRevenue: p.netRevenue,
      bookingCount: p.bookingCount,
      totalTips: p.totalTips,
      totalPlatformFees: p.totalPlatformFees,
    }));
  }, [trends]);

  // Map backend `previous` array to chart format
  const comparisonData = useMemo<ChartTimeSeriesPoint[] | undefined>(() => {
    if (!trends?.previous) return undefined;
    return trends.previous.map((p) => ({
      period: p.period,
      grossRevenue: p.grossRevenue,
      netRevenue: p.netRevenue,
      bookingCount: p.bookingCount,
      totalTips: p.totalTips,
      totalPlatformFees: p.totalPlatformFees,
    }));
  }, [trends]);

  // Compute overall growth rate from growthRates array
  const overallGrowthRate = useMemo(() => {
    if (!trends?.growthRates || trends.growthRates.length === 0) return 0;
    // Use the last growth rate as the overall/latest
    return trends.growthRates[trends.growthRates.length - 1].growthRate;
  }, [trends]);

  const formatValue = useCallback(
    (value: number) => {
      if (selectedMetric === "bookings") return String(value);
      return formatCurrency(value);
    },
    [selectedMetric],
  );

  const handleMetricChange = useCallback((v: string) => {
    setSelectedMetric(v as TrendMetric);
  }, []);

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

        <Select
          value={granularity}
          onValueChange={(v) => setGranularity(v as Granularity)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Granularidade" />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={handleMetricChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Metrica" />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Growth Rate Badge */}
      {!isLoading && trends && (
        <div className="flex items-center gap-4">
          <GrowthBadge label="Taxa de Crescimento" rate={overallGrowthRate} />
        </div>
      )}

      {/* Time Series Chart */}
      <TimeSeriesChart
        data={chartData}
        comparisonData={comparisonData}
        title={`Tendencia — ${METRIC_OPTIONS.find((m) => m.value === selectedMetric)?.label ?? ""}`}
        metrics={[chartKey]}
        isLoading={isLoading}
        formatValue={formatValue}
      />

      {/* Peak Period */}
      {!isLoading && trends?.peakPeriod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-primary text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Periodo de Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Card className="border-l-4 border-l-chart-4 inline-block">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(trends.peakPeriod.period)}
                </p>
                <p className="text-lg font-bold text-primary">
                  {selectedMetric === "bookings"
                    ? trends.peakPeriod.value
                    : formatCurrency(trends.peakPeriod.value)}
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Growth Rates by Period (Bar Chart) */}
      {!isLoading && trends?.growthRates && trends.growthRates.length > 1 && (
        <RevenueBarChart
          data={trends.growthRates.map((gr) => ({
            name: formatDate(gr.period),
            "Taxa de Crescimento (%)": parseFloat(gr.growthRate.toFixed(1)),
          }))}
          dataKeys={["Taxa de Crescimento (%)"]}
          title="Taxas de Crescimento por Periodo"
          formatValue={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
          formatYAxis={(v) => `${v}%`}
          height={300}
        />
      )}

      {/* Empty State */}
      {!isLoading && (!trends || trends.current.length === 0) && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Nenhum dado de tendencia disponivel para o periodo selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Growth Badge Component ────────────────────────────────────────────

function GrowthBadge({ label, rate }: { label: string; rate: number }) {
  const isPositive = rate > 0;
  const isNeutral = rate === 0;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-muted-foreground">{label}:</span>}
      <Badge
        variant={
          isNeutral ? "secondary" : isPositive ? "default" : "destructive"
        }
        className="gap-1"
      >
        {isNeutral ? (
          <Minus className="h-3 w-3" />
        ) : isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? "+" : ""}
        {rate.toFixed(1)}%
      </Badge>
    </div>
  );
}
