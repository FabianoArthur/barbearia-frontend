import { api } from "@/lib/api";
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
  ExportReportParams,
  FeeConfig,
  CreateFeeConfigDto,
  UpdateFeeConfigDto,
  FeeImportItem,
  FeeReconciliationResponse,
} from "./types";
import type { BarberEarningsSummary } from "@/types";

// ─── Helpers ───────────────────────────────────────────────────────────

function toRecord(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") {
      out[k] = String(v);
    }
  }
  return out;
}

// ─── Dashboard Overview (Phase 1) ─────────────────────────────────────
// GET /finance/dashboard?establishmentId=...&period=month&comparePrevious=true

export async function getDashboardOverview(
  establishmentId: string | null,
  params?: DashboardQueryParams,
): Promise<DashboardOverviewResponse> {
  const res = await api.get<DashboardOverviewResponse>(`/finance/dashboard`, {
    params: toRecord({
      establishmentId: establishmentId ?? undefined,
      period: params?.period,
      comparePrevious: params?.comparePrevious,
    }),
  });
  return res.data;
}

// ─── Revenue Analytics (Phase 1 & 2) ──────────────────────────────────
// GET /finance/analytics/revenue?establishmentId=...&startDate&endDate&granularity&barberId&serviceId

export async function getRevenueAnalytics(
  establishmentId: string | null,
  params?: RevenueQueryParams,
): Promise<RevenueAnalyticsResponse> {
  const res = await api.get<RevenueAnalyticsResponse>(
    `/finance/analytics/revenue`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params?.startDate,
        endDate: params?.endDate,
        granularity: params?.granularity,
        barberId: params?.barberId,
        serviceId: params?.serviceId,
        comparePrevious: params?.comparePrevious,
      }),
    },
  );
  return res.data;
}

// ─── Barber Performance (Phase 1) ─────────────────────────────────────
// GET /finance/analytics/barbers?establishmentId=...&startDate&endDate&barberId

export async function getBarberPerformance(
  establishmentId: string | null,
  params?: BarberPerformanceQueryParams,
): Promise<BarberPerformanceResponse> {
  const res = await api.get<BarberPerformanceResponse>(
    `/finance/analytics/barbers`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params?.startDate,
        endDate: params?.endDate,
        barberId: params?.barberId,
      }),
    },
  );
  return res.data;
}

// ─── Trends (Phase 2) ─────────────────────────────────────────────────
// GET /finance/analytics/trends?establishmentId=...&startDate&endDate&granularity&metric

export async function getTrends(
  establishmentId: string | null,
  params: TrendsQueryParams,
): Promise<TrendsResponse> {
  const res = await api.get<TrendsResponse>(`/finance/analytics/trends`, {
    params: toRecord({
      establishmentId: establishmentId ?? undefined,
      startDate: params.startDate,
      endDate: params.endDate,
      granularity: params.granularity,
      metric: params.metric,
    }),
  });
  return res.data;
}

// ─── Service Performance (Phase 3) ────────────────────────────────────
// GET /finance/analytics/services?establishmentId=...&startDate&endDate&serviceId&granularity

export async function getServicePerformance(
  establishmentId: string | null,
  params?: ServicePerformanceQueryParams,
): Promise<ServicePerformanceResponse> {
  const res = await api.get<ServicePerformanceResponse>(
    `/finance/analytics/services`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params?.startDate,
        endDate: params?.endDate,
        serviceId: params?.serviceId,
        granularity: params?.granularity,
      }),
    },
  );
  return res.data;
}

// ─── Customer Analytics (Phase 3) ─────────────────────────────────────
// GET /finance/analytics/customers?establishmentId=...&startDate&endDate&topLimit

export async function getCustomerAnalytics(
  establishmentId: string | null,
  params?: CustomerQueryParams,
): Promise<CustomerAnalyticsResponse> {
  const res = await api.get<CustomerAnalyticsResponse>(
    `/finance/analytics/customers`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params?.startDate,
        endDate: params?.endDate,
        topLimit: params?.topLimit,
      }),
    },
  );
  return res.data;
}

// ─── Capacity Utilization (Phase 3) ───────────────────────────────────
// GET /finance/analytics/capacity?establishmentId=...&startDate&endDate&barberId

