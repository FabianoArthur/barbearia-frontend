import axios, { AxiosError } from "axios";
import { getApiErrorMessage } from "@/lib/error-messages";
import { createDemoApi, DEMO_ACCOUNTS } from "./handlers";
import { createDemoAdapter } from "./install";

function demoClient() {
  const client = axios.create({ baseURL: "http://api.test/api" });
  client.defaults.adapter = createDemoAdapter(createDemoApi(new Date()), 0);
  return client;
}

describe("demo axios adapter", () => {
  it("serves data through a regular axios instance", async () => {
    const res = await demoClient().get("/public/booking/establishments");
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it("sends JSON bodies to the handlers", async () => {
    const res = await demoClient().post("/auth/login", {
      email: DEMO_ACCOUNTS.barber,
      password: "x",
    });
    expect(res.data.user.role).toBe("BARBER");
  });

  it("raises AxiosErrors that the app's error mapper understands", async () => {
    const error = await demoClient()
      .post("/auth/login", { email: "nobody@example.com" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AxiosError);
    expect(getApiErrorMessage(error)).toBe("E-mail ou senha incorretos.");
  });
});
