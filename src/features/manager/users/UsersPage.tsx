import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEstablishmentStore } from "@/stores/useEstablishmentStore";
import { useAuth } from "@/features/auth/context";
import { useUsers, useUserMutations } from "./hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import { CreateUserForm } from "./components/CreateUserForm";
import type { CreateUserFormData } from "./schemas";
import type { Role } from "@/types";
import type { SortByField, SortOrder, UserQueryParams } from "./types";

const ROLE_OPTIONS: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "BARBER", label: "Barbeiro" },
  { value: "MANAGER", label: "Gerente" },
  { value: "SUPER_ADMIN", label: "Administrador" },
];

const ROLE_LABELS: Record<Role, string> = {
  BARBER: "Barbeiro",
  MANAGER: "Gerente",
  SUPER_ADMIN: "Admin",
};

const ROLE_VARIANT: Record<Role, "default" | "secondary" | "outline"> = {
  BARBER: "outline",
  MANAGER: "secondary",
  SUPER_ADMIN: "default",
};

const SORT_OPTIONS: { value: SortByField; label: string }[] = [
  { value: "name", label: "Nome" },
  { value: "role", label: "Funcao" },
  { value: "createdAt", label: "Data de Criacao" },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEstablishmentId } = useEstablishmentStore();
  const establishmentId = selectedEstablishmentId ?? user?.establishmentId;
  const { create } = useUserMutations();

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortByField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [committed, setCommitted] = useState({
    search: "",
    role: "ALL" as Role | "ALL",
  });

  const queryParams = useMemo<UserQueryParams>(() => {
    const params: UserQueryParams = {
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    if (establishmentId) params.establishmentId = establishmentId;
    if (committed.role !== "ALL") params.role = committed.role;
    if (committed.search.trim()) params.search = committed.search.trim();
    return params;
  }, [establishmentId, committed, page, sortBy, sortOrder]);

  const { users, meta, isLoading } = useUsers(queryParams);

  const handleSearch = useCallback(() => {
    setPage(1);
    setCommitted({ search: searchInput, role: roleFilter });
  }, [searchInput, roleFilter]);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setRoleFilter("ALL");
    setCommitted({ search: "", role: "ALL" });
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }, []);

  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value as SortByField);
    setPage(1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handleCreate = useCallback(
    async (data: CreateUserFormData) => {
      setSubmitting(true);
      try {
        await create(data);
        toast.success("Usuario criado com sucesso!");
        setCreateOpen(false);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
    [create],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Usuarios</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Usuario</DialogTitle>
            </DialogHeader>
            <CreateUserForm
              establishmentId={establishmentId ?? ""}
              onSubmit={handleCreate}
              isLoading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-primary text-base">
            Lista de Usuarios
          </CardTitle>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                placeholder="Buscar por nome..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-52"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Funcao</Label>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as Role | "ALL")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Ordenar por
              </Label>
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              title={sortOrder === "asc" ? "Crescente" : "Decrescente"}
              aria-label={`Ordem ${sortOrder === "asc" ? "crescente" : "decrescente"}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Nenhum usuario encontrado.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NOME</TableHead>
                    <TableHead>E-MAIL</TableHead>
                    <TableHead>FUNCAO</TableHead>
                    <TableHead>CADASTRO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/manager/users/${u.id}`)}
                    >
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role]}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {meta.currentPage} de {meta.totalPages} (
                    {meta.totalItems} usuarios)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.currentPage >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Proximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
