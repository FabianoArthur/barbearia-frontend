import { useEffect, useRef, useState, useCallback } from "react";
import { useSWRConfig } from "swr";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const POLLING_INTERVAL_MS = 30_000;
const MAX_DISCONNECTS = 2;

interface UseBarberSSEReturn {
  isOffline: boolean;
}

export function useBarberSSE(barberId: string | undefined): UseBarberSSEReturn {
  const { mutate } = useSWRConfig();
  const [isOffline, setIsOffline] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectCountRef = useRef(0);

  const revalidate = useCallback(() => {
    mutate(
      (key: unknown) =>
        typeof key === "string" &&
        (key.startsWith("/appointments") || key.startsWith("/finance/barber/")),
      undefined,
      { revalidate: true },
    );
  }, [mutate]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(revalidate, POLLING_INTERVAL_MS);
  }, [revalidate]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!barberId) return;

    const url = `${API_URL}/sse/barber/${barberId}/dashboard`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      disconnectCountRef.current = 0;
      setIsOffline(false);
      stopPolling();
    };

    es.addEventListener("booking.status_changed", () => {
      revalidate();
    });

    es.onerror = () => {
      disconnectCountRef.current += 1;
      if (disconnectCountRef.current > MAX_DISCONNECTS) {
        setIsOffline(true);
        startPolling();
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      stopPolling();
    };
  }, [barberId, revalidate, startPolling, stopPolling]);

  return { isOffline };
}
