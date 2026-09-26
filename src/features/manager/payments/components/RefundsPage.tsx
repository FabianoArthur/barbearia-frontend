import { useState, useMemo, useCallback } from "react";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useAuth } from "@/features/auth/context";
import { usePayments } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Undo2,
} from "lucide-react";
import type { Payment, PaymentQueryParams } from "../types";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CREDIT_CARD: "Cartao de Credito",
  DEBIT_CARD: "Cartao de Debito",
};

interface FilterState {
  startDate: string;
  endDate: string;
}

export default function RefundsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
  });

  const [committed, setCommitted] = useState<FilterState>({
    startDate: "",
    endDate: "",
  });

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const queryParams = useMemo<PaymentQueryParams>(() => {
    const params: PaymentQueryParams = {
      page,
      limit: PAGE_SIZE,
      status: ["REFUNDED"],
    };
    if (establishmentId) params.establishmentId = establishmentId;
    if (committed.startDate) params.startDate = committed.startDate;
    if (committed.endDate) params.endDate = committed.endDate;
    return params;
  }, [establishmentId, committed, page]);

  const { payments, meta, isLoading } = usePayments(queryParams);

  const handleSearch = useCallback(() => {
    setPage(1);
    setCommitted({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    const reset: FilterState = { startDate: "", endDate: "" };
    setFilters(reset);
    setCommitted(reset);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Reembolsos</h1>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-primary text-base">
            Historico de Reembolsos
          </CardTitle>

          <div className="flex flex-wrap items-end gap-3">
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
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Undo2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Nenhum reembolso encontrado.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATA</TableHead>
                    <TableHead>VALOR ORIGINAL</TableHead>
                    <TableHead>GORJETA</TableHead>
                    <TableHead>METODO</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>OBSERVACOES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <TableCell className="font-medium">
                        {new Date(payment.updatedAt).toLocaleDateString(
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
                        {payment.method
                          ? (METHOD_LABELS[payment.method] ?? payment.method)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {payment.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {meta.currentPage} de {meta.totalPages} (
                    {meta.totalItems} reembolsos)
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

      {/* Refund Details Dialog */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        {selectedPayment && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Reembolso</DialogTitle>
              <DialogDescription>
                Informacoes completas sobre o reembolso.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Valor Original
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gorjeta</p>
                  <p className="text-lg font-bold text-foreground">
                    {selectedPayment.tipAmount > 0
                      ? formatCurrency(selectedPayment.tipAmount)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(
                      selectedPayment.amount + selectedPayment.tipAmount,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Metodo de Pagamento
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {selectedPayment.method
                      ? (METHOD_LABELS[selectedPayment.method] ??
                        selectedPayment.method)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <PaymentStatusBadge status={selectedPayment.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Data do Reembolso
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedPayment.updatedAt).toLocaleString(
                      "pt-BR",
                    )}
                  </p>
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Observacoes
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Data de Criacao
                </p>
                <p className="text-sm text-foreground">
                  {new Date(selectedPayment.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
