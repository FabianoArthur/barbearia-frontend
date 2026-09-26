import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "./hooks";
import { UserInfoTab } from "./components/UserInfoTab";
import {
  useBarberByUserId,
  useBarberServices,
  useSetBarberServices,
} from "@/features/manager/barbers/hooks";
import { AttachServiceDialog } from "@/features/manager/barbers/components/AttachServiceDialog";
import { useBarberAppointments } from "@/features/manager/appointments/hooks";
import {
  useWorkingHours,
  useTimeOff,
  useOverrides,
  useScheduleMutations,
} from "@/features/manager/schedule/hooks";
import { WorkingHoursForm } from "@/features/manager/schedule/components/WorkingHoursForm";
import { TimeOffForm } from "@/features/manager/schedule/components/TimeOffForm";
import { OverrideForm } from "@/features/manager/schedule/components/OverrideForm";
import type {
  WorkingHourFormData,
  TimeOffFormData,
  OverrideFormData,
} from "@/features/manager/schedule/schemas";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error-messages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Sparkles,
  UserCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/appointment-utils";

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: userLoading, mutate: mutateUser } = useUser(userId);
  const { barber, isLoading: barberLoading } = useBarberByUserId(
    user?.role === "BARBER" ? userId : undefined,
  );

  const isBarber = user?.role === "BARBER" && !!barber;

  if (userLoading || barberLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/manager/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <p className="text-muted-foreground">Usuario nao encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/manager/users")}
          aria-label="Voltar para usuarios"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
        {isBarber && (
          <Badge variant="outline" className="text-primary border-primary">
            {barber.commissionPercent}% comissao
          </Badge>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info" className="gap-1.5">
            <UserCircle className="h-4 w-4" />
            Informacoes
          </TabsTrigger>
          {isBarber && (
            <>
              <TabsTrigger value="appointments" className="gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-1.5">
                <Clock className="h-4 w-4" />
                Horarios
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Servicos
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="info">
          <UserInfoTab
            user={user}
            barber={isBarber ? barber : undefined}
            onSaved={() => mutateUser()}
          />
        </TabsContent>

        {isBarber && (
          <>
            <TabsContent value="appointments">
              <AppointmentsTab barberId={barber.id} />
            </TabsContent>

            <TabsContent value="hours">
              <HoursTab barberId={barber.id} />
            </TabsContent>

            <TabsContent value="services">
              <ServicesTab barberId={barber.id} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function AppointmentsTab({ barberId }: { barberId: string }) {
  const { appointments, isLoading } = useBarberAppointments(barberId);

  if (isLoading) return <Skeleton className="h-64" />;

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
          Nenhum agendamento encontrado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DATA/HORA</TableHead>
              <TableHead>CLIENTE</TableHead>
              <TableHead>SERVICO</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">VALOR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDateTime(appt.date)}
                </TableCell>
                <TableCell>{appt.clientName}</TableCell>
                <TableCell>{appt.serviceName}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[appt.status]}>
                    {STATUS_LABEL[appt.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(appt.serviceValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function HoursTab({ barberId }: { barberId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [whOpen, setWhOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [ovOpen, setOvOpen] = useState(false);

  const { workingHours, isLoading: whLoading } = useWorkingHours(barberId);
  const { timeOffs, isLoading: toLoading } = useTimeOff(barberId);
  const { overrides, isLoading: ovLoading } = useOverrides(barberId);
  const {
    addWorkingHour,
    removeWorkingHour,
    addTimeOff,
    removeTimeOff,
    addOverride,
    removeOverride,
  } = useScheduleMutations(barberId);

  async function handleAddWH(data: WorkingHourFormData) {
    setSubmitting(true);
    try {
      await addWorkingHour(data);
      toast.success("Horario adicionado!");
      setWhOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddTO(data: TimeOffFormData) {
    setSubmitting(true);
    try {
      await addTimeOff({
        ...data,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
      });
      toast.success("Folga registrada!");
      setToOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddOV(data: OverrideFormData) {
    setSubmitting(true);
    try {
      await addOverride(data);
      toast.success("Excecao criada!");
      setOvOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Tabs defaultValue="working-hours">
      <TabsList>
        <TabsTrigger value="working-hours">Horario Semanal</TabsTrigger>
        <TabsTrigger value="time-off">Folgas</TabsTrigger>
        <TabsTrigger value="overrides">Excecoes</TabsTrigger>
      </TabsList>

      <TabsContent value="working-hours" className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={whOpen} onOpenChange={setWhOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Horario</DialogTitle>
              </DialogHeader>
              <WorkingHoursForm
                barberId={barberId}
                onSubmit={handleAddWH}
                isLoading={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        {whLoading ? (
          <Skeleton className="h-32" />
        ) : workingHours.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum horario cadastrado.
          </p>
        ) : (
          <div className="space-y-2">
            {workingHours.map((wh) => (
              <Card key={wh.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{WEEKDAYS[wh.weekday]}</Badge>
                    <span className="text-sm">
                      {wh.startTime} - {wh.endTime}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeWorkingHour(wh.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="time-off" className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={toOpen} onOpenChange={setToOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Registrar Folga
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Folga</DialogTitle>
              </DialogHeader>
              <TimeOffForm
                barberId={barberId}
                onSubmit={handleAddTO}
                isLoading={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        {toLoading ? (
          <Skeleton className="h-32" />
        ) : timeOffs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma folga registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {timeOffs.map((to) => (
              <Card key={to.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div>
                    <span className="font-semibold">{formatDate(to.date)}</span>
                    {to.startTime && to.endTime && (
                      <span className="text-muted-foreground text-sm ml-2">
                        {to.startTime} - {to.endTime}
                      </span>
                    )}
                    {to.reason && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({to.reason})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTimeOff(to.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="overrides" className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={ovOpen} onOpenChange={setOvOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Criar Excecao
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Excecao</DialogTitle>
              </DialogHeader>
              <OverrideForm
                barberId={barberId}
                onSubmit={handleAddOV}
                isLoading={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>
        {ovLoading ? (
          <Skeleton className="h-32" />
        ) : overrides.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma excecao cadastrada.
          </p>
        ) : (
          <div className="space-y-2">
            {overrides.map((ov) => (
              <Card key={ov.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div>
                    <span className="font-semibold">
                      {formatDate(ov.startDate)} a {formatDate(ov.endDate)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {ov.startTime} - {ov.endTime}
                    </span>
                    {ov.reason && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({ov.reason})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeOverride(ov.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ServicesTab({ barberId }: { barberId: string }) {
  const { services, isLoading } = useBarberServices(barberId);
  const { setServices } = useSetBarberServices();
  const [attachOpen, setAttachOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDetach(serviceId: string) {
    setRemovingId(serviceId);
    try {
      const remaining = services
        .filter((s) => s.id !== serviceId)
        .map((s) => s.id);
      await setServices(barberId, remaining);
      toast.success("Servico desvinculado com sucesso");
    } catch {
      toast.error("Erro ao desvincular servico");
    } finally {
      setRemovingId(null);
    }
  }

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAttachOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Vincular Servico
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
            Nenhum servico vinculado a este barbeiro.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="py-4 px-5 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{service.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    disabled={removingId === service.id}
                    aria-label={`Remover ${service.name}`}
                    onClick={() => handleDetach(service.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.durationMinutes}min
                  </span>
                  <span className="font-medium text-primary">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AttachServiceDialog
        barberId={barberId}
        open={attachOpen}
        onOpenChange={setAttachOpen}
      />
    </div>
  );
}
