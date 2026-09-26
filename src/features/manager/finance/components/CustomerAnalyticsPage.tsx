import { useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useCustomerAnalytics } from "../hooks";
import { useDateRange } from "../context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/blocks/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { Users, UserPlus, UserCheck, UserMinus } from "lucide-react";
import type { Period, CustomerQueryParams } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

export default function CustomerAnalyticsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, startDate, endDate } = useDateRange();

  const queryParams = useMemo<CustomerQueryParams>(
    () => ({
      startDate,
      endDate,
      topLimit: 10,
    }),
    [startDate, endDate],
  );

  const { analytics, isLoading } = useCustomerAnalytics(
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

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total de Clientes"
            value={analytics.totalCustomers}
            icon={Users}
            variant="primary"
          />
          <KpiCard
            title="Novos Clientes"
            value={analytics.newCustomers}
            icon={UserPlus}
            variant="success"
          />
          <KpiCard
            title="Clientes Recorrentes"
            value={analytics.returningCustomers}
            icon={UserCheck}
            variant="default"
          />
          <KpiCard
            title="Clientes Perdidos"
            value={analytics.churnedCustomers}
            icon={UserMinus}
            variant="warning"
          />
        </div>
      ) : null}

      {/* Metrics */}
      {!isLoading && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Media de Agendamentos/Cliente
              </p>
              <p className="text-2xl font-bold text-primary">
                {analytics.averageBookingsPerCustomer.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Taxa de Retencao</p>
              <p className="text-2xl font-bold text-chart-2">
                {(analytics.retentionRate * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Taxa de Churn</p>
              <p className="text-2xl font-bold text-destructive">
                {analytics.totalCustomers > 0
                  ? (
                      (analytics.churnedCustomers / analytics.totalCustomers) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">Top Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !analytics || analytics.topCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado de clientes disponivel.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>CLIENTE</TableHead>
                  <TableHead>RECEITA TOTAL</TableHead>
                  <TableHead>AGENDAMENTOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topCustomers.map((customer, idx) => (
                  <TableRow key={customer.clientId}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {customer.clientName}
                    </TableCell>
                    <TableCell className="text-primary font-bold">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                    <TableCell>{customer.bookingCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
