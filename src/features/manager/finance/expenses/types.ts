// ─── Expense Category ──────────────────────────────────────────────────

export type ExpenseCategory =
  "RENT" | "SUPPLIES" | "UTILITIES" | "MAINTENANCE" | "SALARY" | "OTHER";

// ─── Expense Entity ────────────────────────────────────────────────────

export interface Expense {
  id: string;
  establishmentId: string;
  barberId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ──────────────────────────────────────────────────────────────

export interface CreateExpenseDto {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  barberId?: string;
  establishmentId?: string;
}

export interface UpdateExpenseDto {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  date?: string;
  barberId?: string;
  establishmentId?: string;
}

// ─── Query Params ──────────────────────────────────────────────────────

export interface ExpenseQueryParams {
  establishmentId?: string;
  barberId?: string;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
