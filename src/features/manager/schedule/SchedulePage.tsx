import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/context";
import { useBarbers } from "@/features/manager/barbers/hooks";
import { formatDate } from "@/lib/date-utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import { OverrideForm } from "./components/OverrideForm";
import { TimeOffForm } from "./components/TimeOffForm";
import { WorkingHoursForm } from "./components/WorkingHoursForm";
import {
  useOverrides,
  useScheduleMutations,
  useTimeOff,
  useWorkingHours,
} from "./hooks";
import type {
  OverrideFormData,
  TimeOffFormData,
  WorkingHourFormData,
} from "./schemas";

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

export default function SchedulePage() {
  const { user } = useAuth();
  const { barbers } = useBarbers(user?.establishmentId);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [whOpen, setWhOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [ovOpen, setOvOpen] = useState(false);

  const { workingHours, isLoading: whLoading } = useWorkingHours(
    selectedBarberId || undefined,
  );
  const { timeOffs, isLoading: toLoading } = useTimeOff(
    selectedBarberId || undefined,
  );
  const { overrides, isLoading: ovLoading } = useOverrides(
    selectedBarberId || undefined,
  );
  const {
    addWorkingHour,
    removeWorkingHour,
    addTimeOff,
    removeTimeOff,
    addOverride,
    removeOverride,
  } = useScheduleMutations(selectedBarberId || undefined);

  const handleAddWH = async (data: WorkingHourFormData) => {
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
  };

  const handleAddTO = async (data: TimeOffFormData) => {
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
  };

  const handleAddOV = async (data: OverrideFormData) => {
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Horarios</h1>

      <div className="max-w-xs">
        <label className="text-sm text-muted-foreground font-bold mb-1 block">
          Barbeiro
        </label>
        <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um barbeiro" />
          </SelectTrigger>
          <SelectContent>
            {barbers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.user?.name ?? "Barbeiro"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedBarberId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione um barbeiro para gerenciar horarios.
          </CardContent>
        </Card>
      ) : (
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
                    barberId={selectedBarberId}
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
                    barberId={selectedBarberId}
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
                        <span className="font-semibold">
                          {formatDate(to.date)}
                        </span>
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
                    barberId={selectedBarberId}
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
      )}
    </div>
  );
}
