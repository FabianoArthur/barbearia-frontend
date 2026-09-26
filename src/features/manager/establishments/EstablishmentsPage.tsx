import { useState } from "react";
import { useEstablishments, useEstablishmentMutations } from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EstablishmentForm } from "./components/EstablishmentForm";
import { formatCurrency } from "@/lib/utils";
import { Plus, Store, Trash2, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type {
  CreateEstablishmentFormData,
  UpdateEstablishmentFormData,
} from "./schemas";
import type { Establishment } from "@/types";

const generateMapsLink = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

export default function EstablishmentsPage() {
  const { establishments, isLoading } = useEstablishments();
  const { createEstablishment, updateEstablishment, deleteEstablishment } =
    useEstablishmentMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] =
    useState<Establishment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (data: CreateEstablishmentFormData) => {
    setSubmitting(true);
    try {
      await createEstablishment(data);
      toast.success("Estabelecimento criado!");
      setCreateOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: UpdateEstablishmentFormData) => {
    if (!editingEstablishment) return;
    setSubmitting(true);
    try {
      await updateEstablishment(editingEstablishment.id, data);
      toast.success("Estabelecimento atualizado!");
      setEditingEstablishment(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    try {
      await deleteEstablishment(id);
      toast.success("Estabelecimento excluido.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Estabelecimentos</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Estabelecimento</DialogTitle>
            </DialogHeader>
            <EstablishmentForm
              onSubmit={handleCreate}
              isLoading={submitting}
              submitLabel="Criar"
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : establishments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum estabelecimento cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {establishments.map((est) => (
            <Card key={est.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{est.name}</CardTitle>
                    {est.address && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {est.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEstablishment(est)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(est.id, est.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {est.monthlyCost != null && (
                    <p>
                      Custo mensal:{" "}
                      <span className="text-foreground font-semibold">
                        {formatCurrency(est.monthlyCost)}
                      </span>
                    </p>
                  )}
                  {est.lat != null && est.lng != null && (
                    <a
                      href={generateMapsLink(est.lat, est.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Ver no mapa
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editingEstablishment !== null}
        onOpenChange={(open) => !open && setEditingEstablishment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estabelecimento</DialogTitle>
          </DialogHeader>
          {editingEstablishment && (
            <EstablishmentForm
              mode="edit"
              defaultValues={editingEstablishment}
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
