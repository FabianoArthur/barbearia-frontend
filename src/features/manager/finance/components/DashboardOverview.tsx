import { KpiCard } from "@/components/blocks/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  Crown,
  DollarSign,
  HandCoins,
  Receipt,
  ShoppingCart,
  Star,
  Wallet,
} from "lucide-react";
import type { DashboardOverviewResponse } from "../types";

interface DashboardOverviewProps {
  dashboard: DashboardOverviewResponse | undefined;
  isLoading: boolean;
}

export function DashboardOverview({
  dashboard,
  isLoading,
}: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Nenhum dado financeiro disponivel. Os dados aparecero assim que
            houver agendamentos concluidos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pc = dashboard.periodComparison;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          icon={HandCoins}
          comparison={
            pc
              ? {
                  previousValue: pc.previousTips,
                  growthPercent: pc.tipsGrowthRate,
                }
              : undefined
          }
        />
        <KpiCard
          title="Taxas Plataforma"
          value={formatCurrency(dashboard.totalPlatformFees)}
          icon={Receipt}
          variant="warning"
          comparison={
            pc
              ? {
                  previousValue: pc.previousPlatformFees,
                  growthPercent: pc.feesGrowthRate,
                }
              : undefined
          }
        />
        <KpiCard
          title="Ticket Medio"
          value={formatCurrency(dashboard.averageOrderValue)}
          icon={ShoppingCart}
        />
      </div>

      {/* Today Snapshot */}
      {dashboard.today && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-lg font-bold">
                  {formatCurrency(dashboard.today.revenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agendamentos</p>
                <p className="text-lg font-bold">
                  {dashboard.today.bookingCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gorjetas</p>
                <p className="text-lg font-bold">
                  {formatCurrency(dashboard.today.tips)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Highlights */}
      {(dashboard.topBarber || dashboard.topService) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dashboard.topBarber && (
            <Card className="border-l-4 border-l-chart-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Crown className="h-4 w-4 text-chart-1" />
                  Top Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-lg font-bold text-foreground">
                  {dashboard.topBarber.barberName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(dashboard.topBarber.grossRevenue)} em receita
                  bruta
                </p>
              </CardContent>
            </Card>
          )}
          {dashboard.topService && (
            <Card className="border-l-4 border-l-chart-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-chart-2" />
                  Servico Mais Popular
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-lg font-bold text-foreground">
                  {dashboard.topService.serviceName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboard.topService.bookingCount} agendamentos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
