import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Establishment } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────

interface EstablishmentState {
  /** Currently selected establishment ID. `null` means "All Establishments". */
  selectedEstablishmentId: string | null;
  /** All establishments available to the current user. */
  establishments: Establishment[];
  /** Whether the user is allowed to switch (SUPER_ADMIN). */
  canSwitch: boolean;
  /** Whether the store has been hydrated with data from the API. */
  hydrated: boolean;

  // ── Actions ──────────────────────────────────────────────────────────
  setSelectedEstablishmentId: (id: string | null) => void;
  setEstablishments: (list: Establishment[]) => void;
  setCanSwitch: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
  reset: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────

const initialState = {
  selectedEstablishmentId: null,
  establishments: [],
  canSwitch: false,
  hydrated: false,
};

export const useEstablishmentStore = create<EstablishmentState>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedEstablishmentId: (id) => set({ selectedEstablishmentId: id }),

      setEstablishments: (list) => set({ establishments: list }),

      setCanSwitch: (value) => set({ canSwitch: value }),

      setHydrated: (value) => set({ hydrated: value }),

      reset: () => set(initialState),
    }),
    {
      name: "establishment-store",
      // Only persist the selected ID — everything else is re-fetched on load
      partialize: (state) => ({
        selectedEstablishmentId: state.selectedEstablishmentId,
      }),
    },
  ),
);
