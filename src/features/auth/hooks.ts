import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { User } from "@/types";

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<User>("/auth/me", fetcher);

  return {
    user: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
