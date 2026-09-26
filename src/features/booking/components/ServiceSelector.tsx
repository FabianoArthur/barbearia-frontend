import { useEstablishmentServices } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

interface ServiceSelectorProps {
  establishmentId: string;
  selected: Service | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({
  establishmentId,
  selected,
  onSelect,
}: ServiceSelectorProps) {
  const { services, isLoading } = useEstablishmentServices(establishmentId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Nenhum servico disponivel.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {services.map((svc) => (
        <button
          key={svc.id}
          type="button"
          onClick={() => onSelect(svc)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border px-4 py-3 transition-all cursor-pointer text-left",
            selected?.id === svc.id
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40",
          )}
        >
          <div>
            <p className="font-semibold text-foreground">{svc.name}</p>
            <p className="text-xs text-muted-foreground">
              {svc.durationMinutes} min
            </p>
          </div>
          <span className="font-bold text-primary">
            {formatCurrency(svc.price)}
          </span>
        </button>
      ))}
    </div>
  );
}