export async function getCapacityUtilization(
  establishmentId: string | null,
  params: CapacityQueryParams,
): Promise<CapacityUtilizationResponse> {
  const res = await api.get<CapacityUtilizationResponse>(
    `/finance/analytics/capacity`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params.startDate,
        endDate: params.endDate,
        barberId: params.barberId,
      }),
    },
  );
  return res.data;
}

// ─── Financial Breakdown ───────────────────────────────────────────────
// GET /finance/analytics/breakdown?establishmentId=...&startDate&endDate&barberId&serviceId

export async function getFinancialBreakdown(
  establishmentId: string | null,
  params?: BreakdownQueryParams,
): Promise<FinancialBreakdownResponse> {
  const res = await api.get<FinancialBreakdownResponse>(
    `/finance/analytics/breakdown`,
    {
      params: toRecord({
        establishmentId: establishmentId ?? undefined,
        startDate: params?.startDate,
        endDate: params?.endDate,
        barberId: params?.barberId,
        serviceId: params?.serviceId,
      }),
    },
  );
  return res.data;
}

// ─── Revenue Forecast ──────────────────────────────────────────────────
// GET /finance/analytics/forecast?establishmentId=...&granularity&periodsAhead&lookbackPeriods

export async function getForecast(
  establishmentId: string | null,
  params?: ForecastQueryParams,
): Promise<ForecastResponse> {
  const res = await api.get<ForecastResponse>(`/finance/analytics/forecast`, {
    params: toRecord({
      establishmentId: establishmentId ?? undefined,
      granularity: params?.granularity,
      periodsAhead: params?.periodsAhead,
      lookbackPeriods: params?.lookbackPeriods,
    }),
  });
  return res.data;
}

// ─── Report Export ─────────────────────────────────────────────────────
// GET /finance/reports/export?establishmentId=...&format&reportType&startDate&endDate

export async function exportReport(
  establishmentId: string | null,
  params: ExportReportParams,
): Promise<Blob> {
  const res = await api.get(`/finance/reports/export`, {
    params: toRecord({
      establishmentId: establishmentId ?? undefined,
      format: params.format,
      reportType: params.reportType,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    responseType: "blob",
  });
  return res.data as Blob;
}

// ─── Fee Reconciliation ────────────────────────────────────────────────
// POST /finance/reconciliation/:establishmentId
// GET  /finance/reconciliation/:establishmentId/report

export async function reconcileFees(
  establishmentId: string,
  items: FeeImportItem[],
): Promise<FeeReconciliationResponse> {
  const res = await api.post<FeeReconciliationResponse>(
    `/finance/reconciliation/${establishmentId}`,
    { items },
  );
  return res.data;
}

export async function getReconciliationReport(
  establishmentId: string,
  startDate?: string,
  endDate?: string,
): Promise<FeeReconciliationResponse> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await api.get<FeeReconciliationResponse>(
    `/finance/reconciliation/${establishmentId}/report`,
    { params },
  );
  return res.data;
}

// ─── Fee Management (SUPER_ADMIN) ─────────────────────────────────────
// GET  /finance/fees?establishmentId=...
// POST /finance/fees/:establishmentId
// PUT  /finance/fees/:feeId

export async function getFeeConfigs(
  establishmentId: string,
): Promise<FeeConfig[]> {
  const res = await api.get<FeeConfig[]>(`/finance/fees`, {
    params: { establishmentId },
  });
  return res.data;
}

export async function createFeeConfig(
  establishmentId: string,
  data: CreateFeeConfigDto,
): Promise<FeeConfig> {
  const res = await api.post<FeeConfig>(
    `/finance/fees/${establishmentId}`,
    data,
  );
  return res.data;
}

export async function updateFeeConfig(
  feeId: string,
  data: UpdateFeeConfigDto,
): Promise<FeeConfig> {
  const res = await api.put<FeeConfig>(`/finance/fees/${feeId}`, data);
  return res.data;
}

// ─── Barber Earnings (individual barber view) ──────────────────────────
// GET /finance/barber/:barberId/summary

export async function getBarberEarningsSummary(
  barberId: string,
): Promise<BarberEarningsSummary> {
  const res = await api.get<BarberEarningsSummary>(
    `/finance/barber/${barberId}/summary`,
  );
  return res.data;
}
