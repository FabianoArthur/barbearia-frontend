import { api } from "@/lib/api";
import type { Barber, PaginatedResponse, User } from "@/types";
import type { CreateUserDto, UpdateUserDto, UserQueryParams } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function findAll(
  params?: UserQueryParams,
): Promise<PaginatedResponse<User>> {
  const res = await api.get<PaginatedResponse<User>>("/users", { params });
  return res.data;
}

export async function findById(id: string): Promise<User> {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

function getCsrfToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];
}

export async function createUser(data: CreateUserDto): Promise<User> {
  const { commissionPercent, ...registerData } = data;

  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers,
    credentials: "omit",
    body: JSON.stringify(registerData),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Erro ao criar usuario (${res.status})`);
  }

  const { user } = (await res.json()) as { user: User };

  if (data.role === "BARBER" && data.establishmentId) {
    await api.post<Barber>("/barbers", {
      userId: user.id,
      establishmentId: data.establishmentId,
      commissionPercent: commissionPercent ?? 50,
    });
  }

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUserDto,
): Promise<User> {
  const res = await api.patch<User>(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
