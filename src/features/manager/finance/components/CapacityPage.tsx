import { useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useCapacityUtilization } from "../hooks";
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
import { Activity, AlertTriangle } from "lucide-react";
import type { Period, CapacityQueryParams } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
];

export default function CapacityPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, startDate, endDate } = useDateRange();

  const queryParams = useMemo<CapacityQueryParams | undefined>(() => {
    if (!startDate || !endDate) return undefined;
    return { startDate, endDate };
  }, [startDate, endDate]);

  const { capacity, isLoading } = useCapacityUtilization(
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : capacity ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title="Taxa de Utilizacao Geral"
            value={`${(capacity.overallUtilizationRate * 100).toFixed(1)}%`}
            icon={Activity}
            variant="primary"
          />
          <KpiCard
            title="Receita Perdida Estimada"
            value={formatCurrency(capacity.totalLostRevenue)}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>
      ) : null}

      {/* Capacity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">
            Utilizacao por Barbeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !capacity || capacity.barbers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado de capacidade disponivel para o periodo selecionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BARBEIRO</TableHead>
                  <TableHead>MIN. DISPONIVEIS</TableHead>
                  <TableHead>MIN. OCUPADOS</TableHead>
                  <TableHead>UTILIZACAO</TableHead>
                  <TableHead>RECEITA PERDIDA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacity.barbers.map((barber) => (
                  <TableRow key={barber.barberId}>
                    <TableCell className="font-semibold">
                      {barber.barberName}
                    </TableCell>
                    <TableCell>{barber.totalAvailableMinutes}min</TableCell>
                    <TableCell>{barber.totalBookedMinutes}min</TableCell>
                    <TableCell>
                      <span
                        className={
                          barber.utilizationRate >= 0.7
                            ? "text-chart-2 font-bold"
                            : barber.utilizationRate >= 0.4
                              ? "text-chart-4 font-bold"
                              : "text-destructive font-bold"
                        }
                      >
                        {(barber.utilizationRate * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-destructive">
                      {formatCurrency(barber.lostRevenue)}
                    </TableCell>
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
