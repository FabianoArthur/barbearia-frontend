import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentCodeSchema, type AppointmentCodeFormData } from "./schemas";
import {
  useConfirmAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
} from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

type ActionType = "confirm" | "cancel" | "reschedule";
type PageState = "code-entry" | "action-select" | "reschedule-form" | "success";

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const SUCCESS_MESSAGES: Record<
  ActionType,
  { title: string; description: string }
> = {
  confirm: {
    title: "Agendamento Confirmado!",
    description:
      "Seu agendamento foi confirmado com sucesso. Esperamos voce no horario marcado!",
  },
  cancel: {
    title: "Agendamento Cancelado",
    description: "Seu agendamento foi cancelado com sucesso.",
  },
  reschedule: {
    title: "Agendamento Reagendado!",
    description:
      "Seu agendamento foi reagendado com sucesso. Confira o novo horario.",
  },
};

export default function ConfirmationPage() {
  const { code: urlCode } = useParams<{ code?: string }>();
  const [pageState, setPageState] = useState<PageState>(
    urlCode ? "action-select" : "code-entry",
  );
  const [bookingCode, setBookingCode] = useState(urlCode ?? "");
  const [completedAction, setCompletedAction] = useState<ActionType>("confirm");
  const [isProcessing, setIsProcessing] = useState(false);

  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState("");

  const { confirm } = useConfirmAppointment();
  const { cancel } = useCancelAppointment();
  const { reschedule } = useRescheduleAppointment();

  const form = useForm<AppointmentCodeFormData>({
    resolver: zodResolver(appointmentCodeSchema),
    defaultValues: { code: urlCode ?? "" },
  });

  const onCodeSubmit = useCallback((data: AppointmentCodeFormData) => {
    setBookingCode(data.code);
    setPageState("action-select");
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    try {
      await confirm({ code: bookingCode });
      setCompletedAction("confirm");
      setPageState("success");
      toast.success("Agendamento confirmado!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }, [confirm, bookingCode]);

  const handleCancel = useCallback(async () => {
    setIsProcessing(true);
    try {
      await cancel({ code: bookingCode });
      setCompletedAction("cancel");
      setPageState("success");
      toast.success("Agendamento cancelado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }, [cancel, bookingCode]);

  const handleRescheduleSubmit = useCallback(async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Selecione uma data e horario.");
      return;
    }

    const [hours, minutes] = rescheduleTime.split(":").map(Number);
    const dateTime = new Date(rescheduleDate);
    dateTime.setHours(hours, minutes, 0, 0);

    setIsProcessing(true);
    try {
      await reschedule({
        code: bookingCode,
        startsAt: dateTime.toISOString(),
      });
      setCompletedAction("reschedule");
      setPageState("success");
      toast.success("Agendamento reagendado!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }, [reschedule, bookingCode, rescheduleDate, rescheduleTime]);

  const handleBack = useCallback(() => {
    if (pageState === "reschedule-form") {
      setPageState("action-select");
    } else if (pageState === "action-select") {
      setPageState("code-entry");
      setBookingCode("");
      form.reset({ code: "" });
    }
  }, [pageState, form]);

  const handleReset = useCallback(() => {
    setPageState("code-entry");
    setBookingCode("");
    setRescheduleDate(undefined);
    setRescheduleTime("");
    form.reset({ code: "" });
  }, [form]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = addMonths(new Date(), 1);

  if (pageState === "success") {
    const msg = SUCCESS_MESSAGES[completedAction];
    const SuccessIcon = completedAction === "cancel" ? XCircle : CheckCircle2;
    const iconColor =
      completedAction === "cancel" ? "text-destructive" : "text-chart-2";

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="max-w-md w-full mx-auto text-center">
          <CardContent className="py-12 space-y-4">
            <SuccessIcon className={`h-16 w-16 ${iconColor} mx-auto`} />
            <h2 className="text-2xl font-bold text-foreground">{msg.title}</h2>
            <p className="text-muted-foreground">{msg.description}</p>
            <Button variant="outline" onClick={handleReset} className="mt-4">
              Voltar ao inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-primary text-lg uppercase tracking-widest">
            Gerenciar Agendamento
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {pageState === "code-entry" &&
              "Informe o codigo do agendamento para continuar."}
            {pageState === "action-select" &&
              "Escolha o que deseja fazer com seu agendamento."}
            {pageState === "reschedule-form" &&
              "Selecione a nova data e horario."}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Back button */}
          {(pageState === "action-select" ||
            pageState === "reschedule-form") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 -ml-2"
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}

          {/* Step 1: Code entry */}
          {pageState === "code-entry" && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCodeSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codigo do Agendamento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cole o codigo recebido"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full font-bold uppercase tracking-wider"
                >
                  Continuar
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Action selection */}
          {pageState === "action-select" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground mb-4">
                <span className="font-medium text-foreground">Codigo:</span>{" "}
                {bookingCode}
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full justify-start gap-3 h-14"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <div className="text-left">
                  <p className="font-bold">Confirmar Agendamento</p>
                  <p className="text-xs opacity-80">
                    Confirme sua presenca no horario marcado
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => setPageState("reschedule-form")}
                variant="secondary"
                className="w-full justify-start gap-3 h-14"
                disabled={isProcessing}
              >
                <CalendarClock className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-bold">Reagendar</p>
                  <p className="text-xs opacity-80">
                    Altere a data e horario do agendamento
                  </p>
                </div>
              </Button>

              <Button
                onClick={handleCancel}
                variant="destructive"
                className="w-full justify-start gap-3 h-14"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="text-left">
                  <p className="font-bold">Cancelar Agendamento</p>
                  <p className="text-xs opacity-80">
                    Cancele o agendamento definitivamente
                  </p>
                </div>
              </Button>

              <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground mt-4">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  O cancelamento e definitivo e nao pode ser desfeito.
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Reschedule form */}
          {pageState === "reschedule-form" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Codigo:</span>{" "}
                {bookingCode}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nova Data
                </label>
                <DatePicker
                  date={rescheduleDate}
                  onDateChange={setRescheduleDate}
                  disabled={(d) => d < today || d > maxDate}
                  placeholder="Selecione uma data"
                  locale={ptBR}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Novo Horario
                </label>
                <Select
                  value={rescheduleTime}
                  onValueChange={setRescheduleTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  O horario escolhido sera validado. Se houver conflito, voce
                  sera informado.
                </span>
              </div>

              <Button
                onClick={handleRescheduleSubmit}
                className="w-full font-bold uppercase tracking-wider"
                disabled={isProcessing || !rescheduleDate || !rescheduleTime}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  "Reagendar"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
