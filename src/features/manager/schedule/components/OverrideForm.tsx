import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { overrideSchema, type OverrideFormData } from "../schemas";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import { Loader2 } from "lucide-react";

interface OverrideFormProps {
  barberId: string;
  onSubmit: (data: OverrideFormData) => Promise<void>;
  isLoading: boolean;
}

export function OverrideForm({
  barberId,
  onSubmit,
  isLoading,
}: OverrideFormProps) {
  const form = useForm<OverrideFormData>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      barberId,
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "18:00",
      reason: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem className="flex flex-col">
          <FormLabel>Periodo</FormLabel>
          <DateRangePicker
            from={parseDate(startDate)}
            to={parseDate(endDate)}
            onRangeChange={(from, to) => {
              form.setValue("startDate", formatDateString(from));
              form.setValue("endDate", formatDateString(to));
            }}
          />
          <FormMessage />
        </FormItem>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Inicio</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Fim</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Horario especial de feriado"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Excecao
        </Button>
      </form>
    </Form>
  );
}
