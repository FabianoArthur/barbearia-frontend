import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/api";
import type { Client } from "@/types";
import * as clientService from "./services";
import type { CreateClientDto } from "./types";

const ALL_CLIENTS_KEY = "/clients";

function establishmentKey(id: string) {
  return `/clients/establishment/${id}`;
}

export function useClients(establishmentId?: string) {
  // If an establishment is selected, fetch per-establishment; otherwise fetch all
  const key = establishmentId
    ? establishmentKey(establishmentId)
    : ALL_CLIENTS_KEY;

  const { data, error, isLoading } = useSWR<Client[]>(key, fetcher);

  return { clients: data ?? [], isLoading, isError: !!error };
}

export function useClientMutations() {
  async function createClient(data: CreateClientDto) {
    const result = await clientService.create(data);
    await globalMutate(ALL_CLIENTS_KEY);
    // Also revalidate establishment-specific key if applicable
    if (data.establishmentId) {
      await globalMutate(establishmentKey(data.establishmentId));
    }
    return result;
  }

  async function deleteClient(id: string) {
    await clientService.remove(id);
    // Revalidate all client keys
    await globalMutate(
      (key: unknown) => typeof key === "string" && key.startsWith("/clients"),
      undefined,
      { revalidate: true },
    );
  }

  return { createClient, deleteClient };
}
