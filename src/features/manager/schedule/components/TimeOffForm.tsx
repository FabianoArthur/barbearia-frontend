import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeOffSchema, type TimeOffFormData } from "../schemas";
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
import { DatePicker } from "@/components/ui/date-picker";
import { parseDate, formatDateString } from "@/lib/date-utils";
import { Loader2 } from "lucide-react";

interface TimeOffFormProps {
  barberId: string;
  onSubmit: (data: TimeOffFormData) => Promise<void>;
  isLoading: boolean;
}

export function TimeOffForm({
  barberId,
  onSubmit,
  isLoading,
}: TimeOffFormProps) {
  const form = useForm<TimeOffFormData>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: {
      barberId,
      date: "",
      startTime: "",
      endTime: "",
      reason: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <DatePicker
                date={parseDate(field.value)}
                onDateChange={(d) => field.onChange(formatDateString(d))}
                placeholder="Selecione a data"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inicio (opcional)</FormLabel>
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
                <FormLabel>Fim (opcional)</FormLabel>
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
                <Input placeholder="Ex: Consulta medica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Folga
        </Button>
      </form>
    </Form>
  );
}
