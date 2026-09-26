import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";

/**
 * Generic time-series data point.
 * The x-axis key is `period` (matching backend response shape).
 */
export interface ChartTimeSeriesPoint {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  bookingCount?: number;
  totalTips?: number;
  totalPlatformFees?: number;
}

const CHART_COLORS = {
  grossRevenue: "hsl(var(--chart-1))",
  netRevenue: "hsl(var(--chart-2))",
  bookingCount: "hsl(var(--chart-3))",
  totalTips: "hsl(var(--chart-4))",
  totalPlatformFees: "hsl(var(--chart-5))",
} as const;

type MetricKey = keyof typeof CHART_COLORS;

interface TimeSeriesChartProps {
  data: ChartTimeSeriesPoint[];
  comparisonData?: ChartTimeSeriesPoint[];
  title?: string;
  metrics?: MetricKey[];
  isLoading?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
}

const METRIC_LABELS: Record<MetricKey, string> = {
  grossRevenue: "Receita Bruta",
  netRevenue: "Receita Liquida",
  bookingCount: "Agendamentos",
  totalTips: "Gorjetas",
  totalPlatformFees: "Taxas",
};

export function TimeSeriesChart({
  data,
  comparisonData,
  title = "Evolucao",
  metrics = ["grossRevenue", "netRevenue"],
  isLoading,
  height = 350,
  formatValue = formatCurrency,
}: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (!comparisonData) return data;
    return data.map((point, i) => ({
      ...point,
      ...(comparisonData[i]
        ? Object.fromEntries(
            metrics.map((m) => [
              `prev_${m}`,
              comparisonData[i]?.[m as keyof ChartTimeSeriesPoint] ?? 0,
            ]),
          )
        : {}),
    }));
  }, [data, comparisonData, metrics]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center"
            style={{ height: 200 }}
          >
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponivel para o periodo selecionado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={formatDate}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: number) =>
                metrics.includes("bookingCount") &&
                !metrics.includes("grossRevenue")
                  ? String(v)
                  : `R$${v}`
              }
            />
            <Tooltip
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(rawValue, rawName) => {
                const value = Number(rawValue);
                const name = String(rawName);
                const cleanName = name.startsWith("prev_")
                  ? `${METRIC_LABELS[name.replace("prev_", "") as MetricKey]} (anterior)`
                  : (METRIC_LABELS[name as MetricKey] ?? name);

                const formatted =
                  name === "bookingCount" || name === "prev_bookingCount"
                    ? String(value)
                    : formatValue(value);

                return [formatted, cleanName];
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend wrapperStyle={{ fontSize: "13px" }} />
            {metrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={METRIC_LABELS[metric]}
                stroke={CHART_COLORS[metric]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {comparisonData &&
              metrics.map((metric) => (
                <Line
                  key={`prev_${metric}`}
                  type="monotone"
                  dataKey={`prev_${metric}`}
                  name={`${METRIC_LABELS[metric]} (anterior)`}
                  stroke={CHART_COLORS[metric]}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
