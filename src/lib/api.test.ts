import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { api } from "./api";

type Reply = { status: number; data?: unknown };

/** Fake transport: answers each request from `handler` and records the URLs. */
function useFakeServer(handler: (config: InternalAxiosRequestConfig) => Reply) {
  const calls: string[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(`${config.method?.toUpperCase()} ${config.url}`);
    const { status, data = {} } = handler(config);
    const response = {
      status,
      data,
      statusText: String(status),
      headers: new AxiosHeaders(),
      config,
    };
    if (status >= 400) {
      throw new AxiosError("fail", "ERR", config, undefined, response);
    }
    return response;
  };
  api.defaults.adapter = adapter;
  return calls;
}

describe("api refresh interceptor", () => {
  it("refreshes the session once on 401 and retries the request", async () => {
    let refreshed = false;
    const calls = useFakeServer((config) => {
      if (config.url === "/auth/refresh") {
        refreshed = true;
        return { status: 200 };
      }
      return refreshed ? { status: 200, data: { ok: true } } : { status: 401 };
    });

    await expect(api.get("/services").then((r) => r.data)).resolves.toEqual({
      ok: true,
    });
    expect(calls).toEqual([
      "GET /services",
      "POST /auth/refresh",
      "GET /services",
    ]);
  });

  it("shares a single refresh between concurrent 401s", async () => {
    let refreshed = false;
    const calls = useFakeServer((config) => {
      if (config.url === "/auth/refresh") {
        refreshed = true;
        return { status: 200 };
      }
      return refreshed ? { status: 200 } : { status: 401 };
    });

    await Promise.all([api.get("/a"), api.get("/b")]);
    expect(calls.filter((c) => c === "POST /auth/refresh")).toHaveLength(1);
  });

  it("rejects with the original error when the refresh fails", async () => {
    const calls = useFakeServer(() => ({ status: 401 }));

    await expect(api.get("/services")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(calls).toEqual(["GET /services", "POST /auth/refresh"]);
  });

  it.each(["/auth/login", "/auth/register", "/auth/refresh"])(
    "never tries to refresh for %s",
    async (url) => {
      const calls = useFakeServer(() => ({ status: 401 }));

      await expect(api.post(url)).rejects.toBeInstanceOf(AxiosError);
      expect(calls).toEqual([`POST ${url}`]);
    },
  );

  it("does not retry non-401 errors", async () => {
    const calls = useFakeServer(() => ({ status: 500 }));

    await expect(api.get("/services")).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toEqual(["GET /services"]);
  });
});
