/**
 * Wires the in-memory demo API into the running app. Loaded only when the
 * build is made with VITE_DEMO=true (see main.tsx), so none of this ships in
 * a normal build.
 */
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
} from "axios";
import { createDemoApi, type DemoRole } from "./handlers";

const LATENCY_MS = 180;
const SESSION_KEY = "demo-session-role";

function readRole(): DemoRole | undefined {
  // `?as=manager|barber` lets the demo links (and screenshots) start signed in.
  const fromUrl = new URLSearchParams(window.location.search).get("as");
  if (fromUrl === "manager" || fromUrl === "barber") return fromUrl;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "manager" || stored === "barber") return stored;
  } catch {
    // Storage can be unavailable (private mode); the demo still works.
  }
  return undefined;
}

function rememberRole(role: DemoRole | undefined) {
  try {
    if (role) sessionStorage.setItem(SESSION_KEY, role);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function createDemoAdapter(
  demo: ReturnType<typeof createDemoApi>,
  latencyMs = LATENCY_MS,
): AxiosAdapter {
  return async (config) => {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
    const body =
      typeof config.data === "string" && config.data
        ? JSON.parse(config.data)
        : config.data;
    const { status, data } = demo.handle({
      method: config.method ?? "get",
      url: config.url ?? "",
      params: config.params,
      body,
    });
    const response = {
      status,
      statusText: String(status),
      data,
      headers: new AxiosHeaders(),
      config,
    };
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        status >= 500
          ? AxiosError.ERR_BAD_RESPONSE
          : AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response,
      );
    }
    return response;
  };
}

/** Stand-in for the server-sent events stream: never connects, never errors. */
class SilentEventSource extends EventTarget {
  readonly readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  close() {}
}

export function installDemo(api: AxiosInstance) {
  const demo = createDemoApi(new Date(), readRole());
  const apiUrl = api.defaults.baseURL ?? "";

  api.defaults.adapter = createDemoAdapter(demo);

  // Keep the chosen demo role across reloads within the tab.
  api.interceptors.response.use((response) => {
    const url = response.config.url ?? "";
    if (url === "/auth/login") {
      const role = (response.data as { user?: { role?: string } }).user?.role;
      rememberRole(role === "BARBER" ? "barber" : "manager");
    }
    if (url === "/auth/logout") rememberRole(undefined);
    return response;
  });

  // One feature calls `fetch` directly; route only API calls to the demo.
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!apiUrl || !url.startsWith(apiUrl)) return realFetch(input, init);
    const { status, data } = demo.handle({
      method: init?.method ?? (input instanceof Request ? input.method : "GET"),
      url: url.slice(apiUrl.length),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  const RealEventSource = window.EventSource;
  window.EventSource = function (url: string | URL, init?: EventSourceInit) {
    return String(url).startsWith(apiUrl)
      ? new SilentEventSource()
      : new RealEventSource(url, init);
  } as unknown as typeof EventSource;
}
