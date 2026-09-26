// ─── Period & Granularity (aligned to backend enums) ───────────────────

/** Dashboard period filter — matches backend enum exactly. */
export type Period = "today" | "week" | "month" | "quarter" | "year" | "all";

/** Granularity for time-series grouping. */
export type Granularity =
  "hour" | "day" | "week" | "month" | "quarter" | "year";

/** Metric selector for trends endpoint. */
export type TrendMetric = "revenue" | "bookings" | "tips" | "fees";

// ─── Query Params (per-endpoint, matching backend DTOs) ────────────────

/** GET /finance/dashboard/:establishmentId */
export interface DashboardQueryParams {
  period?: Period;
  comparePrevious?: boolean;
}

/** GET /finance/analytics/:establishmentId/revenue */
export interface RevenueQueryParams {
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
  barberId?: string;
  serviceId?: string;
  comparePrevious?: boolean;
}

/** GET /finance/analytics/:establishmentId/barbers */
export interface BarberPerformanceQueryParams {
  startDate?: string;
  endDate?: string;
  barberId?: string;
}

/** GET /finance/analytics/:establishmentId/trends */
export interface TrendsQueryParams {
  startDate: string; // required by backend
  endDate: string; // required by backend
  granularity?: Granularity;
  metric?: TrendMetric;
}

/** GET /finance/analytics/:establishmentId/services */
export interface ServicePerformanceQueryParams {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
  granularity?: "day" | "week" | "month" | "quarter" | "year";
}

/** GET /finance/analytics/:establishmentId/customers */
export interface CustomerQueryParams {
  startDate?: string;
  endDate?: string;
  topLimit?: number;
}

/** GET /finance/analytics/:establishmentId/capacity */
export interface CapacityQueryParams {
  startDate: string; // required by backend
  endDate: string; // required by backend
  barberId?: string;
}

/** GET /finance/analytics/:establishmentId/breakdown */
export interface BreakdownQueryParams {
  startDate?: string;
  endDate?: string;
  barberId?: string;
  serviceId?: string;
}

/** GET /finance/analytics/:establishmentId/forecast */
export interface ForecastQueryParams {
  granularity?: "day" | "week" | "month";
  periodsAhead?: number;
  lookbackPeriods?: number;
}

/** GET /finance/reports/:establishmentId/export */
export type ReportFormat = "csv" | "json";
export type ReportType = "revenue" | "barber" | "service" | "customer" | "tax";

export interface ExportReportParams {
  format: ReportFormat;
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
}

// ─── Dashboard Overview Response ───────────────────────────────────────
// GET /finance/dashboard/:establishmentId

export interface DashboardTodaySnapshot {
  revenue: number;
  bookingCount: number;
  tips: number;
}

export interface DashboardPeriodComparison {
  currentGrossRevenue: number;
  previousGrossRevenue: number;
  currentNetRevenue: number;
  previousNetRevenue: number;
  currentBookings: number;
  previousBookings: number;
  currentTips: number;
  previousTips: number;
  currentPlatformFees: number;
  previousPlatformFees: number;
  revenueGrowthRate: number;
  netRevenueGrowthRate: number;
  bookingsGrowthRate: number;
  tipsGrowthRate: number;
  feesGrowthRate: number;
}

export interface DashboardTopBarber {
  barberId: string;
  barberName: string;
  grossRevenue: number;
}

export interface DashboardTopService {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
}

export interface RevenueComposition {
  bookingRevenue: number;
  tipsRevenue: number;
  platformFees: number;
  refunds: number;
}

export interface DashboardOverviewResponse {
  grossRevenue: number;
  netRevenue: number;
  totalBookings: number;
  totalTips: number;
  totalPlatformFees: number;
  averageOrderValue: number;
  today: DashboardTodaySnapshot;
  periodComparison?: DashboardPeriodComparison;
  topBarber?: DashboardTopBarber | null;
  topService?: DashboardTopService | null;
  revenueComposition: RevenueComposition;
  generatedAt: string;
}

// ─── Revenue Analytics Response ────────────────────────────────────────
// GET /finance/analytics/:establishmentId/revenue

export interface RevenueSummary {
  grossRevenue: number;
  netRevenue: number;
  totalBookings: number;
  totalTips: number;
  totalPlatformFees: number;
  totalRefunds: number;
  averageOrderValue: number;
}

export interface RevenuePeriodPoint {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  totalTips: number;
  totalPlatformFees: number;
  bookingCount: number;
}

export interface RevenueByBarber {
  barberId: string;
  barberName: string;
  grossRevenue: number;
  netRevenue: number;
  totalTips: number;
  totalPlatformFees: number;
  bookingCount: number;
  averageOrderValue: number;
  tipsToRevenueRatio: number;
}

export interface RevenueByService {
  serviceId: string;
  serviceName: string;
  grossRevenue: number;
  netRevenue: number;
  bookingCount: number;
  averagePrice: number;
  durationMinutes: number;
  revenuePerMinute: number;
}

export interface RevenueAnalyticsResponse {
  summary: RevenueSummary;
  byPeriod: RevenuePeriodPoint[];
  byBarber: RevenueByBarber[];
  byService: RevenueByService[];
  /** Previous-period summary for comparison (only when comparePrevious=true) */
  previousSummary?: RevenueSummary;
  /** Previous-period breakdown by time bucket (only when comparePrevious=true) */
  previousByPeriod?: RevenuePeriodPoint[];
  generatedAt: string;
}

// ─── Barber Performance Response ───────────────────────────────────────
// GET /finance/analytics/:establishmentId/barbers

