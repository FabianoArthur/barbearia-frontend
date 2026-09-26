import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateUserInfoSchema, type UpdateUserInfoFormData } from "../schemas";
import { useUserMutations } from "../hooks";
import * as barberService from "@/features/manager/barbers/services";
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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import type { User, Barber, Role } from "@/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "BARBER", label: "Barbeiro" },
  { value: "MANAGER", label: "Gerente" },
  { value: "SUPER_ADMIN", label: "Administrador" },
];

interface UserInfoTabProps {
  user: User;
  barber?: Barber;
  onSaved?: () => void;
}

export function UserInfoTab({ user, barber, onSaved }: UserInfoTabProps) {
  const { update } = useUserMutations();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<
    z.input<typeof updateUserInfoSchema>,
    unknown,
    UpdateUserInfoFormData
  >({
    resolver: zodResolver(updateUserInfoSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      commissionPercent: barber?.commissionPercent ?? 50,
    },
  });

  const selectedRole = form.watch("role");
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSubmit(data: UpdateUserInfoFormData) {
    setSubmitting(true);
    try {
      await update(user.id, {
        name: data.name,
        email: data.email,
        role: data.role,
      });

      if (barber && data.commissionPercent !== undefined) {
        await barberService.update(barber.id, {
          commissionPercent: data.commissionPercent,
        });
      }

      toast.success("Informacoes atualizadas!");
      onSaved?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarFallback className="bg-secondary text-primary font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                  disabled
                  title="Em breve"
                  aria-label="Alterar foto (em breve)"
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcao</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(selectedRole === "BARBER" || barber) && (
                <FormField
                  control={form.control}
                  name="commissionPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comissao (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          value={field.value ?? 50}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar Alteracoes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
