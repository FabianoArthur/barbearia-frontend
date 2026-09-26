import { api } from "@/lib/api";
import type { Client } from "@/types";
import type { CreateClientDto } from "./types";

export async function findAll(): Promise<Client[]> {
  const res = await api.get<Client[]>("/clients");
  return res.data;
}

export async function findById(id: string): Promise<Client> {
  const res = await api.get<Client>(`/clients/${id}`);
  return res.data;
}

export async function create(data: CreateClientDto): Promise<Client> {
  const res = await api.post<Client>("/clients", data);
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
