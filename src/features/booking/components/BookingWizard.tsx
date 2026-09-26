import { useState, useCallback } from "react";
import { addMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { EstablishmentSelector } from "./EstablishmentSelector";
import { BarberSelector } from "./BarberSelector";
import { ServiceSelector } from "./ServiceSelector";
import { SlotPicker } from "./SlotPicker";
import { ClientInfoForm } from "./ClientInfoForm";
import { CaptchaGate } from "./CaptchaGate";
import { useBooking } from "../hooks";
import { formatCurrency } from "@/lib/utils";
import type { PublicBookingFormData } from "../schemas";
import type { Establishment, Barber, Service, Appointment } from "@/types";
import {
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Copy,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

type Step =
  | "captcha"
  | "establishment"
  | "service"
  | "barber"
  | "date"
  | "slot"
  | "info"
  | "success";

const isProduction = import.meta.env.VITE_ENV === "production";

const today = () => new Date(new Date().setHours(0, 0, 0, 0));
const maxDate = () => addMonths(new Date(), 1);

export function BookingWizard() {
  const [step, setStep] = useState<Step>(
    isProduction ? "captcha" : "establishment",
  );
  const [establishment, setEstablishment] = useState<Establishment | null>(
    null,
  );
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] =
    useState<Appointment | null>(null);

  const { book, isBooking } = useBooking();

  const dateStr = date ? date.toISOString().split("T")[0] : undefined;

  const handleBack = useCallback(() => {
    const steps: Step[] = [
      ...(isProduction ? (["captcha"] as const) : []),
      "establishment",
      "service",
      "barber",
      "date",
      "slot",
      "info",
    ];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }, [step]);

  const buildStartsAt = useCallback((): string | null => {
    if (!date || !slot) return null;
    const [hours, minutes] = slot.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(hours, minutes, 0, 0);
    return dt.toISOString();
  }, [date, slot]);

  const handleSubmit = useCallback(
    async (formData: PublicBookingFormData) => {
      if (!establishment || !barber || !service || !slot) return;
      const startsAt = buildStartsAt();
      if (!startsAt) return;

      try {
        const result = await book({
          establishmentId: establishment.id,
          barberId: barber.id,
          serviceId: service.id,
          startsAt,
          clientName: formData.clientName,
          clientCpf: formData.clientCpf,
          clientPhone: formData.clientPhone,
        });
        setBookedAppointment(result);
        setStep("success");
        toast.success("Agendamento realizado com sucesso!");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
    },
    [establishment, barber, service, slot, book, buildStartsAt],
  );

  const resetWizard = useCallback(() => {
    setStep(isProduction ? "captcha" : "establishment");
    setEstablishment(null);
    setBarber(null);
    setService(null);
    setDate(undefined);
    setSlot(null);
    setBookedAppointment(null);
  }, []);

  const handleCopyCode = useCallback(() => {
    if (bookedAppointment?.code) {
      navigator.clipboard.writeText(bookedAppointment.code);
      toast.success("Codigo copiado!");
    }
  }, [bookedAppointment]);

  if (step === "success") {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center">
        <CardContent className="py-12 space-y-6">
          <CheckCircle2 className="h-16 w-16 text-chart-2 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Agendamento Realizado!
          </h2>

          {bookedAppointment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Local:</span>{" "}
                  <span className="font-semibold">{establishment?.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Profissional:</span>{" "}
                  <span className="font-semibold">{barber?.user?.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Servico:</span>{" "}
                  <span className="font-semibold">
                    {service?.name}
                    {service?.price != null &&
                      ` — ${formatCurrency(service.price)}`}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Data/Hora:</span>{" "}
                  <span className="font-semibold">
                    {date?.toLocaleDateString("pt-BR")} - {slot ?? ""}
                  </span>
                </p>
                {service?.notes && (
                  <p>
                    <span className="text-muted-foreground">Obs:</span>{" "}
                    <span className="text-xs">{service.notes}</span>
                  </p>
                )}
              </div>

              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Codigo do Agendamento
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono font-bold text-foreground">
                    {bookedAppointment.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  Guarde este codigo! Voce precisara dele para confirmar,
                  reagendar ou cancelar o agendamento.
                </span>
              </div>
            </div>
          )}

          <Button onClick={resetWizard} className="mt-4">
            Novo Agendamento
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stepTitle: Record<Exclude<Step, "success">, string> = {
    captcha: "Verificacao de Seguranca",
    establishment: "Selecione o Estabelecimento",
    service: "Selecione o Servico",
    barber: "Selecione o Profissional",
    date: "Escolha a Data",
    slot: "Escolha o Horario",
    info: "Seus Dados",
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-primary text-lg uppercase tracking-widest">
          {stepTitle[step]}
        </CardTitle>
      </CardHeader>

      {step !== "captcha" && step !== "establishment" && (
        <div className="px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>
      )}

      <Separator />

      <CardContent className="pt-6 pb-8 px-6">
        {step === "captcha" && (
          <CaptchaGate onVerified={() => setStep("establishment")} />
        )}

        {step === "establishment" && (
          <EstablishmentSelector
            selected={establishment}
            onSelect={(est) => {
              setEstablishment(est);
              setService(null);
              setBarber(null);
              setDate(undefined);
              setSlot(null);
              setStep("service");
            }}
          />
        )}

        {step === "service" && establishment && (
          <ServiceSelector
            establishmentId={establishment.id}
            selected={service}
            onSelect={(svc) => {
              setService(svc);
              setBarber(null);
              setDate(undefined);
              setSlot(null);
              setStep("barber");
            }}
          />
        )}

        {step === "barber" && establishment && service && (
          <BarberSelector
            establishmentId={establishment.id}
            serviceId={service.id}
            selected={barber}
            onSelect={(b) => {
              setBarber(b);
              setDate(undefined);
              setSlot(null);
              setStep("date");
            }}
          />
        )}

        {step === "date" && (
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setSlot(null);
                if (d) setStep("slot");
              }}
              disabled={(d) => d < today() || d > maxDate()}
              className="rounded-md border"
            />
          </div>
        )}

        {step === "slot" && barber && service && dateStr && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {date?.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <SlotPicker
              barberId={barber.id}
              date={dateStr}
              serviceId={service.id}
              selectedSlot={slot}
              onSelect={(s) => {
                setSlot(s);
                setStep("info");
              }}
            />
          </div>
        )}

        {step === "info" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Local:</span>{" "}
                <span className="font-semibold">{establishment?.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Profissional:</span>{" "}
                <span className="font-semibold">{barber?.user?.name}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Servico:</span>{" "}
                <span className="font-semibold">
                  {service?.name}
                  {service?.price != null &&
                    ` — ${formatCurrency(service.price)}`}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Data/Hora:</span>{" "}
                <span className="font-semibold">
                  {date?.toLocaleDateString("pt-BR")} - {slot ?? ""}
                </span>
              </p>
            </div>

            <Separator />

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Nao e necessario criar conta. Apenas preencha seus dados abaixo
                para confirmar o agendamento.
              </span>
            </div>

            <ClientInfoForm onSubmit={handleSubmit} isSubmitting={isBooking} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
