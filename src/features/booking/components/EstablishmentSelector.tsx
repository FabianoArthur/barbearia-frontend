import { usePublicEstablishments } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Establishment } from "@/types";

const generateMapsLink = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

interface EstablishmentSelectorProps {
  selected: Establishment | null;
  onSelect: (establishment: Establishment) => void;
}

export function EstablishmentSelector({
  selected,
  onSelect,
}: EstablishmentSelectorProps) {
  const { establishments, isLoading } = usePublicEstablishments();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Nenhum estabelecimento disponivel.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {establishments.map((est) => (
        <Card
          key={est.id}
          className={cn(
            "cursor-pointer transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected?.id === est.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:border-primary/40",
          )}
          onClick={() => onSelect(est)}
          role="button"
          tabIndex={0}
          aria-pressed={selected?.id === est.id}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(est);
            }
          }}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{est.name}</p>
              {est.address && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {est.address}
                </p>
              )}
            </div>
            {est.lat != null && est.lng != null && (
              <a
                href={generateMapsLink(est.lat, est.lng)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                title="Ver no mapa"
                aria-label={`Ver ${est.name} no mapa`}
              >
                <MapPin className="h-4 w-4" />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
