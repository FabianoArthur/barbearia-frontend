import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useAppointments, useAppointmentMutations } from "./hooks";
import { useBarbers } from "@/features/manager/barbers/hooks";
import {
  usePaymentByAppointment,
  usePaymentMutations,
} from "@/features/manager/payments/hooks";
import { PaymentConfirmDialog } from "@/features/manager/payments/components/PaymentConfirmDialog";
import type {
  AppointmentQueryParams,
  AppointmentStatusFilter,
} from "./services";
import type { ConfirmPaymentDto } from "@/features/manager/payments/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseDate, formatDateString } from "@/lib/date-utils";
import { STATUS_FILTER_OPTIONS } from "@/lib/appointment-utils";
import { KpiCard } from "@/components/blocks/KpiCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentsTable } from "./components/AppointmentsTable";
import { UnconfirmedWarningBanner } from "@/components/shared/UnconfirmedWarningBanner";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Filter,
} from "lucide-react";
import type { AppointmentStatus } from "@/types";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

type SortByValue = NonNullable<AppointmentQueryParams["sortBy"]>;
type SortOrderValue = NonNullable<AppointmentQueryParams["sortOrder"]>;

interface FilterState {
  barberId: string;
  startDate: string;
  endDate: string;
  statusFilters: AppointmentStatusFilter[];
}

const sortByOptions: { value: SortByValue; label: string }[] = [
  { value: "startsAt", label: "Data/Hora" },
  { value: "createdAt", label: "Data de Criacao" },
  { value: "status", label: "Status" },
  { value: "priceSnapshot", label: "Valor" },
];

const statusMessages: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Agendamento confirmado com sucesso!",
  IN_PROGRESS: "Atendimento iniciado!",
  DONE: "Atendimento concluido!",
  NO_SHOW: "Cliente marcado como nao compareceu.",
  CANCELED: "Agendamento cancelado com sucesso. O cliente sera notificado.",
};

const PAGE_SIZE = 20;

