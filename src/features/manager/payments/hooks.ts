import useSWR, { useSWRConfig } from "swr";
import type { PaginatedResponse, PaginationMeta } from "@/types";
import type {
  Payment,
  PaymentQueryParams,
  ConfirmPaymentDto,
  RefundPaymentDto,
} from "./types";
import * as paymentService from "./services";

// ─── Helpers ───────────────────────────────────────────────────────────

const SWR_OPTIONS = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  refreshInterval: 30 * 1000, // 30s — payments change frequently
} as const;

const EMPTY_META: PaginationMeta = {
  totalItems: 0,
  itemsPerPage: 20,
  currentPage: 1,
  totalPages: 0,
};

function buildCacheKey(base: string, params?: Record<string, unknown>): string {
  if (!params) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      sp.set(k, v.join(","));
    } else {
      sp.set(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

// ─── List Payments ────────────────────────────────────────────────────

export function usePayments(params?: PaymentQueryParams) {
  const key = buildCacheKey("/payments", params as Record<string, unknown>);

  const { data, error, isLoading } = useSWR<PaginatedResponse<Payment>>(
    key,
    () => paymentService.findAll(params),
    SWR_OPTIONS,
  );

  return {
    payments: data?.data ?? [],
    meta: data?.meta ?? EMPTY_META,
    isLoading,
    isError: !!error,
  };
}

// ─── Payment by Appointment ────────────────────────────────────────────

export function usePaymentByAppointment(
  appointmentId: string | undefined | null,
) {
  const key = appointmentId ? `/payments/appointment/${appointmentId}` : null;

  const { data, error, isLoading } = useSWR<Payment>(
    key,
    () => paymentService.findByAppointment(appointmentId!),
    SWR_OPTIONS,
  );

  return { payment: data, isLoading, isError: !!error };
}

// ─── Payment Mutations ─────────────────────────────────────────────────

export function usePaymentMutations() {
  const { mutate } = useSWRConfig();

  function revalidatePayments() {
    return mutate(
      (key: unknown) => typeof key === "string" && key.startsWith("/payments"),
      undefined,
      { revalidate: true },
    );
  }

  async function confirmPayment(id: string, dto: ConfirmPaymentDto) {
    const result = await paymentService.confirm(id, dto);
    await revalidatePayments();
    return result;
  }

  async function refundPayment(id: string, dto: RefundPaymentDto) {
    const result = await paymentService.refund(id, dto);
    await revalidatePayments();
    return result;
  }

  return { confirmPayment, refundPayment };
}
