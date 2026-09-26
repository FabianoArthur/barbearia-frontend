import { useState } from "react";
import { useAuth } from "@/features/auth/context";
import { useBarbers, useBarberMutations } from "./hooks";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarberForm } from "./components/BarberForm";
import { AddBarberForm } from "./components/AddBarberForm";
import { BarberServicesSection } from "./components/BarberServicesSection";
import { Trash2, Pencil, Scissors, Plus } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type { UpdateBarberFormData, AddBarberFormData } from "./schemas";

export default function BarbersPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const activeEstId = selectedEstablishmentId ?? undefined;

  const { barbers, isLoading } = useBarbers(activeEstId);
  const { addBarber, updateBarber, deleteBarber } =
    useBarberMutations(activeEstId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (data: AddBarberFormData) => {
    setSubmitting(true);
    try {
      await addBarber(data);
      toast.success("Barbeiro adicionado!");
      setAddOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: UpdateBarberFormData) => {
    setSubmitting(true);
    try {
      await updateBarber(id, data);
      toast.success("Barbeiro atualizado!");
      setEditingId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return;
    try {
      await deleteBarber(id);
      toast.success("Barbeiro removido.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Barbeiros</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Barbeiro</DialogTitle>
            </DialogHeader>
            <AddBarberForm
              establishmentId={activeEstId ?? user?.establishmentId ?? ""}
              onSubmit={handleAdd}
              isLoading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum barbeiro cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarFallback className="bg-secondary text-primary font-bold text-lg">
                    {barber.user?.name?.charAt(0) ?? "B"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {barber.user?.name ?? "Barbeiro"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {barber.user?.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
                  <Scissors className="h-3 w-3 mr-1" />
                  {barber.commissionPercent}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarberServicesSection barberId={barber.id} />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(barber.id)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleDelete(barber.id, barber.user?.name ?? "")
                    }
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardContent>

              <Dialog
                open={editingId === barber.id}
                onOpenChange={(open) => !open && setEditingId(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar {barber.user?.name}</DialogTitle>
                  </DialogHeader>
                  <BarberForm
                    defaultCommission={barber.commissionPercent}
                    onSubmit={(data) => handleUpdate(barber.id, data)}
                    isLoading={submitting}
                  />
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
