import { useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useServicePerformance } from "../hooks";
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
import type { Period, ServicePerformanceQueryParams } from "../types";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Ultima Semana" },
  { value: "month", label: "Ultimo Mes" },
  { value: "quarter", label: "Ultimo Trimestre" },
  { value: "year", label: "Ultimo Ano" },
  { value: "all", label: "Todo Periodo" },
];

export default function ServicePerformancePage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const { period, setPeriod, startDate, endDate, granularity } = useDateRange();

  const queryParams = useMemo<ServicePerformanceQueryParams>(
    () => ({
      startDate,
      endDate,
      // The shared date-range context can yield "hour"; this endpoint's type omits it.
      granularity: granularity as ServicePerformanceQueryParams["granularity"],
    }),
    [startDate, endDate, granularity],
  );

  const { performance, isLoading } = useServicePerformance(
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

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">
            Desempenho dos Servicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !performance || performance.services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado de servicos disponivel para o periodo selecionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">#</TableHead>
                  <TableHead>SERVICO</TableHead>
                  <TableHead>RECEITA BRUTA</TableHead>
                  <TableHead>RECEITA LIQ.</TableHead>
                  <TableHead>AGENDAMENTOS</TableHead>
                  <TableHead>PRECO MEDIO</TableHead>
                  <TableHead>DURACAO</TableHead>
                  <TableHead>R$/MIN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.services.map((svc) => (
                  <TableRow key={svc.serviceId}>
                    <TableCell>
                      {svc.rank <= 3 ? (
                        <Badge
                          variant={svc.rank === 1 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          #{svc.rank}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          #{svc.rank}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {svc.serviceName}
                    </TableCell>
                    <TableCell className="text-primary font-bold">
                      {formatCurrency(svc.grossRevenue)}
                    </TableCell>
                    <TableCell>{formatCurrency(svc.netRevenue)}</TableCell>
                    <TableCell>{svc.bookingCount}</TableCell>
                    <TableCell>{formatCurrency(svc.averagePrice)}</TableCell>
                    <TableCell>{svc.durationMinutes}min</TableCell>
                    <TableCell>
                      {formatCurrency(svc.revenuePerMinute)}
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
