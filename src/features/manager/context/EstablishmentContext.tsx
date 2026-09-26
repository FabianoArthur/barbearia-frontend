import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/features/auth/context";
import type { Establishment } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────

interface EstablishmentContextValue {
  /** Currently selected establishment ID. */
  currentEstablishmentId: string | undefined;
  /** Switch to a different establishment (SUPER_ADMIN). */
  setEstablishmentId: (id: string) => void;
  /** All establishments available to the user. */
  establishments: Establishment[];
  /** Whether the establishment list is loading. */
  isLoading: boolean;
  /** Whether the user can switch establishments (SUPER_ADMIN). */
  canSwitch: boolean;
}

const EstablishmentContext = createContext<EstablishmentContextValue | null>(
  null,
);

// ─── Provider ──────────────────────────────────────────────────────────

interface EstablishmentProviderProps {
  children: ReactNode;
}

export function EstablishmentProvider({
  children,
}: EstablishmentProviderProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // SUPER_ADMIN can see all establishments
  const { data: establishments, isLoading } = useSWR<Establishment[]>(
    isSuperAdmin ? "/establishments" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const currentEstablishmentId = useMemo(() => {
    if (isSuperAdmin && selectedId) return selectedId;
    return user?.establishmentId;
  }, [isSuperAdmin, selectedId, user?.establishmentId]);

  const setEstablishmentId = useCallback(
    (id: string) => {
      if (isSuperAdmin) {
        setSelectedId(id);
      }
    },
    [isSuperAdmin],
  );

  // For non-SUPER_ADMIN, provide their single establishment
  const allEstablishments = useMemo<Establishment[]>(() => {
    if (isSuperAdmin) return establishments ?? [];
    // Return empty — the user has a single establishment bound to their profile
    return [];
  }, [isSuperAdmin, establishments]);

  const value = useMemo<EstablishmentContextValue>(
    () => ({
      currentEstablishmentId,
      setEstablishmentId,
      establishments: allEstablishments,
      isLoading: isSuperAdmin ? isLoading : false,
      canSwitch: isSuperAdmin,
    }),
    [
      currentEstablishmentId,
      setEstablishmentId,
      allEstablishments,
      isSuperAdmin,
      isLoading,
    ],
  );

  return (
    <EstablishmentContext.Provider value={value}>
      {children}
    </EstablishmentContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useEstablishment(): EstablishmentContextValue {
  const context = useContext(EstablishmentContext);
  if (!context) {
    throw new Error(
      "useEstablishment must be used within an EstablishmentProvider",
    );
  }
  return context;
}
