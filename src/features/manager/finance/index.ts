// Public API for the finance feature.
// Only export what other features need to import.

// Hooks (new API)
export {
  useDashboardOverview,
  useRevenueAnalytics,
  useBarberPerformance,
  useTrends,
  useServicePerformance,
  useCustomerAnalytics,
  useCapacityUtilization,
  useFinancialBreakdown,
  useForecast,
  useFeeConfigs,
  useFeeMutations,
  useBarberEarnings,
} from "./hooks";

// Types
export type {
  Period,
  Granularity,
  TrendMetric,
  DashboardQueryParams,
  RevenueQueryParams,
  BarberPerformanceQueryParams,
  TrendsQueryParams,
  ServicePerformanceQueryParams,
  CustomerQueryParams,
  CapacityQueryParams,
  BreakdownQueryParams,
  ForecastQueryParams,
  DashboardOverviewResponse,
  RevenueAnalyticsResponse,
  BarberPerformanceResponse,
  TrendsResponse,
  ServicePerformanceResponse,
  CustomerAnalyticsResponse,
  CapacityUtilizationResponse,
  FinancialBreakdownResponse,
  ForecastResponse,
  RevenuePeriodPoint,
  TrendTimeSeriesPoint,
  RevenueComposition,
  FeeConfig,
  FeeType,
  BarberPerformanceItem,
  ServicePerformanceItem,
  CustomerTopItem,
  CapacityBarberItem,
} from "./types";
