import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiComparison {
  previousValue: number;
  growthPercent: number;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
  variant?: "default" | "primary" | "success" | "warning";
  comparison?: KpiComparison;
  subtitle?: string;
}

const variantStyles = {
  default: "border-border",
  primary: "border-l-4 border-l-primary",
  success: "border-l-4 border-l-chart-2",
  warning: "border-l-4 border-l-chart-4",
};

function GrowthIndicator({ growthPercent }: { growthPercent: number }) {
  if (growthPercent === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isPositive = growthPercent > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isPositive ? "text-chart-2" : "text-destructive",
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {growthPercent.toFixed(1)}%
    </span>
  );
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  className,
  variant = "default",
  comparison,
  subtitle,
}: KpiCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="flex items-center gap-4 p-5">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {comparison && (
              <GrowthIndicator growthPercent={comparison.growthPercent} />
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
