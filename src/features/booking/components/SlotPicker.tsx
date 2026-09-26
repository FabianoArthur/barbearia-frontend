import { useAvailability } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  barberId: string;
  date: string;
  serviceId: string;
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export function SlotPicker({
  barberId,
  date,
  serviceId,
  selectedSlot,
  onSelect,
}: SlotPickerProps) {
  const { slots, isLoading } = useAvailability(barberId, date, serviceId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Nenhum horario disponivel nesta data.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const time = slot.startTime.includes("T")
          ? new Date(slot.startTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : slot.startTime;

        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onSelect(slot.startTime)}
            className={cn(
              "rounded-lg border py-2.5 text-sm font-bold transition-all cursor-pointer",
              selectedSlot === slot.startTime
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105"
                : "bg-card text-foreground border-border hover:bg-secondary hover:-translate-y-0.5",
            )}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
