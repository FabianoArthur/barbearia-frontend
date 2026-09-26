import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import type {
  Period,
  Granularity,
  DashboardQueryParams,
  RevenueQueryParams,
  BarberPerformanceQueryParams,
  TrendsQueryParams,
} from "../types";

// ─── Types ─────────────────────────────────────────────────────────────

interface DateRangeContextValue {
  /** Current period selection (matches backend enum). */
  period: Period;
  granularity: Granularity;
  /** Computed start date from the selected period. */
  startDate: string | undefined;
  /** Computed end date from the selected period. */
  endDate: string | undefined;
  comparePrevious: boolean;
  setPeriod: (period: Period) => void;
  setGranularity: (granularity: Granularity) => void;
  setComparePrevious: (compare: boolean) => void;
  /** Build params for GET /finance/dashboard/:id */
  toDashboardParams: () => DashboardQueryParams;
  /** Build params for GET /finance/analytics/:id/revenue */
  toRevenueParams: () => RevenueQueryParams;
  /** Build params for GET /finance/analytics/:id/barbers */
  toBarberParams: () => BarberPerformanceQueryParams;
  /** Build params for GET /finance/analytics/:id/trends */
  toTrendsParams: () => TrendsQueryParams | undefined;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────────

function computeDateRange(period: Period): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();

  switch (period) {
    case "today":
      return { startDate: startOfDay(now).toISOString(), endDate };
    case "week":
      return {
        startDate: startOfWeek(subWeeks(now, 1)).toISOString(),
        endDate,
      };
    case "month":
      return {
        startDate: startOfMonth(subMonths(now, 1)).toISOString(),
        endDate,
      };
    case "quarter":
      return {
        startDate: startOfQuarter(subQuarters(now, 1)).toISOString(),
        endDate,
      };
    case "year":
      return {
        startDate: startOfYear(subYears(now, 1)).toISOString(),
        endDate,
      };
    case "all":
      return { startDate: "2020-01-01T00:00:00.000Z", endDate };
    default:
      return { startDate: startOfDay(subDays(now, 30)).toISOString(), endDate };
  }
}

function defaultGranularityForPeriod(period: Period): Granularity {
  switch (period) {
    case "today":
      return "hour";
    case "week":
      return "day";
    case "month":
      return "day";
    case "quarter":
      return "week";
    case "year":
      return "month";
    case "all":
      return "month";
    default:
      return "day";
  }
}

// ─── Provider ──────────────────────────────────────────────────────────

interface DateRangeProviderProps {
  children: ReactNode;
  defaultPeriod?: Period;
}

export function DateRangeProvider({
  children,
  defaultPeriod = "month",
}: DateRangeProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL if present
  const initialPeriod = (searchParams.get("period") as Period) || defaultPeriod;
  const initialGranularity =
    (searchParams.get("granularity") as Granularity) ||
    defaultGranularityForPeriod(initialPeriod);

  const [period, setPeriodState] = useState<Period>(initialPeriod);
  const [granularity, setGranularityState] =
    useState<Granularity>(initialGranularity);
  const [comparePrevious, setComparePreviousState] = useState(
    searchParams.get("compare") === "true",
  );

  // Persist to URL search params
  const syncToUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(updates)) {
            if (v === undefined || v === "") {
              next.delete(k);
            } else {
              next.set(k, v);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPeriod = useCallback(
    (p: Period) => {
      setPeriodState(p);
      const g = defaultGranularityForPeriod(p);
      setGranularityState(g);
      syncToUrl({ period: p, granularity: g });
    },
    [syncToUrl],
  );

  const setGranularity = useCallback(
    (g: Granularity) => {
      setGranularityState(g);
      syncToUrl({ granularity: g });
    },
    [syncToUrl],
  );

  const setComparePrevious = useCallback(
    (compare: boolean) => {
      setComparePreviousState(compare);
      syncToUrl({ compare: compare ? "true" : undefined });
    },
    [syncToUrl],
  );

  const { startDate, endDate } = useMemo(
    () => computeDateRange(period),
    [period],
  );

  // Build per-endpoint query params
  const toDashboardParams = useCallback(
    (): DashboardQueryParams => ({
      period,
      comparePrevious: comparePrevious || undefined,
    }),
    [period, comparePrevious],
  );

  const toRevenueParams = useCallback(
    (): RevenueQueryParams => ({
      startDate,
      endDate,
      granularity,
      comparePrevious: comparePrevious || undefined,
    }),
    [startDate, endDate, granularity, comparePrevious],
  );

  const toBarberParams = useCallback(
    (): BarberPerformanceQueryParams => ({
      startDate,
      endDate,
    }),
    [startDate, endDate],
  );

  const toTrendsParams = useCallback((): TrendsQueryParams | undefined => {
    if (!startDate || !endDate) return undefined;
    return {
      startDate,
      endDate,
      granularity,
    };
  }, [startDate, endDate, granularity]);

  const value = useMemo<DateRangeContextValue>(
    () => ({
      period,
      granularity,
      startDate,
      endDate,
      comparePrevious,
      setPeriod,
      setGranularity,
      setComparePrevious,
      toDashboardParams,
      toRevenueParams,
      toBarberParams,
      toTrendsParams,
    }),
    [
      period,
      granularity,
      startDate,
      endDate,
      comparePrevious,
      setPeriod,
      setGranularity,
      setComparePrevious,
      toDashboardParams,
      toRevenueParams,
      toBarberParams,
      toTrendsParams,
    ],
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}
