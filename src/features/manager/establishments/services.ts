import { api } from "@/lib/api";
import type { Establishment } from "@/types";
import type { CreateEstablishmentDto, UpdateEstablishmentDto } from "./types";

export async function findAll(): Promise<Establishment[]> {
  const res = await api.get<Establishment[]>("/establishments");
  return res.data;
}

export async function findById(id: string): Promise<Establishment> {
  const res = await api.get<Establishment>(`/establishments/${id}`);
  return res.data;
}

export async function create(
  data: CreateEstablishmentDto,
): Promise<Establishment> {
  const res = await api.post<Establishment>("/establishments", data);
  return res.data;
}

export async function update(
  id: string,
  data: UpdateEstablishmentDto,
): Promise<Establishment> {
  const res = await api.patch<Establishment>(`/establishments/${id}`, data);
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/establishments/${id}`);
}
