import { useState, useMemo } from "react";
import { useAuth } from "@/features/auth/context";
import { useForecast } from "../hooks";
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
import { formatDate } from "@/lib/date-utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import type { ForecastQueryParams } from "../types";

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

type ForecastGranularity = "day" | "week" | "month";

const GRANULARITY_OPTIONS: { value: ForecastGranularity; label: string }[] = [
  { value: "day", label: "Diario" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
];

const TREND_ICONS = {
  growing: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
} as const;

const TREND_LABELS = {
  growing: "Em crescimento",
  declining: "Em queda",
  stable: "Estavel",
} as const;

const CONFIDENCE_VARIANT: Record<string, "default" | "secondary" | "outline"> =
  {
    high: "default",
    medium: "secondary",
    low: "outline",
  };

export default function ForecastPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId =
    selectedEstablishmentId ?? user?.establishmentId ?? null;

  const [granularity, setGranularity] = useState<ForecastGranularity>("month");
  const [periodsAhead, setPeriodsAhead] = useState(3);

  const queryParams = useMemo<ForecastQueryParams>(
    () => ({ granularity, periodsAhead }),
    [granularity, periodsAhead],
  );

  const { forecast, isLoading } = useForecast(establishmentId, queryParams);

  const TrendIcon = forecast?.trend
    ? (TREND_ICONS[forecast.trend as keyof typeof TREND_ICONS] ?? Minus)
    : Minus;
  const trendLabel = forecast?.trend
    ? (TREND_LABELS[forecast.trend as keyof typeof TREND_LABELS] ?? "—")
    : "—";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={granularity}
          onValueChange={(v) => setGranularity(v as ForecastGranularity)}
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

        <Select
          value={String(periodsAhead)}
          onValueChange={(v) => setPeriodsAhead(Number(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Periodos" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 6, 12].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} periodo{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : forecast ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <TrendIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tendencia</p>
                  <p className="text-lg font-bold text-foreground">
                    {trendLabel}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Media Movel</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(forecast.movingAverage)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Anomalias</p>
                <p className="text-2xl font-bold text-chart-4">
                  {forecast.anomalies.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary text-base">
                Previsao de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forecast.forecast.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Dados insuficientes para previsao.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PERIODO</TableHead>
                      <TableHead>RECEITA PREVISTA</TableHead>
                      <TableHead>CONFIANCA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.forecast.map((point) => (
                      <TableRow key={point.period}>
                        <TableCell className="font-medium">
                          {formatDate(point.period)}
                        </TableCell>
                        <TableCell className="text-primary font-bold">
                          {formatCurrency(point.predictedRevenue)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              CONFIDENCE_VARIANT[
                                point.confidence as unknown as string
                              ] ?? "outline"
                            }
                          >
                            {CONFIDENCE_LABELS[String(point.confidence)] ??
                              String(point.confidence)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Anomalies */}
          {forecast.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-chart-4" />
                  Anomalias Detectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PERIODO</TableHead>
                      <TableHead>RECEITA REAL</TableHead>
                      <TableHead>RECEITA ESPERADA</TableHead>
                      <TableHead>DESVIO</TableHead>
                      <TableHead>TIPO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.anomalies.map((anomaly) => (
                      <TableRow key={anomaly.period}>
                        <TableCell className="font-medium">
                          {formatDate(anomaly.period)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(anomaly.actualRevenue)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(anomaly.expectedRevenue)}
                        </TableCell>
                        <TableCell
                          className={
                            anomaly.deviation > 0
                              ? "text-chart-2"
                              : "text-destructive"
                          }
                        >
                          {anomaly.deviation > 0 ? "+" : ""}
                          {(anomaly.deviation * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              String(anomaly.type) === "spike"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {String(anomaly.type) === "spike"
                              ? "Pico"
                              : "Queda"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Patterns */}
          {forecast.seasonalPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary text-base">
                  Padroes Sazonais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PERIODO</TableHead>
                      <TableHead>RECEITA MEDIA</TableHead>
                      <TableHead>FORCA RELATIVA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.seasonalPatterns.map((pattern) => (
                      <TableRow key={pattern.period}>
                        <TableCell className="font-medium">
                          {formatDate(pattern.period)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(pattern.averageRevenue)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              pattern.relativeStrength >= 1
                                ? "text-chart-2 font-bold"
                                : "text-muted-foreground"
                            }
                          >
                            {pattern.relativeStrength.toFixed(2)}x
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum dado disponivel para previsao.
        </p>
      )}
    </div>
  );
}
