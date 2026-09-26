import { Outlet, NavLink, useLocation } from "react-router-dom";
import { DateRangeProvider } from "../context/DateRangeContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Scissors,
  UserCheck,
  Activity,
  LineChart,
  PieChart,
  Brain,
  Receipt,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  {
    to: "/manager/finance",
    label: "Visao Geral",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/manager/finance/revenue",
    label: "Receita",
    icon: TrendingUp,
  },
  {
    to: "/manager/finance/barbers",
    label: "Barbeiros",
    icon: Users,
  },
  {
    to: "/manager/finance/services",
    label: "Servicos",
    icon: Scissors,
  },
  {
    to: "/manager/finance/customers",
    label: "Clientes",
    icon: UserCheck,
  },
  {
    to: "/manager/finance/capacity",
    label: "Capacidade",
    icon: Activity,
  },
  {
    to: "/manager/finance/trends",
    label: "Tendencias",
    icon: LineChart,
  },
  {
    to: "/manager/finance/breakdown",
    label: "Detalhamento",
    icon: PieChart,
  },
  {
    to: "/manager/finance/forecast",
    label: "Previsao",
    icon: Brain,
  },
  {
    to: "/manager/finance/expenses",
    label: "Despesas",
    icon: Receipt,
  },
  {
    to: "/manager/finance/fees",
    label: "Taxas",
    icon: Settings,
  },
];

export function FinanceLayout() {
  const { pathname } = useLocation();

  return (
    <DateRangeProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-primary">Financeiro</h1>
        </div>

        {/* Sub-navigation tabs */}
        <nav className="flex gap-1 overflow-x-auto border-b pb-px">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-background border border-b-background text-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Page content */}
        <ErrorBoundary
          key={pathname}
          fallbackTitle="Erro ao carregar dados financeiros"
          fallbackMessage="Ocorreu um erro ao carregar os dados. Tente novamente."
        >
          <Outlet />
        </ErrorBoundary>
      </div>
    </DateRangeProvider>
  );
}
