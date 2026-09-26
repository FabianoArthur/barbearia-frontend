import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useRevenueAnalytics } from "../hooks";
import { useDateRange } from "../context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { TimeSeriesChart } from "@/components/shared/charts/TimeSeriesChart";
import type { ChartTimeSeriesPoint } from "@/components/shared/charts/TimeSeriesChart";
import { RevenueBarChart } from "@/components/shared/charts/RevenueBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  HandCoins,
  Receipt,
  ShoppingCart,
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";
import type { Period, Granularity, RevenueQueryParams } from "../types";

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
  { value: "quarter", label: "Trimestral" },
  { value: "year", label: "Anual" },
];

function growthPercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export default function RevenueAnalyticsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const {
    period,
    setPeriod,
    granularity,
    setGranularity,
    comparePrevious,
    setComparePrevious,
    toRevenueParams,
  } = useDateRange();

  const [barberFilter, setBarberFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  const queryParams = useMemo<RevenueQueryParams>(() => {
    const base = toRevenueParams();
    if (barberFilter !== "ALL") base.barberId = barberFilter;
    if (serviceFilter !== "ALL") base.serviceId = serviceFilter;
    return base;
  }, [toRevenueParams, barberFilter, serviceFilter]);

  const { analytics, isLoading } = useRevenueAnalytics(
    establishmentId,
    queryParams,
  );

  // Transform byPeriod to chart format
  const timeSeriesData = useMemo<ChartTimeSeriesPoint[]>(() => {
    if (!analytics?.byPeriod) return [];
    return analytics.byPeriod.map((p) => ({
      period: p.period,
      grossRevenue: p.grossRevenue,
      netRevenue: p.netRevenue,
      bookingCount: p.bookingCount,
      totalTips: p.totalTips,
      totalPlatformFees: p.totalPlatformFees,
    }));
  }, [analytics]);

  // Transform previousByPeriod to chart format for comparison overlay
  const comparisonData = useMemo<ChartTimeSeriesPoint[] | undefined>(() => {
    if (!analytics?.previousByPeriod) return undefined;
    return analytics.previousByPeriod.map((p) => ({
      period: p.period,
      grossRevenue: p.grossRevenue,
      netRevenue: p.netRevenue,
      bookingCount: p.bookingCount,
      totalTips: p.totalTips,
      totalPlatformFees: p.totalPlatformFees,
    }));
  }, [analytics]);

  // Transform barber revenue for bar chart
  const barberChartData = useMemo(() => {
    if (!analytics?.byBarber) return [];
    return analytics.byBarber.map((b) => ({
      name: b.barberName,
      "Receita Bruta": b.grossRevenue,
      "Receita Liquida": b.netRevenue,
    }));
  }, [analytics]);

  // Transform service revenue for bar chart
  const serviceChartData = useMemo(() => {
    if (!analytics?.byService) return [];
    return analytics.byService.map((s) => ({
      name: s.serviceName,
      "Receita Bruta": s.grossRevenue,
      "Receita Liquida": s.netRevenue,
    }));
  }, [analytics]);

  // Barber options from data
  const barberOptions = useMemo(
    () =>
      analytics?.byBarber?.map((b) => ({
        id: b.barberId,
        name: b.barberName,
      })) ?? [],
    [analytics],
  );

  // Service options from data
  const serviceOptions = useMemo(
    () =>
      analytics?.byService?.map((s) => ({
        id: s.serviceId,
        name: s.serviceName,
      })) ?? [],
    [analytics],
  );

  const handleBarberChange = useCallback((v: string) => setBarberFilter(v), []);
  const handleServiceChange = useCallback(
    (v: string) => setServiceFilter(v),
    [],
  );

  // Compute derived breakdown values from summary
  const summary = analytics?.summary;
  const prevSummary = analytics?.previousSummary;

  const tipsAvgPerBooking =
    summary && summary.totalBookings > 0
      ? summary.totalTips / summary.totalBookings
      : 0;
  const feePercentage =
    summary && summary.grossRevenue > 0
      ? (summary.totalPlatformFees / summary.grossRevenue) * 100
      : 0;
  const avgGross =
    summary && summary.totalBookings > 0
      ? summary.grossRevenue / summary.totalBookings
      : 0;
  const avgNet =
    summary && summary.totalBookings > 0
      ? summary.netRevenue / summary.totalBookings
      : 0;

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

        <Select value={barberFilter} onValueChange={handleBarberChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os Barbeiros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Barbeiros</SelectItem>
            {barberOptions.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={serviceFilter} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os Servicos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os Servicos</SelectItem>
            {serviceOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
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

      {/* Time Series Chart with comparison overlay */}
      <TimeSeriesChart
        data={timeSeriesData}
        comparisonData={comparisonData}
        title="Receita Bruta vs Liquida"
        metrics={["grossRevenue", "netRevenue"]}
        isLoading={isLoading}
      />

      {/* Breakdown Panels with comparison */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <HandCoins className="h-4 w-4" />
                Gorjetas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <p className="text-xl font-bold">
                {formatCurrency(summary.totalTips)}
              </p>
              <p className="text-xs text-muted-foreground">
                Media: {formatCurrency(tipsAvgPerBooking)} por agendamento
              </p>
              {prevSummary && (
                <ComparisonBadge
                  current={summary.totalTips}
                  previous={prevSummary.totalTips}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Taxas da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <p className="text-xl font-bold">
                {formatCurrency(summary.totalPlatformFees)}
              </p>
              <p className="text-xs text-muted-foreground">
                {feePercentage.toFixed(1)}% da receita bruta
              </p>
              {prevSummary && (
                <ComparisonBadge
                  current={summary.totalPlatformFees}
                  previous={prevSummary.totalPlatformFees}
                  invertColors
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Ticket Medio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <p className="text-xl font-bold">{formatCurrency(avgGross)}</p>
              <p className="text-xs text-muted-foreground">
                Liquido: {formatCurrency(avgNet)}
              </p>
              {prevSummary && (
                <ComparisonBadge
                  current={summary.averageOrderValue}
                  previous={prevSummary.averageOrderValue}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Revenue by Barber */}
      <RevenueBarChart
        data={barberChartData}
        dataKeys={["Receita Bruta", "Receita Liquida"]}
        title="Receita por Barbeiro"
        isLoading={isLoading}
      />

      {/* Revenue by Service */}
      <RevenueBarChart
        data={serviceChartData}
        dataKeys={["Receita Bruta", "Receita Liquida"]}
        title="Receita por Servico"
        isLoading={isLoading}
      />
    </div>
  );
}

// ─── Comparison Badge ──────────────────────────────────────────────────

function ComparisonBadge({
  current,
  previous,
  invertColors = false,
}: {
  current: number;
  previous: number;
  invertColors?: boolean;
}) {
  const pct = growthPercent(current, previous);
  const isPositive = pct > 0;
  const isNeutral = Math.abs(pct) < 0.1;

  // For fees, growth is bad (inverted colors)
  const positiveColor = invertColors ? "text-destructive" : "text-emerald-600";
  const negativeColor = invertColors ? "text-emerald-600" : "text-destructive";

  return (
    <p
      className={`text-xs flex items-center gap-1 ${isNeutral ? "text-muted-foreground" : isPositive ? positiveColor : negativeColor}`}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {pct.toFixed(1)}% vs anterior ({formatCurrency(previous)})
    </p>
  );
}
