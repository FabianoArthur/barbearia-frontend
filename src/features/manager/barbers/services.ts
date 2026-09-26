import { api } from "@/lib/api";
import type { Barber, AuthResponse } from "@/types";
import type { CreateBarberDto, UpdateBarberDto, AddBarberDto } from "./types";

export async function findAll(): Promise<Barber[]> {
  const res = await api.get<Barber[]>("/barbers");
  return res.data;
}

export async function findByEstablishment(
  establishmentId: string,
): Promise<Barber[]> {
  const res = await api.get<Barber[]>(
    `/barbers/establishment/${establishmentId}`,
  );
  return res.data;
}

export async function findById(id: string): Promise<Barber> {
  const res = await api.get<Barber>(`/barbers/${id}`);
  return res.data;
}

export async function create(data: CreateBarberDto): Promise<Barber> {
  const res = await api.post<Barber>("/barbers", data);
  return res.data;
}

export async function registerAndCreateBarber(
  data: AddBarberDto,
): Promise<Barber> {
  // 1. Register the user with role BARBER
  const registerRes = await api.post<AuthResponse>("/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
    role: "BARBER",
    establishmentId: data.establishmentId,
  });

  // 2. Create the barber profile linked to the establishment
  const barberRes = await api.post<Barber>("/barbers", {
    userId: registerRes.data.user.id,
    establishmentId: data.establishmentId,
    commissionPercent: data.commissionPercent,
  });

  return barberRes.data;
}

export async function update(
  id: string,
  data: UpdateBarberDto,
): Promise<Barber> {
  const res = await api.patch<Barber>(`/barbers/${id}`, data);
  return res.data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/barbers/${id}`);
}

export async function setBarberServices(
  barberId: string,
  serviceIds: string[],
): Promise<void> {
  await api.put(`/barbers/${barberId}/services`, { serviceIds });
}
