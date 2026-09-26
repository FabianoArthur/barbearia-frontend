import { useState, useMemo, useCallback } from "react";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useAuth } from "@/features/auth/context";
import { useExpenses, useExpenseMutations } from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type {
  Expense,
  ExpenseCategory,
  ExpenseQueryParams,
  CreateExpenseDto,
  UpdateExpenseDto,
} from "./types";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "RENT", label: "Aluguel" },
  { value: "SUPPLIES", label: "Suprimentos" },
  { value: "UTILITIES", label: "Utilidades" },
  { value: "MAINTENANCE", label: "Manutencao" },
  { value: "SALARY", label: "Salario" },
  { value: "OTHER", label: "Outros" },
];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Aluguel",
  SUPPLIES: "Suprimentos",
  UTILITIES: "Utilidades",
  MAINTENANCE: "Manutencao",
  SALARY: "Salario",
  OTHER: "Outros",
};

const CATEGORY_VARIANT: Record<
  ExpenseCategory,
  "default" | "secondary" | "outline"
> = {
  RENT: "default",
  SUPPLIES: "secondary",
  UTILITIES: "outline",
  MAINTENANCE: "secondary",
  SALARY: "default",
  OTHER: "outline",
};

interface FilterState {
  category: ExpenseCategory | "ALL";
  startDate: string;
  endDate: string;
}

interface ExpenseFormState {
  category: ExpenseCategory;
  description: string;
  amount: string;
  date: string;
  establishmentId: string;
}

const INITIAL_FORM: ExpenseFormState = {
  category: "SUPPLIES",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  establishmentId: "",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId, establishments } = useEstablishmentStore();
  const isAllEstablishments = selectedEstablishmentId === null;
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    category: "ALL",
    startDate: "",
    endDate: "",
  });
  const [committed, setCommitted] = useState<FilterState>({
    category: "ALL",
    startDate: "",
    endDate: "",
  });

  const queryParams = useMemo<ExpenseQueryParams>(() => {
    const params: ExpenseQueryParams = {};
    if (establishmentId) params.establishmentId = establishmentId;
    if (committed.category !== "ALL") params.category = committed.category;
    if (committed.startDate) params.startDate = committed.startDate;
    if (committed.endDate) params.endDate = committed.endDate;
    return params;
  }, [establishmentId, committed]);

  const { expenses, isLoading } = useExpenses(queryParams);
  const { createExpense, updateExpense, removeExpense } = useExpenseMutations();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = useCallback(() => {
    setCommitted({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    const reset: FilterState = { category: "ALL", startDate: "", endDate: "" };
    setFilters(reset);
    setCommitted(reset);
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingExpense(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date.split("T")[0],
      establishmentId: expense.establishmentId,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Preencha todos os campos obrigatorios.");
      return;
    }
    if (isAllEstablishments && !form.establishmentId) {
      toast.error("Selecione um estabelecimento.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingExpense) {
        const dto: UpdateExpenseDto = {
          category: form.category,
          description: form.description.trim(),
          amount: parsedAmount,
          date: form.date,
          ...(isAllEstablishments && { establishmentId: form.establishmentId }),
        };
        await updateExpense(editingExpense.id, dto);
        toast.success("Despesa atualizada!");
      } else {
        const dto: CreateExpenseDto = {
          category: form.category,
          description: form.description.trim(),
          amount: parsedAmount,
          date: form.date,
          ...(isAllEstablishments && { establishmentId: form.establishmentId }),
        };
        await createExpense(dto);
        toast.success("Despesa criada!");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [form, editingExpense, createExpense, updateExpense, isAllEstablishments]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeExpense(deleteTarget);
      toast.success("Despesa excluida!");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, removeExpense]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary text-base">Despesas</CardTitle>
            {!isLoading && expenses.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(totalAmount)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select
                value={filters.category}
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    category: v as ExpenseCategory | "ALL",
                  }))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Periodo</Label>
              <DateRangePicker
                from={parseDate(filters.startDate)}
                to={parseDate(filters.endDate)}
                onRangeChange={(from, to) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: formatDateString(from),
                    endDate: formatDateString(to),
                  }))
                }
              />
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATA</TableHead>
                  <TableHead>CATEGORIA</TableHead>
                  <TableHead>DESCRICAO</TableHead>
                  <TableHead>VALOR</TableHead>
                  <TableHead className="text-right">ACOES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {new Date(expense.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CATEGORY_VARIANT[expense.category]}>
                        {CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar Despesa" : "Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAllEstablishments && (
              <div className="space-y-2">
                <Label>Estabelecimento *</Label>
                <Select
                  value={form.establishmentId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, establishmentId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estabelecimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map((est) => (
                      <SelectItem key={est.id} value={est.id}>
                        {est.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    category: v as ExpenseCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descricao *</Label>
              <Input
                placeholder="Descricao da despesa"
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <DatePicker
                date={parseDate(form.date)}
                onDateChange={(d) =>
                  setForm((prev) => ({ ...prev, date: formatDateString(d) }))
                }
                placeholder="Selecione a data"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingExpense ? (
                "Atualizar"
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Despesa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir esta despesa? Esta acao nao pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
