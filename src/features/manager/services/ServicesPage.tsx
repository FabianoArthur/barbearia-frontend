import { useState } from "react";
import { useAuth } from "@/features/auth/context";
import { useServices, useServiceMutations } from "./hooks";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceForm } from "./components/ServiceForm";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { CreateServiceFormData, UpdateServiceFormData } from "./schemas";
import type { Service } from "@/types";

export default function ServicesPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const activeEstId = selectedEstablishmentId ?? undefined;

  const { services, isLoading } = useServices(activeEstId);
  const { createService, updateService, deleteService } =
    useServiceMutations(activeEstId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEstablishmentId = activeEstId ?? user?.establishmentId ?? "";

  const handleCreate = async (data: CreateServiceFormData) => {
    setSubmitting(true);
    try {
      await createService(data);
      toast.success("Servico criado!");
      setCreateOpen(false);
    } catch {
      toast.error("Erro ao criar servico.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: UpdateServiceFormData) => {
    if (!editingService) return;
    setSubmitting(true);
    try {
      await updateService(editingService.id, data);
      toast.success("Servico atualizado!");
      setEditingService(null);
    } catch {
      toast.error("Erro ao atualizar servico.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir servico "${name}"?`)) return;
    try {
      await deleteService(id);
      toast.success("Servico excluido.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Servicos</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Servico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Servico</DialogTitle>
            </DialogHeader>
            <ServiceForm
              establishmentId={activeEstablishmentId}
              onSubmit={handleCreate}
              isLoading={submitting}
              submitLabel="Criar"
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum servico cadastrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">SERVICO</TableHead>
                <TableHead>DURACAO</TableHead>
                <TableHead>PRECO</TableHead>
                <TableHead className="text-right">ACOES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell>{s.durationMinutes} min</TableCell>
                  <TableCell className="text-primary font-bold">
                    {formatCurrency(s.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingService(s)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(s.id, s.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editingService !== null}
        onOpenChange={(open) => !open && setEditingService(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servico</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              mode="edit"
              defaultValues={editingService}
              onSubmit={handleUpdate}
              isLoading={submitting}
              submitLabel="Salvar"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
