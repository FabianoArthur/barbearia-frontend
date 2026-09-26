import type {
  AppointmentListResponse,
  AvailabilityResponse,
  Barber,
  Establishment,
  Service,
  User,
} from "@/types";
import type {
  DashboardOverviewResponse,
  RevenueAnalyticsResponse,
} from "@/features/manager/finance/types";
import { createDemoApi, DEMO_ACCOUNTS } from "./handlers";

// A Tuesday, mid-morning (local time).
const NOW = new Date(2026, 2, 10, 10, 0, 0);

function setup() {
  const demo = createDemoApi(NOW);
  const get = <T>(url: string, params?: Record<string, unknown>) =>
    demo.handle({ method: "get", url, params }) as { status: number; data: T };
  const post = <T>(url: string, body?: unknown) =>
    demo.handle({ method: "post", url, body }) as { status: number; data: T };
  return { demo, get, post };
}

describe("demo API — auth", () => {
  it("starts signed out", () => {
    expect(setup().get("/auth/me").status).toBe(401);
  });

  it("signs in the demo accounts with any password and signs out", () => {
    const { get, post } = setup();

    const login = post<{ user: User }>("/auth/login", {
      email: DEMO_ACCOUNTS.manager,
      password: "whatever",
    });
    expect(login.status).toBe(200);
    expect(login.data.user.role).toBe("MANAGER");
    expect(get<User>("/auth/me").data.email).toBe(DEMO_ACCOUNTS.manager);

    post("/auth/logout");
    expect(get("/auth/me").status).toBe(401);
  });

  it("rejects unknown e-mails with the backend's message", () => {
    const res = setup().post<{ message: string }>("/auth/login", {
      email: "someone@example.com",
      password: "x",
    });
    expect(res.status).toBe(401);
    expect(res.data.message).toBe("Invalid credentials");
  });

  it("can start already signed in (used by the ?as= demo links)", () => {
    const demo = createDemoApi(NOW, "barber");
    const me = demo.handle({ method: "get", url: "/auth/me" });
    expect((me.data as User).role).toBe("BARBER");
  });
});

describe("demo API — public booking flow", () => {
  it("walks establishment → service → barber → slot → booking", () => {
    const { get, post } = setup();

    const [shop] = get<Establishment[]>("/public/booking/establishments").data;
    expect(shop).toBeDefined();

    const [service] = get<Service[]>(
      `/public/booking/establishments/${shop.id}/services`,
    ).data;
    const [barber] = get<Barber[]>(
      `/public/booking/establishments/${shop.id}/services/${service.id}/barbers`,
    ).data;
    expect(barber.establishmentId).toBe(shop.id);
    expect(barber.user?.name).toBeTruthy();

    // Query string inside the URL, as the SWR hooks send it.
    const availabilityUrl = `/public/booking/barbers/${barber.id}/availability?date=2026-03-11&serviceId=${service.id}`;
    const before = get<AvailabilityResponse>(availabilityUrl).data;
    expect(before.serviceDurationMinutes).toBe(service.durationMinutes);
    expect(before.slots.length).toBeGreaterThan(0);
    expect(before.slots[0].startTime).toMatch(/^\d{2}:\d{2}$/);

    const chosen = before.slots[0].startTime;
    const [h, m] = chosen.split(":").map(Number);
    const booked = post<{ code: string; status: string }>(
      "/public/booking/appointments",
      {
        establishmentId: shop.id,
        barberId: barber.id,
        serviceId: service.id,
        startsAt: new Date(2026, 2, 11, h, m).toISOString(),
        clientName: "Ana Souza",
        clientCpf: "12345678901",
      },
    );
    expect(booked.status).toBe(201);
    expect(booked.data.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(booked.data.status).toBe("CONFIRMATION_PENDING");

    const after = get<AvailabilityResponse>(availabilityUrl).data;
    expect(after.slots.map((s) => s.startTime)).not.toContain(chosen);
  });

  it("offers no slots in the past", () => {
    const { get } = setup();
    const [shop] = get<Establishment[]>("/public/booking/establishments").data;
    const [service] = get<Service[]>(
      `/public/booking/establishments/${shop.id}/services`,
    ).data;
    const [barber] = get<Barber[]>(
      `/public/booking/establishments/${shop.id}/services/${service.id}/barbers`,
    ).data;
    const today = get<AvailabilityResponse>(
      `/public/booking/barbers/${barber.id}/availability`,
      { date: "2026-03-10", serviceId: service.id },
    ).data;
    expect(today.slots.every((s) => s.startTime >= "10:00")).toBe(true);
  });
});

describe("demo API — dashboards", () => {
  it("lists only the signed-in barber's appointments, including today's", () => {
    const demo = createDemoApi(NOW, "barber");
    const me = demo.handle({ method: "get", url: "/auth/me" }).data as User;
    const res = demo.handle({
      method: "get",
      url: "/appointments",
      params: {
        barberId: me.id,
        limit: 100,
        sortBy: "startsAt",
        sortOrder: "asc",
      },
    }).data as AppointmentListResponse;

    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.every((a) => a.barberId === me.id)).toBe(true);
    expect(res.data.some((a) => a.date.startsWith("2026-03-10"))).toBe(true);
    expect(res.meta.totalItems).toBeGreaterThanOrEqual(res.data.length);
  });

  it("paginates and filters appointments by status", () => {
    const { get } = setup();
    const page = get<AppointmentListResponse>("/appointments", {
      page: 2,
      limit: 5,
      status: "DONE,CANCELED",
    }).data;
    expect(page.data).toHaveLength(5);
    expect(page.meta.currentPage).toBe(2);
    expect(
      page.data.every((a) => a.status === "DONE" || a.status === "CANCELED"),
    ).toBe(true);
  });

  it("returns a coherent finance overview", () => {
    const { get } = setup();
    const d = get<DashboardOverviewResponse>("/finance/dashboard", {
      establishmentId: "all",
      period: "month",
    }).data;
    expect(d.grossRevenue).toBeGreaterThan(0);
    expect(d.netRevenue).toBeLessThan(d.grossRevenue);
    expect(d.topBarber?.barberName).toBeTruthy();
  });

  it("buckets revenue by the requested granularity", () => {
    const { get } = setup();
    const r = get<RevenueAnalyticsResponse>("/finance/analytics/revenue", {
      startDate: new Date(2026, 2, 1).toISOString(),
      endDate: new Date(2026, 2, 7, 23).toISOString(),
      granularity: "day",
    }).data;
    expect(r.byPeriod).toHaveLength(7);
    expect(r.byPeriod[0].period).toBe("2026-03-01");
  });

  it("is deterministic for the same clock", () => {
    const a = setup().get("/finance/dashboard", { period: "month" }).data;
    const b = setup().get("/finance/dashboard", { period: "month" }).data;
    expect(a).toEqual(b);
  });
});

describe("demo API — fallbacks", () => {
  it("answers unknown reads with an empty list and writes with an empty object", () => {
    const { demo } = setup();
    expect(demo.handle({ method: "get", url: "/finance/fees" }).data).toEqual(
      [],
    );
    expect(
      demo.handle({ method: "post", url: "/schedule/time-off", body: {} }),
    ).toEqual({ status: 200, data: {} });
  });
});
