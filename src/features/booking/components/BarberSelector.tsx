import { useServiceBarbers } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Barber } from "@/types";

interface BarberSelectorProps {
  establishmentId: string;
  serviceId: string;
  selected: Barber | null;
  onSelect: (barber: Barber) => void;
}

export function BarberSelector({
  establishmentId,
  serviceId,
  selected,
  onSelect,
}: BarberSelectorProps) {
  const { barbers, isLoading } = useServiceBarbers(establishmentId, serviceId);

  if (isLoading) {
    return (
      <div className="flex gap-4 justify-center flex-wrap">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Nenhum barbeiro disponivel.
      </p>
    );
  }

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {barbers.map((barber) => (
        <button
          key={barber.id}
          type="button"
          onClick={() => onSelect(barber)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border p-4 w-28 transition-all cursor-pointer",
            selected?.id === barber.id
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5",
          )}
        >
          <Avatar
            className={cn(
              "h-16 w-16 border-2",
              selected?.id === barber.id ? "border-primary" : "border-border",
            )}
          >
            <AvatarFallback className="bg-secondary text-primary font-bold">
              {barber.user?.name?.charAt(0) ?? "B"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-foreground truncate w-full text-center">
            {barber.user?.name?.split(" ")[0] ?? "Barbeiro"}
          </span>
        </button>
      ))}
    </div>
  );
}
