import { api } from "@/lib/api";
import type { Service } from "@/types";
import type { CreateServiceDto, UpdateServiceDto } from "./types";

export async function findAll(): Promise<Service[]> {
  const res = await api.get<Service[]>("/services");
  return res.data;
}

export async function findByEstablishment(
  establishmentId: string,
): Promise<Service[]> {
  const res = await api.get<Service[]>(
    `/services/establishment/${establishmentId}`,
  );
  return res.data;
}

export async function findById(id: string): Promise<Service> {
  const res = await api.get<Service>(`/services/${id}`);
  return res.data;
}

export async function create(data: CreateServiceDto): Promise<Service> {
  const res = await api.post<Service>("/services", data);
  return res.data;
}

export async function update(
  id: string,
  data: UpdateServiceDto,
): Promise<Service> {
  const res = await api.patch<Service>(`/services/${id}`, data);
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
