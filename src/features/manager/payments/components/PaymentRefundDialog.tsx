import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { RefundPaymentDto } from "../types";

interface PaymentRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  maxAmount: number;
  onRefund: (paymentId: string, dto: RefundPaymentDto) => Promise<void>;
}

export function PaymentRefundDialog({
  open,
  onOpenChange,
  paymentId,
  maxAmount,
  onRefund,
}: PaymentRefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setAmount("");
    setReason("");
  }, []);

  const handleRefund = useCallback(async () => {
    if (!paymentId) return;
    setIsLoading(true);
    try {
      const dto: RefundPaymentDto = {};
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        dto.amount = parsedAmount;
      }
      if (reason.trim()) {
        dto.reason = reason.trim();
      }
      await onRefund(paymentId, dto);
      resetForm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, amount, reason, onRefund, resetForm, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reembolsar Pagamento</DialogTitle>
          <DialogDescription>
            Valor total: {formatCurrency(maxAmount)}. Deixe o valor em branco
            para reembolso total.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Valor do Reembolso (R$)</Label>
            <Input
              id="refund-amount"
              type="number"
              min="0.01"
              max={maxAmount}
              step="0.01"
              placeholder={`Ate ${formatCurrency(maxAmount)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Motivo</Label>
            <Input
              id="refund-reason"
              placeholder="Motivo do reembolso"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefund}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Reembolso"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
