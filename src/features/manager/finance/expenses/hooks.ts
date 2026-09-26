import useSWR, { useSWRConfig } from "swr";
import type { PaginatedResponse, PaginationMeta } from "@/types";
import type {
  Expense,
  ExpenseQueryParams,
  CreateExpenseDto,
  UpdateExpenseDto,
} from "./types";
import * as expenseService from "./services";

// ─── Helpers ───────────────────────────────────────────────────────────

const SWR_OPTIONS = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
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

// ─── List Expenses ─────────────────────────────────────────────────────

const EMPTY_META: PaginationMeta = {
  totalItems: 0,
  itemsPerPage: 20,
  currentPage: 1,
  totalPages: 0,
};

export function useExpenses(params?: ExpenseQueryParams) {
  const key = buildCacheKey(
    "/finance/expenses",
    params as Record<string, unknown>,
  );

  const { data, error, isLoading } = useSWR<PaginatedResponse<Expense>>(
    key,
    () => expenseService.findAll(params),
    SWR_OPTIONS,
  );

  return {
    expenses: data?.data ?? [],
    meta: data?.meta ?? EMPTY_META,
    isLoading,
    isError: !!error,
  };
}

// ─── Expense Mutations ─────────────────────────────────────────────────

export function useExpenseMutations() {
  const { mutate } = useSWRConfig();

  function revalidateExpenses() {
    return mutate(
      (key: unknown) =>
        typeof key === "string" && key.startsWith("/finance/expenses"),
      undefined,
      { revalidate: true },
    );
  }

  async function createExpense(dto: CreateExpenseDto) {
    const result = await expenseService.create(dto);
    await revalidateExpenses();
    return result;
  }

  async function updateExpense(id: string, dto: UpdateExpenseDto) {
    const result = await expenseService.update(id, dto);
    await revalidateExpenses();
    return result;
  }

  async function removeExpense(id: string) {
    await expenseService.remove(id);
    await revalidateExpenses();
  }

  return { createExpense, updateExpense, removeExpense };
}
