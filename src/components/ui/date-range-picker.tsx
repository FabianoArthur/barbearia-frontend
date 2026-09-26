"use client";

import * as React from "react";
import { format, type Locale } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  locale?: Locale;
  numberOfMonths?: number;
}

function DateRangePicker({
  from,
  to,
  onRangeChange,
  placeholder = "Selecione um periodo",
  disabled,
  className,
  locale = ptBR,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setDraft(from || to ? { from, to } : undefined);
    }
  }, [open, from, to]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {from ? (
            to ? (
              <>
                {format(from, "dd MMM yyyy", { locale })}
                {" - "}
                {format(to, "dd MMM yyyy", { locale })}
              </>
            ) : (
              format(from, "dd MMM yyyy", { locale })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={numberOfMonths}
          disabled={disabled}
          locale={locale}
        />
        <Separator />
        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onRangeChange(draft?.from, draft?.to);
              setOpen(false);
            }}
          >
            Selecionar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateRangePicker };
export type { DateRangePickerProps };
