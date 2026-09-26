import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useBarberPerformance } from "../hooks";
import { useDateRange } from "../context/DateRangeContext";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils";
import { Crown, Medal, Award } from "lucide-react";
import type { Period, BarberPerformanceQueryParams } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

const RANK_ICONS = [Crown, Medal, Award];
const RANK_COLORS = ["text-chart-4", "text-muted-foreground", "text-chart-3"];

export default function BarberPerformancePage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, toBarberParams } = useDateRange();
  const [selectedBarberId, setSelectedBarberId] = useState<string>("ALL");

  const queryParams = useMemo<BarberPerformanceQueryParams>(() => {
    const base = toBarberParams();
    if (selectedBarberId !== "ALL") {
      return { ...base, barberId: selectedBarberId };
    }
    return base;
  }, [toBarberParams, selectedBarberId]);

  const { performance, isLoading } = useBarberPerformance(
    establishmentId,
    queryParams,
  );

  const barberOptions = useMemo(
    () =>
      performance?.barbers.map((b) => ({
        id: b.barberId,
        name: b.barberName,
      })) ?? [],
    [performance],
  );

  // Sort by rank to get top 3 for highlights
  const top3 = useMemo(() => {
    if (!performance?.barbers) return [];
    return [...performance.barbers].sort((a, b) => a.rank - b.rank).slice(0, 3);
  }, [performance]);

  const handleBarberChange = useCallback((value: string) => {
    setSelectedBarberId(value);
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

        <Select value={selectedBarberId} onValueChange={handleBarberChange}>
          <SelectTrigger className="w-52">
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
      </div>

      {/* Ranking Highlights */}
      {!isLoading && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((barber, idx) => {
            const Icon = RANK_ICONS[idx] ?? Award;
            const color = RANK_COLORS[idx] ?? "text-muted-foreground";
            return (
              <Card
                key={barber.barberId}
                className="border-l-4 border-l-chart-1"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <Icon className={`h-8 w-8 ${color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      #{barber.rank} Lugar
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {barber.barberName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(barber.grossRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">
            Desempenho dos Barbeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !performance || performance.barbers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado de desempenho disponivel para o periodo selecionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">#</TableHead>
                  <TableHead>BARBEIRO</TableHead>
                  <TableHead>RECEITA BRUTA</TableHead>
                  <TableHead>RECEITA LIQ.</TableHead>
                  <TableHead>AGENDAMENTOS</TableHead>
                  <TableHead>TICKET MEDIO</TableHead>
                  <TableHead>GORJETAS</TableHead>
                  <TableHead>GORJ./RECEITA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.barbers.map((barber) => (
                  <TableRow key={barber.barberId}>
                    <TableCell>
                      {barber.rank <= 3 ? (
                        <Badge
                          variant={barber.rank === 1 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          #{barber.rank}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          #{barber.rank}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {barber.barberName}
                    </TableCell>
                    <TableCell className="text-primary font-bold">
                      {formatCurrency(barber.grossRevenue)}
                    </TableCell>
                    <TableCell>{formatCurrency(barber.netRevenue)}</TableCell>
                    <TableCell>{barber.bookingCount}</TableCell>
                    <TableCell>
                      {formatCurrency(barber.averageOrderValue)}
                    </TableCell>
                    <TableCell>{formatCurrency(barber.totalTips)}</TableCell>
                    <TableCell>
                      {(barber.tipsToRevenueRatio * 100).toFixed(1)}%
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
