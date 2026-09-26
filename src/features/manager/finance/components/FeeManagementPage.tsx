import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/features/auth/context";
import { useFeeConfigs, useFeeMutations } from "../hooks";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Loader2,
  Shield,
  ArrowLeftRight,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type { FeeType, CreateFeeConfigDto, FeeConfig } from "../types";

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  PERCENTAGE: "Percentual",
  FLAT: "Fixo",
  TIERED: "Escalonado",
  HYBRID: "Hibrido",
};

// ─── Fee calculation helper ────────────────────────────────────────────

function calculateFee(fee: FeeConfig, revenue: number, tips: number): number {
  const base = fee.includesTips ? revenue + tips : revenue;
  let calculated = 0;

  switch (fee.feeType) {
    case "PERCENTAGE":
      calculated = ((fee.percentageRate ?? 0) / 100) * base;
      break;
    case "FLAT":
      calculated = fee.flatAmount ?? 0;
      break;
    case "HYBRID":
      calculated =
        ((fee.percentageRate ?? 0) / 100) * base + (fee.flatAmount ?? 0);
      break;
    case "TIERED":
      calculated = ((fee.percentageRate ?? 0) / 100) * base;
      break;
  }

  if (fee.minFee != null && calculated < fee.minFee) {
    calculated = fee.minFee;
  }
  if (fee.maxFee != null && calculated > fee.maxFee) {
    calculated = fee.maxFee;
  }

  return calculated;
}

// ─── Main Page ─────────────────────────────────────────────────────────

