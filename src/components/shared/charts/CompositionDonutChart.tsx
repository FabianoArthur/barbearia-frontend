import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueComposition } from "@/features/manager/finance/types";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

interface CompositionDonutChartProps {
  data: RevenueComposition | undefined;
  title?: string;
  isLoading?: boolean;
  height?: number;
}

export function CompositionDonutChart({
  data,
  title = "Composicao de Receita",
  isLoading,
  height = 300,
}: CompositionDonutChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Receita de Agendamentos", value: data.bookingRevenue },
      { name: "Gorjetas", value: data.tipsRevenue },
      { name: "Taxas Plataforma", value: data.platformFees },
      { name: "Reembolsos", value: data.refunds },
    ].filter((d) => d.value > 0);
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );

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

  if (chartData.length === 0) {
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
              Nenhum dado disponivel.
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent, x, y, textAnchor }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill="white"
                  fontSize={12}
                >
                  {`${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                </text>
              )}
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(rawValue, rawName) => {
                const value = Number(rawValue);
                const name = String(rawName);
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return [`${formatCurrency(value)} (${pct}%)`, name];
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
                color: "white",
              }}
              itemStyle={{ color: "white" }}
              labelStyle={{ color: "white" }}
            />
            <Legend wrapperStyle={{ fontSize: "13px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
