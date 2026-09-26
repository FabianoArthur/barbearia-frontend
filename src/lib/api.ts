import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  xsrfCookieName: "csrf_token",
  xsrfHeaderName: "x-csrf-token",
  withXSRFToken: true,
});

const SKIP_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !SKIP_REFRESH_PATHS.some((p) => originalRequest.url?.includes(p))
    ) {
      originalRequest._retried = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh").then(() => undefined);
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  },
);

export function fetcher<T>(url: string): Promise<T> {
  return api.get<T>(url).then((res) => res.data);
}
