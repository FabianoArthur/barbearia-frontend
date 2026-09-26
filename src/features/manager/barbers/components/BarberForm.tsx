import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateBarberSchema, type UpdateBarberFormData } from "../schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BarberFormProps {
  defaultCommission?: number;
  onSubmit: (data: UpdateBarberFormData) => Promise<void>;
  isLoading: boolean;
}

export function BarberForm({
  defaultCommission = 50,
  onSubmit,
  isLoading,
}: BarberFormProps) {
  const form = useForm<
    z.input<typeof updateBarberSchema>,
    unknown,
    UpdateBarberFormData
  >({
    resolver: zodResolver(updateBarberSchema),
    defaultValues: { commissionPercent: defaultCommission },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="commissionPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comissao (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar
        </Button>
      </form>
    </Form>
  );
}
