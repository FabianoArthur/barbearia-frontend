import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { formatCurrency, cn } from "@/lib/utils";
import { isLate, STATUS_LABEL, STATUS_VARIANT } from "@/lib/appointment-utils";
import type { AppointmentListItem, AppointmentStatus } from "@/types";
import { Play, UserX, CheckCircle, Loader2, MessageCircle } from "lucide-react";

type NotificationType = "confirmation" | "reminder";

interface AgendaTableProps {
  appointments: AppointmentListItem[];
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
  onSendNotification: (id: string, type: NotificationType) => Promise<void>;
}

interface StatusAction {
  label: string;
  targetStatus: AppointmentStatus;
  icon: typeof Play;
  variant: "outline" | "destructive" | "default";
  className?: string;
}

function getActionsForStatus(status: AppointmentStatus): StatusAction[] {
  switch (status) {
    case "CONFIRMED":
    case "SCHEDULED":
      return [
        {
          label: "Iniciar",
          targetStatus: "IN_PROGRESS",
          icon: Play,
          variant: "outline",
          className: "text-chart-2 border-chart-2 hover:bg-chart-2/10",
        },
        {
          label: "Nao Compareceu",
          targetStatus: "NO_SHOW",
          icon: UserX,
          variant: "destructive",
        },
      ];
    case "IN_PROGRESS":
      return [
        {
          label: "Concluir",
          targetStatus: "DONE",
          icon: CheckCircle,
          variant: "outline",
          className: "text-chart-2 border-chart-2 hover:bg-chart-2/10",
        },
      ];
    default:
      return [];
  }
}

const confirmMessages: Record<string, { title: string; description: string }> =
  {
    IN_PROGRESS: {
      title: "Iniciar Atendimento",
      description:
        "Deseja iniciar o atendimento deste cliente? O status sera alterado para 'Em Atendimento'.",
    },
    DONE: {
      title: "Concluir Atendimento",
      description: "Deseja marcar este atendimento como concluido?",
    },
    NO_SHOW: {
      title: "Marcar como Nao Compareceu",
      description:
        "Deseja marcar que o cliente nao compareceu? Esta acao nao pode ser desfeita facilmente.",
    },
    SEND_CONFIRMATION: {
      title: "Enviar Confirmacao via WhatsApp",
      description:
        "Deseja enviar a confirmacao via WhatsApp para este cliente?",
    },
    SEND_REMINDER: {
      title: "Enviar Lembrete via WhatsApp",
      description: "Deseja enviar o lembrete via WhatsApp para este cliente?",
    },
  };

type DialogAction = AppointmentStatus | "SEND_CONFIRMATION" | "SEND_REMINDER";

export function AgendaTable({
  appointments,
  onStatusChange,
  onSendNotification,
}: AgendaTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    appointmentId: string;
    targetStatus: DialogAction;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog) return;
    setLoadingId(confirmDialog.appointmentId);
    try {
      if (confirmDialog.targetStatus === "SEND_CONFIRMATION") {
        await onSendNotification(confirmDialog.appointmentId, "confirmation");
      } else if (confirmDialog.targetStatus === "SEND_REMINDER") {
        await onSendNotification(confirmDialog.appointmentId, "reminder");
      } else {
        await onStatusChange(
          confirmDialog.appointmentId,
          confirmDialog.targetStatus,
        );
      }
    } finally {
      setLoadingId(null);
      setConfirmDialog(null);
    }
  }, [confirmDialog, onStatusChange, onSendNotification]);

  if (appointments.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum agendamento para hoje.
      </p>
    );
  }

  const dialogInfo = confirmDialog
    ? confirmMessages[confirmDialog.targetStatus]
    : null;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">HORA</TableHead>
            <TableHead>CLIENTE</TableHead>
            <TableHead>SERVICO</TableHead>
            <TableHead>VALOR</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead className="text-right">ACAO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appt) => {
            const time = new Date(appt.date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const actions = getActionsForStatus(appt.status);
            const isLoading = loadingId === appt.id;
            const late = isLate(appt);

            return (
              <TableRow
                key={appt.id}
                className={cn(late && "bg-destructive/5")}
              >
                <TableCell className="font-bold text-primary">
                  <div className="flex items-center gap-2">
                    {time}
                    <CountdownBadge appointment={appt} />
                  </div>
                </TableCell>
                <TableCell>{appt.clientName}</TableCell>
                <TableCell>{appt.serviceName}</TableCell>
                <TableCell>{formatCurrency(appt.serviceValue)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[appt.status]}>
                    {STATUS_LABEL[appt.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {appt.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-600/10"
                        disabled={isLoading}
                        title="Enviar Confirmacao via WhatsApp"
                        onClick={() =>
                          setConfirmDialog({
                            appointmentId: appt.id,
                            targetStatus: "SEND_CONFIRMATION",
                          })
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <MessageCircle className="h-3 w-3 mr-1" />
                        )}
                        WhatsApp
                      </Button>
                    )}
                    {appt.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-600/10"
                        disabled={isLoading}
                        title="Enviar Lembrete via WhatsApp"
                        onClick={() =>
                          setConfirmDialog({
                            appointmentId: appt.id,
                            targetStatus: "SEND_REMINDER",
                          })
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <MessageCircle className="h-3 w-3 mr-1" />
                        )}
                        Lembrete
                      </Button>
                    )}
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.targetStatus}
                          size="sm"
                          variant={action.variant}
                          className={action.className}
                          disabled={isLoading}
                          onClick={() =>
                            setConfirmDialog({
                              appointmentId: appt.id,
                              targetStatus: action.targetStatus,
                            })
                          }
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Icon className="h-3 w-3 mr-1" />
                          )}
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogInfo?.title}</DialogTitle>
            <DialogDescription>{dialogInfo?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
              disabled={!!loadingId}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!!loadingId}>
              {loadingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
