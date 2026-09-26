import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useBarberServices, useSetBarberServices } from "../hooks";
import { useServices } from "@/features/manager/services/hooks";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";

interface AttachServiceDialogProps {
  barberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttachServiceDialog({
  barberId,
  open,
  onOpenChange,
}: AttachServiceDialogProps) {
  const { selectedEstablishmentId } = useEstablishmentStore();
  const { services: currentServices, isLoading: loadingCurrent } =
    useBarberServices(barberId);
  const { services: allServices, isLoading: loadingAll } = useServices(
    selectedEstablishmentId ?? undefined,
  );
  const { setServices } = useSetBarberServices();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const currentIdSet = useMemo(
    () => new Set(currentServices.map((s) => s.id)),
    [currentServices],
  );

  const availableServices = useMemo(
    () => allServices.filter((s) => !currentIdSet.has(s.id)),
    [allServices, currentIdSet],
  );

  const handleToggle = useCallback((serviceId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  }, []);

  async function handleSubmit() {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      const merged = [...currentIdSet, ...selectedIds];
      await setServices(barberId, merged);
      toast.success("Servicos vinculados com sucesso");
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch {
      toast.error("Erro ao vincular servicos");
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = loadingCurrent || loadingAll;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Servicos</DialogTitle>
          <DialogDescription>
            Selecione os servicos que este barbeiro oferece.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : availableServices.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground text-center">
            Todos os servicos ja estao vinculados.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto py-2">
            {availableServices.map((service) => (
              <Label
                key={service.id}
                htmlFor={`svc-${service.id}`}
                className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`svc-${service.id}`}
                  checked={selectedIds.has(service.id)}
                  onCheckedChange={(checked) =>
                    handleToggle(service.id, checked === true)
                  }
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{service.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {service.durationMinutes}min
                </span>
              </Label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedIds.size === 0}
          >
            {submitting ? "Vinculando..." : "Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
