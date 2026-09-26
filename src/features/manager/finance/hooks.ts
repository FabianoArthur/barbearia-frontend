import useSWR, { useSWRConfig } from "swr";
import type {
  DashboardQueryParams,
  DashboardOverviewResponse,
  RevenueQueryParams,
  RevenueAnalyticsResponse,
  BarberPerformanceQueryParams,
  BarberPerformanceResponse,
  TrendsQueryParams,
  TrendsResponse,
  ServicePerformanceQueryParams,
  ServicePerformanceResponse,
  CustomerQueryParams,
  CustomerAnalyticsResponse,
  CapacityQueryParams,
  CapacityUtilizationResponse,
  BreakdownQueryParams,
  FinancialBreakdownResponse,
  ForecastQueryParams,
  ForecastResponse,
  FeeConfig,
  CreateFeeConfigDto,
  UpdateFeeConfigDto,
} from "./types";
import type { BarberEarningsSummary } from "@/types";
import * as financeService from "./services";

// ─── Helpers ───────────────────────────────────────────────────────────

/** Default SWR options aligned with backend Redis TTLs. */
const ANALYTICS_SWR_OPTIONS = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  refreshInterval: 5 * 60 * 1000, // 5 min — matches typical Redis TTL
} as const;

function buildCacheKey(base: string, params?: Record<string, unknown>): string {
  if (!params) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

// ─── Dashboard Overview ────────────────────────────────────────────────
// GET /finance/dashboard?establishmentId=...&period&comparePrevious

export function useDashboardOverview(
  establishmentId: string | null | undefined,
  params?: DashboardQueryParams,
) {
  // undefined = not yet resolved (skip fetch). null = "All".
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/dashboard`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<DashboardOverviewResponse>(
    key,
    () => financeService.getDashboardOverview(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { dashboard: data, isLoading, isError: !!error };
}

// ─── Revenue Analytics ─────────────────────────────────────────────────
// GET /finance/analytics/revenue?establishmentId=...&startDate&endDate&granularity&barberId&serviceId

export function useRevenueAnalytics(
  establishmentId: string | null | undefined,
  params?: RevenueQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/revenue`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<RevenueAnalyticsResponse>(
    key,
    () => financeService.getRevenueAnalytics(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { analytics: data, isLoading, isError: !!error };
}

// ─── Barber Performance ────────────────────────────────────────────────
// GET /finance/analytics/barbers?establishmentId=...&startDate&endDate&barberId

export function useBarberPerformance(
  establishmentId: string | null | undefined,
  params?: BarberPerformanceQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/barbers`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<BarberPerformanceResponse>(
    key,
    () => financeService.getBarberPerformance(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { performance: data, isLoading, isError: !!error };
}

// ─── Trends ────────────────────────────────────────────────────────────
// GET /finance/analytics/trends?establishmentId=...&startDate&endDate&granularity&metric

export function useTrends(
  establishmentId: string | null | undefined,
  params: TrendsQueryParams | undefined,
) {
  // startDate and endDate are required; only create key when available
  const resolved = establishmentId !== undefined;
  const key =
    resolved && params?.startDate && params?.endDate
      ? buildCacheKey(`/finance/analytics/trends`, {
          establishmentId: establishmentId ?? "all",
          ...params,
        })
      : null;

  const { data, error, isLoading } = useSWR<TrendsResponse>(
    key,
    () => financeService.getTrends(establishmentId!, params!),
    ANALYTICS_SWR_OPTIONS,
  );

  return { trends: data, isLoading, isError: !!error };
}

// ─── Barber Earnings (individual barber view) ──────────────────────────
// GET /finance/barber/:barberId/summary

export function useBarberEarnings(barberId: string | undefined) {
  const key = barberId ? `/finance/barber/${barberId}/summary` : null;

  const { data, error, isLoading } = useSWR<BarberEarningsSummary>(
    key,
    () => financeService.getBarberEarningsSummary(barberId!),
    ANALYTICS_SWR_OPTIONS,
  );

  return { earnings: data, isLoading, isError: !!error };
}

// ─── Fee Management Hooks (SUPER_ADMIN) ────────────────────────────────

export function useFeeConfigs(establishmentId: string | undefined) {
  const key = establishmentId
    ? `/finance/fees?establishmentId=${establishmentId}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<FeeConfig[]>(
    key,
    () => financeService.getFeeConfigs(establishmentId!),
    { ...ANALYTICS_SWR_OPTIONS, refreshInterval: 0 },
  );

  return { fees: data ?? [], isLoading, isError: !!error, mutate };
}

export function useFeeMutations(establishmentId: string | undefined) {
  const { mutate } = useSWRConfig();

  function revalidateFees() {
    if (!establishmentId) return;
    return mutate(`/finance/fees?establishmentId=${establishmentId}`);
  }

  async function create(data: CreateFeeConfigDto) {
    if (!establishmentId) return;
    const result = await financeService.createFeeConfig(establishmentId, data);
    await revalidateFees();
    return result;
  }

  async function update(feeId: string, data: UpdateFeeConfigDto) {
    const result = await financeService.updateFeeConfig(feeId, data);
    await revalidateFees();
    return result;
  }

  return { create, update };
}

// ─── Service Performance ──────────────────────────────────────────────
// GET /finance/analytics/services?establishmentId=...&startDate&endDate&serviceId&granularity

export function useServicePerformance(
  establishmentId: string | null | undefined,
  params?: ServicePerformanceQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/services`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<ServicePerformanceResponse>(
    key,
    () => financeService.getServicePerformance(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { performance: data, isLoading, isError: !!error };
}

// ─── Customer Analytics ───────────────────────────────────────────────
// GET /finance/analytics/customers?establishmentId=...&startDate&endDate&topLimit

export function useCustomerAnalytics(
  establishmentId: string | null | undefined,
  params?: CustomerQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/customers`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<CustomerAnalyticsResponse>(
    key,
    () => financeService.getCustomerAnalytics(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { analytics: data, isLoading, isError: !!error };
}

// ─── Capacity Utilization ─────────────────────────────────────────────
// GET /finance/analytics/capacity?establishmentId=...&startDate&endDate&barberId

export function useCapacityUtilization(
  establishmentId: string | null | undefined,
  params: CapacityQueryParams | undefined,
) {
  const resolved = establishmentId !== undefined;
  const key =
    resolved && params?.startDate && params?.endDate
      ? buildCacheKey(`/finance/analytics/capacity`, {
          establishmentId: establishmentId ?? "all",
          ...params,
        })
      : null;

  const { data, error, isLoading } = useSWR<CapacityUtilizationResponse>(
    key,
    () => financeService.getCapacityUtilization(establishmentId!, params!),
    ANALYTICS_SWR_OPTIONS,
  );

  return { capacity: data, isLoading, isError: !!error };
}

// ─── Financial Breakdown ──────────────────────────────────────────────
// GET /finance/analytics/breakdown?establishmentId=...&startDate&endDate&barberId&serviceId

export function useFinancialBreakdown(
  establishmentId: string | null | undefined,
  params?: BreakdownQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/breakdown`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<FinancialBreakdownResponse>(
    key,
    () => financeService.getFinancialBreakdown(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { breakdown: data, isLoading, isError: !!error };
}

// ─── Revenue Forecast ─────────────────────────────────────────────────
// GET /finance/analytics/forecast?establishmentId=...&granularity&periodsAhead&lookbackPeriods

export function useForecast(
  establishmentId: string | null | undefined,
  params?: ForecastQueryParams,
) {
  const resolved = establishmentId !== undefined;
  const key = resolved
    ? buildCacheKey(`/finance/analytics/forecast`, {
        establishmentId: establishmentId ?? "all",
        ...params,
      })
    : null;

  const { data, error, isLoading } = useSWR<ForecastResponse>(
    key,
    () => financeService.getForecast(establishmentId!, params),
    ANALYTICS_SWR_OPTIONS,
  );

  return { forecast: data, isLoading, isError: !!error };
}
