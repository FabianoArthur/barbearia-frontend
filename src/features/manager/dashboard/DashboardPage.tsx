import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { useAuth } from "@/features/auth/context";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useDashboardOverview, useRevenueAnalytics } from "../finance/hooks";
import { TimeSeriesChart } from "@/components/shared/charts/TimeSeriesChart";
import type { ChartTimeSeriesPoint } from "@/components/shared/charts/TimeSeriesChart";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/blocks/KpiCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  Users,
  Store,
  Scissors,
  Sparkles,
  Clock,
  Wallet,
} from "lucide-react";
import type { Period, Granularity, RevenueQueryParams } from "../finance/types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
];

const PERIOD_GRANULARITY: Record<Period, Granularity> = {
  today: "hour",
  week: "day",
  month: "day",
  quarter: "week",
  year: "month",
  all: "month",
};

function computeDateRange(period: Period): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();

  switch (period) {
    case "today":
      return { startDate: startOfDay(now).toISOString(), endDate };
    case "week":
      return {
        startDate: startOfWeek(subWeeks(now, 1)).toISOString(),
        endDate,
      };
    case "month":
      return {
        startDate: startOfMonth(subMonths(now, 1)).toISOString(),
        endDate,
      };
    case "quarter":
      return {
        startDate: startOfQuarter(subQuarters(now, 1)).toISOString(),
        endDate,
      };
    case "year":
      return {
        startDate: startOfYear(subYears(now, 1)).toISOString(),
        endDate,
      };
    case "all":
      return { startDate: "2020-01-01T00:00:00.000Z", endDate };
    default:
      return {
        startDate: startOfMonth(subMonths(now, 1)).toISOString(),
        endDate,
      };
  }
}

const quickLinks = [
  {
    to: "/manager/appointments",
    label: "Agendamentos",
    description: "Gerenciar agendamentos",
    icon: CalendarDays,
  },
  {
    to: "/manager/establishments",
    label: "Estabelecimentos",
    description: "Ver e editar unidades",
    icon: Store,
  },
  {
    to: "/manager/barbers",
    label: "Barbeiros",
    description: "Gerenciar equipe",
    icon: Scissors,
  },
  {
    to: "/manager/services",
    label: "Servicos",
    description: "Catalogo de servicos",
    icon: Sparkles,
  },
  {
    to: "/manager/schedule",
    label: "Horarios",
    description: "Configurar agenda",
    icon: Clock,
  },
  {
    to: "/manager/clients",
    label: "Clientes",
    description: "Base de clientes",
    icon: Users,
  },
  {
    to: "/manager/finance",
    label: "Financeiro",
    description: "Relatorios completos",
    icon: DollarSign,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const [period, setPeriod] = useState<Period>("month");

  const { startDate, endDate } = useMemo(
    () => computeDateRange(period),
    [period],
  );
  const granularity = PERIOD_GRANULARITY[period];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo, {user?.name}. Aqui esta o resumo do seu negocio.
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-3">
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

      {/* KPI Section */}
      <DashboardKpis establishmentId={establishmentId} period={period} />

      {/* Revenue Chart */}
      <DashboardRevenueChart
        establishmentId={establishmentId}
        startDate={startDate}
        endDate={endDate}
        granularity={granularity}
        periodLabel={
          PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period
        }
      />

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Acesso Rapido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard KPIs ────────────────────────────────────────────────────

function DashboardKpis({
  establishmentId,
  period,
}: {
  establishmentId: string | null;
  period: Period;
}) {
  const dashboardParams = useMemo(
    () => ({ period, comparePrevious: true }),
    [period],
  );

  const { dashboard, isLoading } = useDashboardOverview(
    establishmentId,
    dashboardParams,
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Aguardando Dados"
          value="—"
          icon={DollarSign}
          subtitle="Os dados aparecerao com agendamentos concluidos"
        />
      </div>
    );
  }

  const pc = dashboard.periodComparison;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Receita Bruta"
        value={formatCurrency(dashboard.grossRevenue)}
        icon={DollarSign}
        variant="primary"
        comparison={
          pc
            ? {
                previousValue: pc.previousGrossRevenue,
                growthPercent: pc.revenueGrowthRate,
              }
            : undefined
        }
      />
      <KpiCard
        title="Receita Liquida"
        value={formatCurrency(dashboard.netRevenue)}
        icon={Wallet}
        variant="success"
        comparison={
          pc
            ? {
                previousValue: pc.previousNetRevenue,
                growthPercent: pc.netRevenueGrowthRate,
              }
            : undefined
        }
      />
      <KpiCard
        title="Agendamentos"
        value={dashboard.totalBookings}
        icon={CalendarDays}
        comparison={
          pc
            ? {
                previousValue: pc.previousBookings,
                growthPercent: pc.bookingsGrowthRate,
              }
            : undefined
        }
      />
      <KpiCard
        title="Gorjetas"
        value={formatCurrency(dashboard.totalTips)}
        icon={TrendingUp}
        comparison={
          pc
            ? {
                previousValue: pc.previousTips,
                growthPercent: pc.tipsGrowthRate,
              }
            : undefined
        }
      />
    </div>
  );
}

// ─── Revenue Chart ─────────────────────────────────────────────────────

function DashboardRevenueChart({
  establishmentId,
  startDate,
  endDate,
  granularity,
  periodLabel,
}: {
  establishmentId: string | null;
  startDate: string;
  endDate: string;
  granularity: Granularity;
  periodLabel: string;
}) {
  const queryParams = useMemo<RevenueQueryParams>(
    () => ({ startDate, endDate, granularity }),
    [startDate, endDate, granularity],
  );

  const { analytics, isLoading } = useRevenueAnalytics(
    establishmentId,
    queryParams,
  );

  const chartData = useMemo<ChartTimeSeriesPoint[]>(() => {
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

  return (
    <TimeSeriesChart
      data={chartData}
      title={`Receita — ${periodLabel}`}
      metrics={["grossRevenue", "netRevenue"]}
      isLoading={isLoading}
    />
  );
}
