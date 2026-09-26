import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type {
  Expense,
  ExpenseQueryParams,
  CreateExpenseDto,
  UpdateExpenseDto,
} from "./types";

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

// ─── Queries ───────────────────────────────────────────────────────────

export async function findAll(
  params?: ExpenseQueryParams,
): Promise<PaginatedResponse<Expense>> {
  const res = await api.get<PaginatedResponse<Expense>>("/finance/expenses", {
    params: params ? toRecord(params as Record<string, unknown>) : undefined,
  });
  return res.data;
}

// ─── Mutations ─────────────────────────────────────────────────────────

export async function create(dto: CreateExpenseDto): Promise<Expense> {
  const res = await api.post<Expense>("/finance/expenses", dto);
  return res.data;
}

export async function update(
  id: string,
  dto: UpdateExpenseDto,
): Promise<Expense> {
  const res = await api.put<Expense>(`/finance/expenses/${id}`, dto);
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/finance/expenses/${id}`);
}
