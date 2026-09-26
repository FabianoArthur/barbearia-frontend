import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceFormData,
  type UpdateServiceFormData,
} from "../schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Service } from "@/types";

interface CreateServiceFormProps {
  establishmentId: string;
  defaultValues?: undefined;
  onSubmit: (data: CreateServiceFormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  mode?: "create";
}

interface EditServiceFormProps {
  establishmentId?: string;
  defaultValues: Partial<Service>;
  onSubmit: (data: UpdateServiceFormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  mode: "edit";
}

type ServiceFormProps = CreateServiceFormProps | EditServiceFormProps;

export function ServiceForm({
  establishmentId,
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Salvar",
  mode = "create",
}: ServiceFormProps) {
  const schema = mode === "edit" ? updateServiceSchema : createServiceSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(mode === "create" ? { establishmentId } : {}),
      name: defaultValues?.name ?? "",
      price: defaultValues?.price ?? 0,
      durationMinutes: defaultValues?.durationMinutes ?? 30,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          onSubmit as (data: Record<string, unknown>) => Promise<void>,
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Servico</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Corte de Cabelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preco (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duracao (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observacoes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observacoes sobre o servico (opcional)"
                  rows={3}
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
