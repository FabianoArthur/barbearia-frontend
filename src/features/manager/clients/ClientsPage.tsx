import { useAuth } from "@/features/auth/context";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useClients, useClientMutations } from "./hooks";
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
import { Skeleton } from "@/components/ui/skeleton";
import { maskCpf } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";

export default function ClientsPage() {
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  // undefined = "All" (fetch all clients), string = specific establishment
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;
  const { clients, isLoading } = useClients(establishmentId);
  const { deleteClient } = useClientMutations();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir cliente "${name}"?`)) return;
    try {
      await deleteClient(id);
      toast.success("Cliente removido.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Clientes</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum cliente cadastrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">NOME</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>TELEFONE</TableHead>
                <TableHead className="text-right">ACAO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-semibold">{client.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {maskCpf(client.cpf)}
                  </TableCell>
                  <TableCell>{client.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client.id, client.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
