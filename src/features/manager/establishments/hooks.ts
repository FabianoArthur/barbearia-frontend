import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/api";
import type { Establishment } from "@/types";
import * as establishmentService from "./services";
import type { CreateEstablishmentDto, UpdateEstablishmentDto } from "./types";

const ESTABLISHMENTS_KEY = "/establishments";

export function useEstablishments() {
  const { data, error, isLoading } = useSWR<Establishment[]>(
    ESTABLISHMENTS_KEY,
    fetcher,
  );

  return { establishments: data ?? [], isLoading, isError: !!error };
}

export function useEstablishment(id: string | undefined) {
  const { data, error, isLoading } = useSWR<Establishment>(
    id ? `/establishments/${id}` : null,
    fetcher,
  );

  return { establishment: data, isLoading, isError: !!error };
}

export function useEstablishmentMutations() {
  async function createEstablishment(data: CreateEstablishmentDto) {
    const result = await establishmentService.create(data);
    await globalMutate(ESTABLISHMENTS_KEY);
    return result;
  }

  async function updateEstablishment(id: string, data: UpdateEstablishmentDto) {
    const result = await establishmentService.update(id, data);
    await globalMutate(ESTABLISHMENTS_KEY);
    await globalMutate(`/establishments/${id}`);
    return result;
  }

  async function deleteEstablishment(id: string) {
    await establishmentService.remove(id);
    await globalMutate(ESTABLISHMENTS_KEY);
  }

  return { createEstablishment, updateEstablishment, deleteEstablishment };
}
