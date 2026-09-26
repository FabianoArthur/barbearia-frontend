import { useState, useMemo, useCallback } from "react";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useAuth } from "@/features/auth/context";
import { usePayments, usePaymentMutations } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentConfirmDialog } from "./PaymentConfirmDialog";
import { PaymentRefundDialog } from "./PaymentRefundDialog";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  RotateCcw,
  CreditCard,
  Undo2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type {
  PaymentStatus,
  PaymentMethod,
  PaymentQueryParams,
  ConfirmPaymentDto,
  RefundPaymentDto,
} from "../types";

const STATUS_OPTIONS: { value: PaymentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendente" },
  { value: "COMPLETED", label: "Confirmado" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "FAILED", label: "Falhou" },
];

const METHOD_OPTIONS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PIX", label: "PIX" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartao de Credito" },
  { value: "DEBIT_CARD", label: "Cartao de Debito" },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CREDIT_CARD: "Cartao de Credito",
  DEBIT_CARD: "Cartao de Debito",
};

interface FilterState {
  status: PaymentStatus | "ALL";
  method: PaymentMethod | "ALL";
  startDate: string;
  endDate: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [filters, setFilters] = useState<FilterState>({
    status: "ALL",
    method: "ALL",
    startDate: "",
    endDate: "",
  });

  const [committed, setCommitted] = useState<FilterState>({
    status: "ALL",
    method: "ALL",
    startDate: "",
    endDate: "",
  });

  const queryParams = useMemo<PaymentQueryParams>(() => {
    const params: PaymentQueryParams = {
      page,
      limit: PAGE_SIZE,
    };
    if (establishmentId) params.establishmentId = establishmentId;
    if (committed.status !== "ALL") params.status = [committed.status];
    if (committed.method !== "ALL") params.method = [committed.method];
    if (committed.startDate) params.startDate = committed.startDate;
    if (committed.endDate) params.endDate = committed.endDate;
    return params;
  }, [establishmentId, committed, page]);

  const { payments, meta, isLoading } = usePayments(queryParams);
  const { confirmPayment, refundPayment } = usePaymentMutations();

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    paymentId: string;
    amount: number;
  } | null>(null);

  // Refund dialog state
  const [refundDialog, setRefundDialog] = useState<{
    paymentId: string;
    maxAmount: number;
  } | null>(null);

  const handleSearch = useCallback(() => {
    setPage(1);
    setCommitted({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    const reset: FilterState = {
      status: "ALL",
      method: "ALL",
      startDate: "",
      endDate: "",
    };
    setFilters(reset);
    setCommitted(reset);
    setPage(1);
  }, []);

  const handleConfirm = useCallback(
    async (paymentId: string, dto: ConfirmPaymentDto) => {
      try {
        await confirmPayment(paymentId, dto);
        toast.success("Pagamento confirmado!");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [confirmPayment],
  );

  const handleRefund = useCallback(
    async (paymentId: string, dto: RefundPaymentDto) => {
      try {
        await refundPayment(paymentId, dto);
        toast.success("Reembolso realizado!");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [refundPayment],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Pagamentos</h1>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-primary text-base">
            Historico de Pagamentos
          </CardTitle>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: v as PaymentStatus | "ALL",
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Metodo</Label>
              <Select
                value={filters.method}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    method: v as PaymentMethod | "ALL",
                  }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Periodo</Label>
              <DateRangePicker
                from={parseDate(filters.startDate)}
                to={parseDate(filters.endDate)}
                onRangeChange={(from, to) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: formatDateString(from),
                    endDate: formatDateString(to),
                  }))
                }
              />
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pagamento encontrado.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATA</TableHead>
                    <TableHead>VALOR</TableHead>
                    <TableHead>GORJETA</TableHead>
                    <TableHead>METODO</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>OBSERVACOES</TableHead>
                    <TableHead className="text-right">ACOES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        {payment.tipAmount > 0
                          ? formatCurrency(payment.tipAmount)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {payment.method ? METHOD_LABELS[payment.method] : "—"}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {payment.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {payment.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-chart-2 border-chart-2 hover:bg-chart-2/10"
                              onClick={() =>
                                setConfirmDialog({
                                  paymentId: payment.id,
                                  amount: payment.amount,
                                })
                              }
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          {payment.status === "COMPLETED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setRefundDialog({
                                  paymentId: payment.id,
                                  maxAmount: payment.amount + payment.tipAmount,
                                })
                              }
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              Reembolsar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {meta.currentPage} de {meta.totalPages} (
                    {meta.totalItems} pagamentos)
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

      <PaymentConfirmDialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
        paymentId={confirmDialog?.paymentId ?? null}
        amount={confirmDialog?.amount ?? 0}
        onConfirm={handleConfirm}
      />

      <PaymentRefundDialog
        open={!!refundDialog}
        onOpenChange={(open) => {
          if (!open) setRefundDialog(null);
        }}
        paymentId={refundDialog?.paymentId ?? null}
        maxAmount={refundDialog?.maxAmount ?? 0}
        onRefund={handleRefund}
      />
    </div>
  );
}
