import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEstablishmentSchema,
  updateEstablishmentSchema,
  type CreateEstablishmentFormData,
  type UpdateEstablishmentFormData,
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
import type { Establishment } from "@/types";

// The update schema is a superset (every field optional), so it types both modes.
type EstablishmentFormInput = z.input<typeof updateEstablishmentSchema>;

interface CreateEstablishmentFormProps {
  defaultValues?: undefined;
  onSubmit: (data: CreateEstablishmentFormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  mode?: "create";
}

interface EditEstablishmentFormProps {
  defaultValues: Partial<Establishment>;
  onSubmit: (data: UpdateEstablishmentFormData) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  mode: "edit";
}

type EstablishmentFormProps =
  CreateEstablishmentFormProps | EditEstablishmentFormProps;

export function EstablishmentForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Salvar",
  mode = "create",
}: EstablishmentFormProps) {
  const schema =
    mode === "edit" ? updateEstablishmentSchema : createEstablishmentSchema;

  const form = useForm<
    EstablishmentFormInput,
    unknown,
    UpdateEstablishmentFormData
  >({
    resolver: zodResolver(schema) as Resolver<
      EstablishmentFormInput,
      unknown,
      UpdateEstablishmentFormData
    >,
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      lat: defaultValues?.lat ?? undefined,
      lng: defaultValues?.lng ?? undefined,
      monthlyCost: defaultValues?.monthlyCost ?? undefined,
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
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do estabelecimento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Rua, número, bairro, cidade..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-23.5505"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lng"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-46.6333"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="monthlyCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo Mensal (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2500"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
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
