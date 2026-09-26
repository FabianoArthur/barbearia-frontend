import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "../types";

const statusVariant: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  COMPLETED: "default",
  REFUNDED: "secondary",
  FAILED: "destructive",
};

const statusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  COMPLETED: "Confirmado",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
}
