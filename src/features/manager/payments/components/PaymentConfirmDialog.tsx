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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod, ConfirmPaymentDto } from "../types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "PIX", label: "PIX" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartao de Credito" },
  { value: "DEBIT_CARD", label: "Cartao de Debito" },
];

interface PaymentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  amount: number;
  onConfirm: (paymentId: string, dto: ConfirmPaymentDto) => Promise<void>;
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  paymentId,
  amount,
  onConfirm,
}: PaymentConfirmDialogProps) {
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [tipAmount, setTipAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setMethod("");
    setTipAmount("");
    setNotes("");
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!paymentId || !method) return;
    setIsLoading(true);
    try {
      const dto: ConfirmPaymentDto = { method };
      const tip = parseFloat(tipAmount);
      if (!isNaN(tip) && tip > 0) {
        dto.tipAmount = tip;
      }
      if (notes.trim()) {
        dto.notes = notes.trim();
      }
      await onConfirm(paymentId, dto);
      resetForm();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, method, tipAmount, notes, onConfirm, resetForm, onOpenChange]);

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
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            Valor do servico: {formatCurrency(amount)}. Selecione o metodo de
            pagamento e adicione gorjeta se houver.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Metodo de Pagamento *</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Selecione o metodo" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-amount">Gorjeta (R$)</Label>
            <Input
              id="tip-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Observacoes</Label>
            <Input
              id="payment-notes"
              placeholder="Observacoes sobre o pagamento"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
          <Button onClick={handleConfirm} disabled={isLoading || !method}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Pagamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
