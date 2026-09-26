// ─── Payment Status & Method Enums ─────────────────────────────────────

export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";
export type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD";

// ─── Payment Entity ────────────────────────────────────────────────────

export interface Payment {
  id: string;
  appointmentId: string;
  establishmentId: string;
  amount: number;
  tipAmount: number;
  method: PaymentMethod | null;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ──────────────────────────────────────────────────────────────

export interface ConfirmPaymentDto {
  method: PaymentMethod;
  tipAmount?: number;
  notes?: string;
}

export interface RefundPaymentDto {
  amount?: number;
  reason?: string;
}

// ─── Query Params ──────────────────────────────────────────────────────

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  establishmentId?: string;
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  startDate?: string;
  endDate?: string;
}