export interface BarberPerformanceItem {
  barberId: string;
  barberName: string;
  grossRevenue: number;
  netRevenue: number;
  totalTips: number;
  totalPlatformFees: number;
  bookingCount: number;
  averageOrderValue: number;
  tipsToRevenueRatio: number;
  rank: number;
}

export interface BarberPerformanceResponse {
  barbers: BarberPerformanceItem[];
  generatedAt: string;
}

// ─── Trends Response ───────────────────────────────────────────────────
// GET /finance/analytics/:establishmentId/trends

export interface TrendTimeSeriesPoint {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  bookingCount: number;
  totalTips: number;
  totalPlatformFees: number;
}

export interface TrendPeakPeriod {
  period: string;
  value: number;
}

export interface TrendGrowthRate {
  period: string;
  growthRate: number;
}

export interface TrendsResponse {
  current: TrendTimeSeriesPoint[];
  previous?: TrendTimeSeriesPoint[];
  peakPeriod?: TrendPeakPeriod | null;
  growthRates: TrendGrowthRate[];
  generatedAt: string;
}

// ─── Service Performance (Phase 3) ────────────────────────────────────
// GET /finance/analytics/:establishmentId/services

export interface ServicePerformanceItem {
  serviceId: string;
  serviceName: string;
  grossRevenue: number;
  netRevenue: number;
  bookingCount: number;
  averagePrice: number;
  durationMinutes: number;
  revenuePerMinute: number;
  rank: number;
}

export interface ServicePerformanceTrend {
  period: string;
  bookingCount: number;
  grossRevenue: number;
}

export interface ServicePerformanceResponse {
  services: ServicePerformanceItem[];
  trends: ServicePerformanceTrend[];
  generatedAt: string;
}

// ─── Customer Analytics (Phase 3) ─────────────────────────────────────
// GET /finance/analytics/:establishmentId/customers

export interface CustomerTopItem {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  bookingCount: number;
}

export interface CustomerAnalyticsResponse {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageBookingsPerCustomer: number;
  topCustomers: CustomerTopItem[];
  retentionRate: number;
  churnedCustomers: number;
  generatedAt: string;
}

// ─── Capacity Utilization (Phase 3) ───────────────────────────────────
// GET /finance/analytics/:establishmentId/capacity

export interface CapacityBarberItem {
  barberId: string;
  barberName: string;
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  utilizationRate: number;
  lostRevenue: number;
}

export interface CapacityUtilizationResponse {
  barbers: CapacityBarberItem[];
  overallUtilizationRate: number;
  totalLostRevenue: number;
  generatedAt: string;
}

// ─── Financial Breakdown Response ──────────────────────────────────────
// GET /finance/analytics/:establishmentId/breakdown

export interface FinancialBreakdownResponse {
  bookingRevenue: number;
  totalTips: number;
  grossRevenue: number;
  totalPlatformFees: number;
  totalRefunds: number;
  netRevenue: number;
  feeToRevenueRatio: number;
  averageFeePerBooking: number;
  refundRate: number;
  totalBookings: number;
  generatedAt: string;
}

// ─── Forecast Response ─────────────────────────────────────────────────
// GET /finance/analytics/:establishmentId/forecast

export type ForecastConfidence = "low" | "medium" | "high";
export type AnomalyType = "spike" | "drop";
export type ForecastTrend = "growing" | "declining" | "stable";

export interface ForecastPoint {
  period: string;
  predictedRevenue: number;
  confidence: ForecastConfidence;
}

export interface ForecastAnomaly {
  period: string;
  actualRevenue: number;
  expectedRevenue: number;
  deviation: number;
  type: AnomalyType;
}

export interface ForecastSeasonalPattern {
  period: string;
  averageRevenue: number;
  relativeStrength: number;
}

export interface ForecastResponse {
  forecast: ForecastPoint[];
  anomalies: ForecastAnomaly[];
  seasonalPatterns: ForecastSeasonalPattern[];
  movingAverage: number;
  trend: ForecastTrend;
  generatedAt: string;
}

// ─── Reconciliation ────────────────────────────────────────────────────

export interface FeeImportItem {
  transactionId: string;
  feeAmount: number;
  transactionDate?: string;
}

export interface ReconciliationMismatch {
  appointmentId: string;
  calculatedFee: number;
  actualFee: number;
  difference: number;
}

export interface FeeReconciliationResponse {
  totalMatched: number;
  totalMismatched: number;
  totalUnmatched: number;
  mismatches: ReconciliationMismatch[];
  generatedAt: string;
}

// ─── Fee Management (SUPER_ADMIN) ──────────────────────────────────────
// Aligned to CreatePlatformFeeDto / UpdatePlatformFeeDto from backend

export type FeeType = "PERCENTAGE" | "FLAT" | "TIERED" | "HYBRID";

export interface FeeConfig {
  id: string;
  establishmentId: string;
  feeType: FeeType;
  percentageRate?: number | null;
  flatAmount?: number | null;
  minFee?: number | null;
  maxFee?: number | null;
  includesTips: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeConfigDto {
  feeType: FeeType;
  percentageRate?: number;
  flatAmount?: number;
  minFee?: number;
  maxFee?: number;
  includesTips: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdateFeeConfigDto {
  feeType?: FeeType;
  percentageRate?: number;
  flatAmount?: number;
  minFee?: number;
  maxFee?: number;
  includesTips?: boolean;
  effectiveTo?: string;
  isActive?: boolean;
}
