import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  CalendarDays,
  Store,
  Sparkles,
  Users,
  CreditCard,
  DollarSign,
  Undo2,
  UserCog,
} from "lucide-react";

const ALL_ESTABLISHMENTS_VALUE = "__all__";

const navItems = [
  { to: "/manager", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "appointments", label: "Agendamentos", icon: CalendarDays },
  { to: "payments", label: "Pagamentos", icon: CreditCard },
  { to: "refunds", label: "Reembolsos", icon: Undo2 },
  { to: "establishments", label: "Estabelecimentos", icon: Store },
  { to: "services", label: "Servicos", icon: Sparkles },
  { to: "clients", label: "Clientes", icon: Users },
  { to: "users", label: "Usuarios", icon: UserCog },
  { to: "finance", label: "Financeiro", icon: DollarSign },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar min-h-[calc(100vh-57px)]">
      {/* Establishment Selector (SUPER_ADMIN only) */}
      <EstablishmentSelector />

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item && item.end === true}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function EstablishmentSelector() {
  const {
    canSwitch,
    establishments,
    selectedEstablishmentId,
    setSelectedEstablishmentId,
  } = useEstablishmentStore();

  if (!canSwitch || establishments.length === 0) return null;

  const displayValue = selectedEstablishmentId ?? ALL_ESTABLISHMENTS_VALUE;

  function handleChange(value: string) {
    setSelectedEstablishmentId(
      value === ALL_ESTABLISHMENTS_VALUE ? null : value,
    );
  }

  return (
    <div className="p-3 border-b border-border">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
        Estabelecimento
      </p>
      <Select value={displayValue} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ESTABLISHMENTS_VALUE}>
            Todos os Estabelecimentos
          </SelectItem>
          {establishments.map((est) => (
            <SelectItem key={est.id} value={est.id}>
              {est.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
