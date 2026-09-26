import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/api";
import type { Service } from "@/types";
import * as serviceService from "./services";
import type { CreateServiceDto, UpdateServiceDto } from "./types";

const ALL_SERVICES_KEY = "/services";

function establishmentKey(id: string) {
  return `/services/establishment/${id}`;
}

export function useServices(establishmentId: string | undefined) {
  const key = establishmentId
    ? establishmentKey(establishmentId)
    : ALL_SERVICES_KEY;

  const { data, error, isLoading } = useSWR<Service[]>(key, fetcher);

  return { services: data ?? [], isLoading, isError: !!error };
}

export function useServiceMutations(establishmentId: string | undefined) {
  const activeKey = establishmentId
    ? establishmentKey(establishmentId)
    : ALL_SERVICES_KEY;

  async function revalidate(extraEstablishmentId?: string) {
    await globalMutate(activeKey);
    if (activeKey !== ALL_SERVICES_KEY) {
      await globalMutate(ALL_SERVICES_KEY);
    }
    if (
      extraEstablishmentId &&
      establishmentKey(extraEstablishmentId) !== activeKey
    ) {
      await globalMutate(establishmentKey(extraEstablishmentId));
    }
  }

  async function createService(data: CreateServiceDto) {
    const result = await serviceService.create(data);
    await revalidate(data.establishmentId);
    return result;
  }

  async function updateService(id: string, data: UpdateServiceDto) {
    const result = await serviceService.update(id, data);
    await revalidate();
    return result;
  }

  async function deleteService(id: string) {
    await serviceService.remove(id);
    await revalidate();
  }

  return { createService, updateService, deleteService };
}
