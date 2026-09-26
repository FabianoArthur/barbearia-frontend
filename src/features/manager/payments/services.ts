import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type {
  Payment,
  PaymentQueryParams,
  ConfirmPaymentDto,
  RefundPaymentDto,
} from "./types";

// ─── Helpers ───────────────────────────────────────────────────────────

function buildSearchParams(params: PaymentQueryParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      v.forEach((item) => sp.append(k, String(item)));
    } else {
      sp.set(k, String(v));
    }
  }
  return sp;
}

// ─── Queries ───────────────────────────────────────────────────────────

export async function findAll(
  params?: PaymentQueryParams,
): Promise<PaginatedResponse<Payment>> {
  const res = await api.get<PaginatedResponse<Payment>>("/payments", {
    params: params ? buildSearchParams(params) : undefined,
  });
  return res.data;
}

export async function findByAppointment(
  appointmentId: string,
): Promise<Payment> {
  const res = await api.get<Payment>(`/payments/appointment/${appointmentId}`);
  return res.data;
}

export async function findById(id: string): Promise<Payment> {
  const res = await api.get<Payment>(`/payments/${id}`);
  return res.data;
}

// ─── Mutations ─────────────────────────────────────────────────────────

export async function confirm(
  id: string,
  dto: ConfirmPaymentDto,
): Promise<Payment> {
  const res = await api.patch<Payment>(`/payments/${id}/confirm`, dto);
  return res.data;
}

export async function refund(
  id: string,
  dto: RefundPaymentDto,
): Promise<Payment> {
  const res = await api.patch<Payment>(`/payments/${id}/refund`, dto);
  return res.data;
}