export default function FeeManagementPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;

  const { fees, isLoading, mutate } = useFeeConfigs(establishmentId);
  const { create, update } = useFeeMutations(establishmentId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeFees, historicalFees } = useMemo(() => {
    const now = new Date().toISOString();
    const active: FeeConfig[] = [];
    const historical: FeeConfig[] = [];

    for (const fee of fees) {
      if (!fee.effectiveTo || fee.effectiveTo > now) {
        active.push(fee);
      } else {
        historical.push(fee);
      }
    }

    return { activeFees: active, historicalFees: historical };
  }, [fees]);

  const handleCreate = useCallback(
    async (data: CreateFeeConfigDto) => {
      setIsSubmitting(true);
      try {
        await create(data);
        toast.success("Configuracao de taxa criada com sucesso!");
        setShowCreateDialog(false);
        await mutate();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [create, mutate],
  );

  const handleEdit = useCallback(
    async (feeId: string, data: Partial<CreateFeeConfigDto>) => {
      setIsSubmitting(true);
      try {
        await update(feeId, data);
        toast.success("Configuracao de taxa atualizada!");
        setEditingFee(null);
        await mutate();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [update, mutate],
  );

  const handleToggleActive = useCallback(
    async (fee: FeeConfig) => {
      try {
        await update(fee.id, { isActive: !fee.isActive });
        toast.success(
          fee.isActive
            ? "Taxa desativada com sucesso."
            : "Taxa ativada com sucesso.",
        );
        await mutate();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [update, mutate],
  );

  if (!establishmentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gerenciamento de Taxas</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Selecione um estabelecimento especifico na barra lateral para
              gerenciar taxas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gerenciamento de Taxas</h2>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Configuracao
          </Button>
        )}
      </div>

      {/* Active Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-base">
            Configuracoes Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : activeFees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma configuracao de taxa ativa.
            </p>
          ) : (
            <FeeTable
              fees={activeFees}
              onEdit={isSuperAdmin ? (fee) => setEditingFee(fee) : undefined}
              onToggleActive={isSuperAdmin ? handleToggleActive : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Historical Fees */}
      {historicalFees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-base">
              Historico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeeTable fees={historicalFees} />
          </CardContent>
        </Card>
      )}

      {/* Fee Comparison */}
      {fees.length >= 2 && <FeeComparisonCard fees={fees} />}

      {/* Fee Impact Simulator */}
      {activeFees.length > 0 && <FeeImpactSimulator fees={activeFees} />}

      {/* Create Dialog */}
      {isSuperAdmin && (
        <FeeFormDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          title="Nova Configuracao de Taxa"
          description="Crie uma nova configuracao de taxa. Ela entrara em vigor na data especificada."
        />
      )}

      {/* Edit Dialog */}
      {isSuperAdmin && editingFee && (
        <FeeFormDialog
          open={!!editingFee}
          onClose={() => setEditingFee(null)}
          onSubmit={(data) => handleEdit(editingFee.id, data)}
          isSubmitting={isSubmitting}
          title="Editar Configuracao"
          description="Edite a configuracao de taxa. Configuracoes passadas nao podem ser alteradas."
          defaultValues={{
            feeType: editingFee.feeType,
            percentageRate: editingFee.percentageRate ?? undefined,
            flatAmount: editingFee.flatAmount ?? undefined,
            minFee: editingFee.minFee ?? undefined,
            maxFee: editingFee.maxFee ?? undefined,
            includesTips: editingFee.includesTips,
            effectiveFrom: editingFee.effectiveFrom.split("T")[0],
            effectiveTo: editingFee.effectiveTo
              ? editingFee.effectiveTo.split("T")[0]
              : undefined,
          }}
        />
      )}
    </div>
  );
}

// ─── Fee Table ─────────────────────────────────────────────────────────

interface FeeTableProps {
  fees: FeeConfig[];
  onEdit?: (fee: FeeConfig) => void;
  onToggleActive?: (fee: FeeConfig) => void;
}

function FeeTable({ fees, onEdit, onToggleActive }: FeeTableProps) {
  const hasActions = !!onEdit || !!onToggleActive;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-primary">TIPO</TableHead>
          <TableHead>PERCENTUAL</TableHead>
          <TableHead>VALOR FIXO</TableHead>
          <TableHead>MIN / MAX</TableHead>
          <TableHead>INCLUI GORJETAS</TableHead>
          <TableHead>VIGENCIA INICIO</TableHead>
          <TableHead>VIGENCIA FIM</TableHead>
          <TableHead>STATUS</TableHead>
          {hasActions && <TableHead className="text-right">ACOES</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fees.map((fee) => {
          const isFuture = new Date(fee.effectiveFrom) > new Date();
          return (
            <TableRow key={fee.id}>
              <TableCell>
                <Badge variant="secondary">
                  {FEE_TYPE_LABELS[fee.feeType]}
                </Badge>
              </TableCell>
              <TableCell>
                {fee.percentageRate != null
                  ? `${fee.percentageRate}%`
                  : "\u2014"}
              </TableCell>
              <TableCell>
                {fee.flatAmount != null
                  ? formatCurrency(fee.flatAmount)
                  : "\u2014"}
              </TableCell>
              <TableCell>
                {fee.minFee != null || fee.maxFee != null
                  ? `${fee.minFee != null ? formatCurrency(fee.minFee) : "\u2014"} / ${fee.maxFee != null ? formatCurrency(fee.maxFee) : "\u2014"}`
                  : "\u2014"}
              </TableCell>
              <TableCell>{fee.includesTips ? "Sim" : "Nao"}</TableCell>
              <TableCell>
                {new Date(fee.effectiveFrom).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell>
                {fee.effectiveTo
                  ? new Date(fee.effectiveTo).toLocaleDateString("pt-BR")
                  : "\u2014"}
              </TableCell>
              <TableCell>
                <Badge variant={fee.isActive ? "default" : "outline"}>
                  {fee.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              {hasActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onToggleActive && (
                      <Switch
                        checked={fee.isActive}
                        onCheckedChange={() => onToggleActive(fee)}
                        aria-label={
                          fee.isActive ? "Desativar taxa" : "Ativar taxa"
                        }
                      />
                    )}
                    {onEdit && isFuture && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(fee)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Fee Comparison Card ──────────────────────────────────────────────

function FeeComparisonCard({ fees }: { fees: FeeConfig[] }) {
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const leftFee = useMemo(
    () => fees.find((f) => f.id === leftId),
    [fees, leftId],
  );
  const rightFee = useMemo(
    () => fees.find((f) => f.id === rightId),
    [fees, rightId],
  );

  const feeLabel = useCallback(
    (fee: FeeConfig) =>
      `${FEE_TYPE_LABELS[fee.feeType]} - ${new Date(fee.effectiveFrom).toLocaleDateString("pt-BR")}`,
    [],
  );

  const rows: { label: string; left: string; right: string; diff: boolean }[] =
    useMemo(() => {
      if (!leftFee || !rightFee) return [];

      const fmt = (v: number | null | undefined) =>
        v != null ? formatCurrency(v) : "\u2014";
      const pct = (v: number | null | undefined) =>
        v != null ? `${v}%` : "\u2014";

      return [
        {
          label: "Tipo",
          left: FEE_TYPE_LABELS[leftFee.feeType],
          right: FEE_TYPE_LABELS[rightFee.feeType],
          diff: leftFee.feeType !== rightFee.feeType,
        },
        {
          label: "Percentual",
          left: pct(leftFee.percentageRate),
          right: pct(rightFee.percentageRate),
          diff: leftFee.percentageRate !== rightFee.percentageRate,
        },
        {
          label: "Valor Fixo",
          left: fmt(leftFee.flatAmount),
          right: fmt(rightFee.flatAmount),
          diff: leftFee.flatAmount !== rightFee.flatAmount,
        },
        {
          label: "Taxa Minima",
          left: fmt(leftFee.minFee),
          right: fmt(rightFee.minFee),
          diff: leftFee.minFee !== rightFee.minFee,
        },
        {
          label: "Taxa Maxima",
          left: fmt(leftFee.maxFee),
          right: fmt(rightFee.maxFee),
          diff: leftFee.maxFee !== rightFee.maxFee,
        },
        {
          label: "Inclui Gorjetas",
          left: leftFee.includesTips ? "Sim" : "Nao",
          right: rightFee.includesTips ? "Sim" : "Nao",
          diff: leftFee.includesTips !== rightFee.includesTips,
        },
        {
          label: "Vigencia Inicio",
          left: new Date(leftFee.effectiveFrom).toLocaleDateString("pt-BR"),
          right: new Date(rightFee.effectiveFrom).toLocaleDateString("pt-BR"),
          diff: leftFee.effectiveFrom !== rightFee.effectiveFrom,
        },
        {
          label: "Vigencia Fim",
          left: leftFee.effectiveTo
            ? new Date(leftFee.effectiveTo).toLocaleDateString("pt-BR")
            : "\u2014",
          right: rightFee.effectiveTo
            ? new Date(rightFee.effectiveTo).toLocaleDateString("pt-BR")
            : "\u2014",
          diff: leftFee.effectiveTo !== rightFee.effectiveTo,
        },
        {
          label: "Status",
          left: leftFee.isActive ? "Ativa" : "Inativa",
          right: rightFee.isActive ? "Ativa" : "Inativa",
          diff: leftFee.isActive !== rightFee.isActive,
        },
      ];
    }, [leftFee, rightFee]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowLeftRight className="h-4 w-4" />
          Comparar Configuracoes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Configuracao A</Label>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {fees.map((fee) => (
                  <SelectItem key={fee.id} value={fee.id}>
                    {feeLabel(fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Configuracao B</Label>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {fees.map((fee) => (
                  <SelectItem key={fee.id} value={fee.id}>
                    {feeLabel(fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {leftFee && rightFee && (
          <>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CAMPO</TableHead>
                  <TableHead>CONFIGURACAO A</TableHead>
                  <TableHead>CONFIGURACAO B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell
                      className={row.diff ? "bg-primary/5 font-semibold" : ""}
                    >
                      {row.left}
                    </TableCell>
                    <TableCell
                      className={row.diff ? "bg-primary/5 font-semibold" : ""}
                    >
                      {row.right}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {(!leftId || !rightId) && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Selecione duas configuracoes para comparar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Fee Impact Simulator ─────────────────────────────────────────────

function FeeImpactSimulator({ fees }: { fees: FeeConfig[] }) {
  const [revenue, setRevenue] = useState<number>(100);
  const [tips, setTips] = useState<number>(0);

  const results = useMemo(() => {
    return fees.map((fee) => {
      const feeAmount = calculateFee(fee, revenue, tips);
      const gross = revenue + tips;
      const net = gross - feeAmount;
      return { fee, feeAmount, gross, net };
    });
  }, [fees, revenue, tips]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Simulador de Impacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Insira valores hipoteticos para simular o impacto de cada configuracao
          de taxa ativa.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Receita (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gorjetas (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={tips}
              onChange={(e) => setTips(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <Separator />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CONFIGURACAO</TableHead>
              <TableHead>TIPO</TableHead>
              <TableHead>RECEITA BRUTA</TableHead>
              <TableHead>TAXA CALCULADA</TableHead>
              <TableHead>RECEITA LIQUIDA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(({ fee, feeAmount, gross, net }) => (
              <TableRow key={fee.id}>
                <TableCell className="font-medium">
                  {new Date(fee.effectiveFrom).toLocaleDateString("pt-BR")}
                  {fee.effectiveTo
                    ? ` - ${new Date(fee.effectiveTo).toLocaleDateString("pt-BR")}`
                    : ""}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {FEE_TYPE_LABELS[fee.feeType]}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(gross)}</TableCell>
                <TableCell className="text-destructive font-semibold">
                  {formatCurrency(feeAmount)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(net)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Fee Form Dialog ───────────────────────────────────────────────────

interface FeeFormValues {
  feeType: FeeType;
  percentageRate: number | undefined;
  flatAmount: number | undefined;
  minFee: number | undefined;
  maxFee: number | undefined;
  includesTips: boolean;
  effectiveFrom: string;
  effectiveTo: string;
}

interface FeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFeeConfigDto) => Promise<void>;
  isSubmitting: boolean;
  title: string;
  description: string;
  defaultValues?: Partial<FeeFormValues>;
}

function FeeFormDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  description,
  defaultValues,
}: FeeFormDialogProps) {
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FeeFormValues>({
      defaultValues: {
        feeType: defaultValues?.feeType ?? "PERCENTAGE",
        percentageRate: defaultValues?.percentageRate ?? undefined,
        flatAmount: defaultValues?.flatAmount ?? undefined,
        minFee: defaultValues?.minFee ?? undefined,
        maxFee: defaultValues?.maxFee ?? undefined,
        includesTips: defaultValues?.includesTips ?? false,
        effectiveFrom: defaultValues?.effectiveFrom ?? "",
        effectiveTo: defaultValues?.effectiveTo ?? "",
      },
    });

  const feeType = watch("feeType");
  const includesTips = watch("includesTips");
  const effectiveFrom = watch("effectiveFrom");
  const effectiveTo = watch("effectiveTo");

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit({
      feeType: data.feeType,
      percentageRate:
        data.percentageRate != null ? Number(data.percentageRate) : undefined,
      flatAmount: data.flatAmount != null ? Number(data.flatAmount) : undefined,
      minFee: data.minFee != null ? Number(data.minFee) : undefined,
      maxFee: data.maxFee != null ? Number(data.maxFee) : undefined,
      includesTips: data.includesTips,
      effectiveFrom: new Date(data.effectiveFrom).toISOString(),
      effectiveTo: data.effectiveTo
        ? new Date(data.effectiveTo).toISOString()
        : undefined,
    });
    reset();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-4">
          {/* Fee Type */}
          <div className="space-y-2">
            <Label>Tipo de Taxa</Label>
            <Select
              value={feeType}
              onValueChange={(v) => setValue("feeType", v as FeeType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                <SelectItem value="FLAT">Fixo</SelectItem>
                <SelectItem value="TIERED">Escalonado</SelectItem>
                <SelectItem value="HYBRID">Hibrido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Percentage Rate */}
          {(feeType === "PERCENTAGE" || feeType === "HYBRID") && (
            <div className="space-y-2">
              <Label>Percentual (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 10"
                {...register("percentageRate", { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Flat Amount */}
          {(feeType === "FLAT" || feeType === "HYBRID") && (
            <div className="space-y-2">
              <Label>Valor Fixo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 2.50"
                {...register("flatAmount", { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Min / Max Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Taxa Minima (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                {...register("minFee", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Maxima (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                {...register("maxFee", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Includes Tips */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includesTips"
              checked={includesTips}
              onChange={(e) => setValue("includesTips", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="includesTips">Calculo inclui gorjetas</Label>
          </div>

          {/* Effective From */}
          <div className="space-y-2">
            <Label>Periodo de Vigencia</Label>
            <DateRangePicker
              from={parseDate(effectiveFrom)}
              to={parseDate(effectiveTo)}
              onRangeChange={(from, to) => {
                setValue("effectiveFrom", formatDateString(from));
                setValue("effectiveTo", formatDateString(to));
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
