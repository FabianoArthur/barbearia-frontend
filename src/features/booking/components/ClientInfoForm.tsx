import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicBookingSchema, type PublicBookingFormData } from "../schemas";
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
import { formatCpfInput, formatPhone } from "@/lib/utils";
import { Loader2, MessageCircle } from "lucide-react";

interface ClientInfoFormProps {
  onSubmit: (data: PublicBookingFormData) => void;
  isSubmitting: boolean;
}

export function ClientInfoForm({
  onSubmit,
  isSubmitting,
}: ClientInfoFormProps) {
  const form = useForm<PublicBookingFormData>({
    resolver: zodResolver(publicBookingSchema),
    defaultValues: {
      clientName: "",
      clientCpf: "",
      clientPhone: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  autoCapitalize="words"
                  className="text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientCpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="text-base"
                  {...field}
                  onChange={(e) =>
                    field.onChange(formatCpfInput(e.target.value))
                  }
                  maxLength={14}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (WhatsApp)</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  className="text-base"
                  {...field}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
          <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
          <span>
            O WhatsApp sera usado para enviar a confirmacao do agendamento.
          </span>
        </div>

        <Button
          type="submit"
          className="w-full font-bold uppercase tracking-wider"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Agendando...
            </>
          ) : (
            "Confirmar Agendamento"
          )}
        </Button>
      </form>
    </Form>
  );
}
