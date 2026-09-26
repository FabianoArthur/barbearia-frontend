import { useState } from "react";
import { useBarberServices } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AttachServiceDialog } from "./AttachServiceDialog";

interface BarberServicesSectionProps {
  barberId: string;
}

export function BarberServicesSection({
  barberId,
}: BarberServicesSectionProps) {
  const { services, isLoading } = useBarberServices(barberId);
  const [attachOpen, setAttachOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2 border-t border-border">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {services.length === 0
            ? "Nenhum servico vinculado"
            : `Servicos Oferecidos (${services.length})`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs"
          onClick={() => setAttachOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Vincular
        </Button>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {services.map((service) => (
            <Badge
              key={service.id}
              variant="secondary"
              className="gap-1 text-xs"
            >
              {service.name} — {formatCurrency(service.price)}
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {service.durationMinutes}min
              </span>
            </Badge>
          ))}
        </div>
      )}

      <AttachServiceDialog
        barberId={barberId}
        open={attachOpen}
        onOpenChange={setAttachOpen}
      />
    </div>
  );
}