/** today 00:00 -> next Sunday 23:59 */
function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);

  const fmt = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD
  return { start: fmt(today), end: fmt(sunday) };
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  // null (All) → undefined so the query param is omitted and the API returns all
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;

  const { barbers } = useBarbers(establishmentId);

  const defaults = useMemo(() => getDefaultDateRange(), []);

  // Draft filter state (edited by the user before clicking "Buscar")
  const [draft, setDraft] = useState<FilterState>({
    barberId: "ALL",
    startDate: defaults.start,
    endDate: defaults.end,
    statusFilters: [],
  });

  // Committed filter state (sent to the API)
  const [committed, setCommitted] = useState<FilterState>({
    barberId: "ALL",
    startDate: defaults.start,
    endDate: defaults.end,
    statusFilters: [],
  });

  // Sort + pagination apply immediately (no search button needed)
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortByValue>("startsAt");
  const [sortOrder, setSortOrder] = useState<SortOrderValue>("asc");

  const queryParams = useMemo<AppointmentQueryParams>(
    () => ({
      establishmentId,
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(committed.startDate && {
        startDate: new Date(`${committed.startDate}T00:00:00`).toISOString(),
      }),
      ...(committed.endDate && {
        endDate: new Date(`${committed.endDate}T23:59:59.999`).toISOString(),
      }),
      ...(committed.barberId !== "ALL" && { barberId: committed.barberId }),
      ...(committed.statusFilters.length > 0 && {
        status: committed.statusFilters,
      }),
    }),
    [establishmentId, page, sortBy, sortOrder, committed],
  );

  const { appointments, meta, totalRevenue, isLoading } =
    useAppointments(queryParams);
  const { changeStatus, deleteAppointment, sendConfirmation, sendReminder } =
    useAppointmentMutations(establishmentId);

  // Payment confirm dialog state (triggered after finishing an appointment)
  const [paymentDialog, setPaymentDialog] = useState<{
    appointmentId: string;
    serviceValue: number;
  } | null>(null);
  const { payment: pendingPayment } = usePaymentByAppointment(
    paymentDialog?.appointmentId,
  );
  const { confirmPayment } = usePaymentMutations();

  const handleSearch = useCallback(() => {
    setCommitted({ ...draft });
    setPage(1);
  }, [draft]);

  const handleResetFilters = useCallback(() => {
    const reset: FilterState = {
      barberId: "ALL",
      startDate: defaults.start,
      endDate: defaults.end,
      statusFilters: [],
    };
    setDraft(reset);
    setCommitted(reset);
    setPage(1);
  }, [defaults]);

  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value as SortByValue);
    setPage(1);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }, []);

  const handleStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      try {
        await changeStatus(id, status);
        toast.success(statusMessages[status] ?? "Status atualizado!");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [changeStatus],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteAppointment(id);
        toast.success("Agendamento excluido.");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [deleteAppointment],
  );

  const handleSendNotification = useCallback(
    async (id: string, type: "confirmation" | "reminder") => {
      try {
        if (type === "confirmation") {
          await sendConfirmation(id);
          toast.success("Confirmacao enviada via WhatsApp!");
        } else {
          await sendReminder(id);
          toast.success("Lembrete enviado via WhatsApp!");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [sendConfirmation, sendReminder],
  );

  const handleFinishPayment = useCallback(
    (appointmentId: string, serviceValue: number) => {
      setPaymentDialog({ appointmentId, serviceValue });
    },
    [],
  );

  const handleConfirmPayment = useCallback(
    async (paymentId: string, dto: ConfirmPaymentDto) => {
      try {
        await confirmPayment(paymentId, dto);
        toast.success("Pagamento confirmado!");
        setPaymentDialog(null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [confirmPayment],
  );

  const toggleStatusFilter = useCallback((value: AppointmentStatusFilter) => {
    setDraft((prev) => {
      const has = prev.statusFilters.includes(value);
      return {
        ...prev,
        statusFilters: has
          ? prev.statusFilters.filter((s) => s !== value)
          : [...prev.statusFilters, value],
      };
    });
  }, []);

  const toggleAllStatuses = useCallback(() => {
    setDraft((prev) => {
      const allSelected =
        prev.statusFilters.length === STATUS_FILTER_OPTIONS.length;
      return {
        ...prev,
        statusFilters: allSelected
          ? []
          : STATUS_FILTER_OPTIONS.map((o) => o.value),
      };
    });
  }, []);

  const isFiltersCustom =
    committed.barberId !== "ALL" ||
    committed.startDate !== defaults.start ||
    committed.endDate !== defaults.end ||
    committed.statusFilters.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Agendamentos</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            title="Total de Agendamentos"
            value={meta.totalItems}
            icon={CalendarDays}
            variant="primary"
          />
          <KpiCard
            title="Valor Total em Caixa"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            variant="success"
          />
        </div>
      )}

      {!isLoading && <UnconfirmedWarningBanner appointments={appointments} />}

      <Card>
        <CardHeader className="space-y-4">
          {/* Row 1: Title + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-primary text-base">
              Agendamentos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortByOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
                aria-label={`Ordem ${sortOrder === "asc" ? "crescente" : "decrescente"}`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Filters + Search button */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Barbeiro</Label>
              <Select
                value={draft.barberId}
                onValueChange={(v) =>
                  setDraft((prev) => ({ ...prev, barberId: v }))
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Barbeiros</SelectItem>
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.user?.name ?? b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Periodo</Label>
              <DateRangePicker
                from={parseDate(draft.startDate)}
                to={parseDate(draft.endDate)}
                onRangeChange={(from, to) =>
                  setDraft((prev) => ({
                    ...prev,
                    startDate: formatDateString(from),
                    endDate: formatDateString(to),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48 justify-start">
                    <Filter className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">
                      {draft.statusFilters.length === 0
                        ? "Todos"
                        : draft.statusFilters.length ===
                            STATUS_FILTER_OPTIONS.length
                          ? "Todos"
                          : `${draft.statusFilters.length} selecionado${draft.statusFilters.length > 1 ? "s" : ""}`}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={
                          draft.statusFilters.length ===
                          STATUS_FILTER_OPTIONS.length
                        }
                        onCheckedChange={toggleAllStatuses}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        Selecionar todos
                      </label>
                    </div>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={draft.statusFilters.includes(option.value)}
                          onCheckedChange={() =>
                            toggleStatusFilter(option.value)
                          }
                        />
                        <label className="text-sm cursor-pointer">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>

            {isFiltersCustom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <>
              <AppointmentsTable
                appointments={appointments}
                onStatusChange={handleStatus}
                onDelete={handleDelete}
                onSendNotification={handleSendNotification}
                onFinishPayment={handleFinishPayment}
              />

              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {meta.currentPage} de {meta.totalPages} (
                    {meta.totalItems} agendamentos)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.currentPage >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Proximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment confirm dialog — triggered after finishing an appointment */}
      <PaymentConfirmDialog
        open={!!paymentDialog}
        onOpenChange={(open) => {
          if (!open) setPaymentDialog(null);
        }}
        paymentId={pendingPayment?.id ?? null}
        amount={paymentDialog?.serviceValue ?? 0}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
