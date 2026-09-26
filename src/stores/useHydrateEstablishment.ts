import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/features/auth/context";
import { useEstablishmentStore } from "./useEstablishmentStore";
import type { Establishment } from "@/types";

/**
 * Hydrates the Zustand establishment store on mount.
 *
 * - SUPER_ADMIN: fetches all establishments and allows switching + "All".
 * - MANAGER: uses their single `user.establishmentId`.
 *
 * Call this **once** in `ManagerLayout`.
 */
export function useHydrateEstablishment() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const {
    setEstablishments,
    setCanSwitch,
    setHydrated,
    setSelectedEstablishmentId,
    selectedEstablishmentId,
    hydrated,
  } = useEstablishmentStore();

  // Only fetch the full list for SUPER_ADMIN
  const { data: establishments } = useSWR<Establishment[]>(
    isSuperAdmin ? "/establishments" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (!user) return;

    if (isSuperAdmin) {
      if (!establishments) return; // still loading

      setEstablishments(establishments);
      setCanSwitch(true);

      // If the persisted selection is no longer valid, reset to "All"
      const validIds = establishments.map((e) => e.id);
      if (
        selectedEstablishmentId !== null &&
        !validIds.includes(selectedEstablishmentId)
      ) {
        setSelectedEstablishmentId(null);
      }
    } else {
      // MANAGER — lock to their establishment
      const estId = user.establishmentId ?? null;
      setEstablishments([]);
      setCanSwitch(false);
      setSelectedEstablishmentId(estId);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSuperAdmin, establishments]);

  return { hydrated };
}
