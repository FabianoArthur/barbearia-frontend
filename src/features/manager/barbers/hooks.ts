import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/api";
import type { Barber, Service } from "@/types";
import * as barberService from "./services";
import type { CreateBarberDto, UpdateBarberDto, AddBarberDto } from "./types";

const ALL_BARBERS_KEY = "/barbers";

function establishmentKey(id: string) {
  return `/barbers/establishment/${id}`;
}

export function useBarbers(establishmentId: string | undefined) {
  // If an establishment is selected, fetch per-establishment; otherwise fetch all
  const key = establishmentId
    ? establishmentKey(establishmentId)
    : ALL_BARBERS_KEY;

  const { data, error, isLoading } = useSWR<Barber[]>(key, fetcher);

  return { barbers: data ?? [], isLoading, isError: !!error };
}

export function useBarber(id: string | undefined) {
  const { data, error, isLoading } = useSWR<Barber>(
    id ? `/barbers/${id}` : null,
    fetcher,
  );

  return { barber: data, isLoading, isError: !!error };
}

export function useBarberByUserId(userId: string | undefined) {
  const { data, error, isLoading } = useSWR<Barber[]>(
    userId ? `/barbers?_lookupUserId=${userId}` : null,
    () => fetcher<Barber[]>(ALL_BARBERS_KEY),
  );
  const barber = data?.find((b) => b.userId === userId);
  return { barber, isLoading, isError: !!error };
}

export function useBarberServices(barberId: string | undefined) {
  const { data, error, isLoading } = useSWR<Service[]>(
    barberId ? `/services/barber/${barberId}` : null,
    fetcher,
  );

  return { services: data ?? [], isLoading, isError: !!error };
}

export function useSetBarberServices() {
  async function setServices(barberId: string, serviceIds: string[]) {
    await barberService.setBarberServices(barberId, serviceIds);
    await globalMutate(`/services/barber/${barberId}`);
  }

  return { setServices };
}

export function useBarberMutations(establishmentId: string | undefined) {
  const activeKey = establishmentId
    ? establishmentKey(establishmentId)
    : ALL_BARBERS_KEY;

  async function revalidate(extraEstablishmentId?: string) {
    // Always revalidate the active list key
    await globalMutate(activeKey);
    // Also revalidate the "all" key so it stays fresh
    if (activeKey !== ALL_BARBERS_KEY) {
      await globalMutate(ALL_BARBERS_KEY);
    }
    // If the mutation targeted a different establishment, revalidate that too
    if (
      extraEstablishmentId &&
      establishmentKey(extraEstablishmentId) !== activeKey
    ) {
      await globalMutate(establishmentKey(extraEstablishmentId));
    }
  }

  async function createBarber(data: CreateBarberDto) {
    const result = await barberService.create(data);
    await revalidate(data.establishmentId);
    return result;
  }

  async function addBarber(data: AddBarberDto) {
    const result = await barberService.registerAndCreateBarber(data);
    await revalidate(data.establishmentId);
    return result;
  }

  async function updateBarber(id: string, data: UpdateBarberDto) {
    const result = await barberService.update(id, data);
    await revalidate();
    return result;
  }

  async function deleteBarber(id: string) {
    await barberService.remove(id);
    await revalidate();
  }

  return { createBarber, addBarber, updateBarber, deleteBarber };
}
