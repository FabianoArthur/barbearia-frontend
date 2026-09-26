/**
 * In-memory stand-in for the REST API, used only by the demo build
 * (`VITE_DEMO=true`). It implements the endpoints behind the public booking
 * flow, the barber agenda and the manager dashboards; any other read answers
 * with an empty list and any other write succeeds without effect.
 *
 * Pure request → response, so it is unit-tested without a browser.
 */
import type {
  Appointment,
  AppointmentListItem,
  AppointmentStatus,
  User,
} from "@/types";
import type {
  DashboardOverviewResponse,
  Granularity,
  RevenuePeriodPoint,
} from "@/features/manager/finance/types";
import {
  CLOSED_WEEKDAYS,
  CLOSING_MINUTES,
  OPENING_MINUTES,
  SLOT_STEP_MINUTES,
  appointmentCode,
  barbers,
  clients,
  establishments,
  generateAppointments,
  seededRandom,
  services,
  users,
} from "./fixtures";

export const DEMO_ACCOUNTS = {
  manager: "gerente@demo.dev",
  barber: "barbeiro@demo.dev",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export interface DemoRequest {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  body?: unknown;
}

export interface DemoResponse {
  status: number;
  data: unknown;
}

/** An explicit status code; handlers may also return plain data (200). */
class Reply {
  constructor(
    readonly status: number,
    readonly data: unknown,
  ) {}
}
const reply = (status: number, data: unknown) => new Reply(status, data);

type Params = Record<string, string>;
type Handler = (ctx: { path: Params; query: Params; body: unknown }) => unknown;

const PLATFORM_FEE_RATE = 0.04;
const TIP_RATE = 0.08;
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");
const toHHMM = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const localDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function createDemoApi(now: Date, signedInAs?: DemoRole) {
  const appointments: Appointment[] = generateAppointments(now);
  const rand = seededRandom(now.getTime());
  let currentUser: User | undefined = signedInAs
    ? users.find((u) => u.email === DEMO_ACCOUNTS[signedInAs])
    : undefined;

  // ── helpers ────────────────────────────────────────────────────────

  const serviceOf = (a: Appointment) =>
    services.find((s) => s.id === a.serviceId)!;
  const barberOf = (a: Appointment) =>
    barbers.find((b) => b.id === a.barberId)!;

  function toListItem(a: Appointment): AppointmentListItem {
    return {
      id: a.id,
      barberId: a.barberId,
      barberName: barberOf(a).user?.name ?? "",
      clientId: a.clientId,
      clientName: clients.find((c) => c.id === a.clientId)?.name ?? "Cliente",
      serviceId: a.serviceId,
      serviceName: serviceOf(a).name,
      serviceValue: a.priceSnapshot ?? serviceOf(a).price,
      status: a.status,
      date: a.startsAt,
    };
  }

  function inEstablishment(a: Appointment, establishmentId?: string) {
    return (
      !establishmentId ||
      establishmentId === "all" ||
      a.establishmentId === establishmentId
    );
  }

  function completedBetween(start: Date, end: Date, establishmentId?: string) {
    return appointments.filter((a) => {
      const t = new Date(a.startsAt);
      return (
        a.status === "DONE" &&
        t >= start &&
        t <= end &&
        inEstablishment(a, establishmentId)
      );
    });
  }

  function totals(list: Appointment[]) {
    const gross = round2(
      list.reduce((sum, a) => sum + (a.priceSnapshot ?? 0), 0),
    );
    const fees = round2(gross * PLATFORM_FEE_RATE);
    const tips = round2(gross * TIP_RATE);
    return {
      gross,
      net: round2(gross - fees),
      fees,
      tips,
      count: list.length,
      average: list.length ? round2(gross / list.length) : 0,
    };
  }

  function periodRange(period: string): [Date, Date] {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const days = { today: 0, week: 7, month: 30, quarter: 90, year: 365 };
    const back = days[period as keyof typeof days] ?? 30;
    start.setDate(start.getDate() - back);
    return [start, now];
  }

  function bucketKey(d: Date, granularity: Granularity): string {
    switch (granularity) {
      case "hour":
        return `${localDate(d)}T${pad(d.getHours())}:00`;
      case "week": {
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return localDate(monday);
      }
      case "month":
        return localDate(d).slice(0, 7);
      case "quarter":
        return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      case "year":
        return String(d.getFullYear());
      default:
        return localDate(d);
    }
  }

  function revenueSeries(
    start: Date,
    end: Date,
    granularity: Granularity,
    establishmentId?: string,
  ): RevenuePeriodPoint[] {
    const buckets = new Map<string, Appointment[]>();
    const step = granularity === "hour" ? 3_600_000 : DAY_MS;
    for (let t = start.getTime(); t <= end.getTime(); t += step) {
      buckets.set(bucketKey(new Date(t), granularity), []);
    }
    for (const a of completedBetween(start, end, establishmentId)) {
      buckets.get(bucketKey(new Date(a.startsAt), granularity))?.push(a);
    }
    return [...buckets].map(([period, list]) => {
      const t = totals(list);
      return {
        period,
        grossRevenue: t.gross,
        netRevenue: t.net,
        totalTips: t.tips,
        totalPlatformFees: t.fees,
        bookingCount: t.count,
      };
    });
  }

  function rankBy<K extends string>(
    list: Appointment[],
    key: (a: Appointment) => K,
  ) {
    const groups = new Map<K, Appointment[]>();
    for (const a of list)
      groups.set(key(a), [...(groups.get(key(a)) ?? []), a]);
    return [...groups].sort((x, y) => totals(y[1]).gross - totals(x[1]).gross);
  }

  function availableSlots(barberId: string, date: string, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    const day = parseLocalDate(date);
    if (!service || CLOSED_WEEKDAYS.includes(day.getDay())) return [];

    const busy = appointments
      .filter(
        (a) =>
          a.barberId === barberId &&
          a.status !== "CANCELED" &&
          localDate(new Date(a.startsAt)) === date,
      )
      .map((a) => {
        const s = new Date(a.startsAt);
        const startMin = s.getHours() * 60 + s.getMinutes();
        return [startMin, startMin + serviceOf(a).durationMinutes] as const;
      });

    const nowMin =
      localDate(now) === date ? now.getHours() * 60 + now.getMinutes() : -1;
    const slots = [];
    for (
      let m = OPENING_MINUTES;
      m + service.durationMinutes <= CLOSING_MINUTES;
      m += SLOT_STEP_MINUTES
    ) {
      const end = m + service.durationMinutes;
      const overlaps = busy.some(([s, e]) => m < e && end > s);
      if (m >= nowMin && !overlaps) {
        slots.push({ startTime: toHHMM(m), endTime: toHHMM(end) });
      }
    }
    return slots;
  }

  const unauthorized = (message = "Unauthorized") => reply(401, { message });

  // ── routes ─────────────────────────────────────────────────────────

  const routes: [string, string, Handler][] = [
    // Auth
    [
      "post",
      "/auth/login",
      ({ body }) => {
        const email = (body as { email?: string })?.email?.toLowerCase();
        const user = users.find((u) => u.email === email);
        if (!user) return unauthorized("Invalid credentials");
        currentUser = user;
        return reply(200, { user });
      },
    ],
    [
      "post",
      "/auth/logout",
      () => {
        currentUser = undefined;
        return {};
      },
    ],
    ["post", "/auth/refresh", () => (currentUser ? {} : unauthorized())],
    ["get", "/auth/me", () => currentUser ?? unauthorized()],

    // Public booking
    ["get", "/public/booking/establishments", () => establishments],
    [
      "get",
      "/public/booking/establishments/:id",
      ({ path }) => establishments.find((e) => e.id === path.id),
    ],
    [
      "get",
      "/public/booking/establishments/:id/services",
      ({ path }) => services.filter((s) => s.establishmentId === path.id),
    ],
    [
      "get",
      "/public/booking/establishments/:id/barbers",
      ({ path }) => barbers.filter((b) => b.establishmentId === path.id),
    ],
    [
      "get",
      "/public/booking/establishments/:id/services/:serviceId/barbers",
      ({ path }) => barbers.filter((b) => b.establishmentId === path.id),
    ],
    [
      "get",
      "/public/booking/barbers/:id/services",
      ({ path }) => {
        const barber = barbers.find((b) => b.id === path.id);
        return services.filter(
          (s) => s.establishmentId === barber?.establishmentId,
        );
      },
    ],
    [
      "get",
      "/public/booking/barbers/:id/availability",
      ({ path, query }) => ({
        slots: availableSlots(path.id, query.date, query.serviceId),
        serviceDurationMinutes:
          services.find((s) => s.id === query.serviceId)?.durationMinutes ?? 30,
        workingPeriods: [
          {
            startTime: toHHMM(OPENING_MINUTES),
            endTime: toHHMM(CLOSING_MINUTES),
          },
        ],
      }),
    ],
    [
      "post",
      "/public/booking/appointments",
      ({ body }) => {
        const dto = body as {
          establishmentId: string;
          barberId: string;
          serviceId: string;
          startsAt: string;
          clientName: string;
          clientCpf: string;
          clientPhone?: string;
        };
        const service = services.find((s) => s.id === dto.serviceId);
        if (!service) return reply(404, { message: "Service not found" });
        const start = new Date(dto.startsAt);
        const free = availableSlots(
          dto.barberId,
          localDate(start),
          dto.serviceId,
        )
          .map((s) => s.startTime)
          .includes(toHHMM(start.getHours() * 60 + start.getMinutes()));
        if (!free) {
          return reply(409, {
            message: "New time slot conflicts with an existing booking",
          });
        }
        const appointment: Appointment = {
          id: `apt-${appointments.length + 1}`,
          code: appointmentCode(rand),
          establishmentId: dto.establishmentId,
          barberId: dto.barberId,
          clientId: `cli-demo-${appointments.length + 1}`,
          serviceId: service.id,
          startsAt: start.toISOString(),
          endsAt: new Date(
            start.getTime() + service.durationMinutes * 60_000,
          ).toISOString(),
          status: "CONFIRMATION_PENDING",
          priceSnapshot: service.price,
          service,
        };
        appointments.push(appointment);
        return reply(201, appointment);
      },
    ],

    // Manager data
    ["get", "/establishments", () => establishments],
    [
      "get",
      "/establishments/:id",
      ({ path }) => establishments.find((e) => e.id === path.id),
    ],
    [
      "get",
      "/barbers",
      ({ query }) =>
        barbers.filter(
          (b) =>
            !query.establishmentId ||
            b.establishmentId === query.establishmentId,
        ),
    ],
    [
      "get",
      "/services",
      ({ query }) =>
        services.filter(
          (s) =>
            !query.establishmentId ||
            s.establishmentId === query.establishmentId,
        ),
    ],
    [
      "get",
      "/clients",
      ({ query }) =>
        clients.filter(
          (c) =>
            !query.establishmentId ||
            c.establishmentId === query.establishmentId,
        ),
    ],
    [
      "get",
      "/appointments",
      ({ query }) => {
        const statuses = query.status?.split(",").filter(Boolean) ?? [];
        // The barber agenda asks for "the first 100, ascending" with no date
        // filter, which on a long history returns the oldest bookings. The
        // demo starts such requests at today so the agenda shows today.
        const agendaStart =
          query.barberId && !query.startDate
            ? new Date(localDate(now) + "T00:00:00")
            : undefined;
        const from = query.startDate ? new Date(query.startDate) : agendaStart;
        const to = query.endDate ? new Date(query.endDate) : undefined;
        const order = query.sortOrder === "asc" ? 1 : -1;
        const matches = appointments
          .filter(
            (a) =>
              inEstablishment(a, query.establishmentId) &&
              (!query.barberId || a.barberId === query.barberId) &&
              (statuses.length === 0 ||
                statuses.includes(a.status as AppointmentStatus)) &&
              (!from || new Date(a.startsAt) >= from) &&
              (!to || new Date(a.startsAt) <= to),
          )
          .sort((x, y) => x.startsAt.localeCompare(y.startsAt) * order);
        const limit = Number(query.limit) || 20;
        const page = Number(query.page) || 1;
        const pageItems = matches.slice((page - 1) * limit, page * limit);
        return {
          data: pageItems.map(toListItem),
          meta: {
            totalItems: matches.length,
            itemsPerPage: limit,
            currentPage: page,
            totalPages: Math.ceil(matches.length / limit),
          },
          totalRevenue: totals(matches.filter((a) => a.status === "DONE"))
            .gross,
        };
      },
    ],
    ...(
      [
        ["confirm", "CONFIRMED"],
        ["start", "IN_PROGRESS"],
        ["finish", "DONE"],
        ["no-show", "NO_SHOW"],
        ["cancel", "CANCELED"],
      ] as const
    ).map(([action, status]): [string, string, Handler] => [
      "post",
      `/appointments/:id/${action}`,
      ({ path }) => {
        const a = appointments.find((x) => x.id === path.id);
        if (!a) return reply(404, { message: "Appointment not found" });
        a.status = status;
        return a;
      },
    ]),
    [
      "patch",
      "/appointments/:id/status",
      ({ path, body }) => {
        const a = appointments.find((x) => x.id === path.id);
        if (!a) return reply(404, { message: "Appointment not found" });
        a.status = (body as { status: AppointmentStatus }).status;
        return a;
      },
    ],

    // Finance
    [
      "get",
      "/finance/dashboard",
      ({ query }): DashboardOverviewResponse => {
        const [start, end] = periodRange(query.period ?? "month");
        const span = end.getTime() - start.getTime();
        const current = completedBetween(start, end, query.establishmentId);
        const previous = completedBetween(
          new Date(start.getTime() - span),
          start,
          query.establishmentId,
        );
        const c = totals(current);
        const p = totals(previous);
        const growth = (a: number, b: number) =>
          b === 0 ? 0 : round2(((a - b) / b) * 100);
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const today = totals(
          completedBetween(startOfToday, now, query.establishmentId),
        );
        const [topBarber] = rankBy(current, (a) => a.barberId);
        const byService = [...rankBy(current, (a) => a.serviceId)].sort(
          (x, y) => y[1].length - x[1].length,
        );
        return {
          grossRevenue: c.gross,
          netRevenue: c.net,
          totalBookings: c.count,
          totalTips: c.tips,
          totalPlatformFees: c.fees,
          averageOrderValue: c.average,
          today: {
            revenue: today.gross,
            bookingCount: today.count,
            tips: today.tips,
          },
          periodComparison: {
            currentGrossRevenue: c.gross,
            previousGrossRevenue: p.gross,
            currentNetRevenue: c.net,
            previousNetRevenue: p.net,
            currentBookings: c.count,
            previousBookings: p.count,
            currentTips: c.tips,
            previousTips: p.tips,
            currentPlatformFees: c.fees,
            previousPlatformFees: p.fees,
            revenueGrowthRate: growth(c.gross, p.gross),
            netRevenueGrowthRate: growth(c.net, p.net),
            bookingsGrowthRate: growth(c.count, p.count),
            tipsGrowthRate: growth(c.tips, p.tips),
            feesGrowthRate: growth(c.fees, p.fees),
          },
          topBarber: topBarber && {
            barberId: topBarber[0],
            barberName:
              barbers.find((b) => b.id === topBarber[0])?.user?.name ?? "",
            grossRevenue: totals(topBarber[1]).gross,
          },
          topService: byService[0] && {
            serviceId: byService[0][0],
            serviceName:
              services.find((s) => s.id === byService[0][0])?.name ?? "",
            bookingCount: byService[0][1].length,
          },
          revenueComposition: {
            bookingRevenue: c.gross,
            tipsRevenue: c.tips,
            platformFees: c.fees,
            refunds: 0,
          },
          generatedAt: now.toISOString(),
        };
      },
    ],
    [
      "get",
      "/finance/analytics/revenue",
      ({ query }) => {
        const [defaultStart] = periodRange("month");
        const start = query.startDate
          ? new Date(query.startDate)
          : defaultStart;
        const end = query.endDate ? new Date(query.endDate) : now;
        const granularity = (query.granularity ?? "day") as Granularity;
        const list = completedBetween(start, end, query.establishmentId);
        const t = totals(list);
        const summary = {
          grossRevenue: t.gross,
          netRevenue: t.net,
          totalBookings: t.count,
          totalTips: t.tips,
          totalPlatformFees: t.fees,
          totalRefunds: 0,
          averageOrderValue: t.average,
        };
        const span = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - span);
        return {
          summary,
          byPeriod: revenueSeries(
            start,
            end,
            granularity,
            query.establishmentId,
          ),
          previousByPeriod:
            query.comparePrevious === "true"
              ? revenueSeries(
                  prevStart,
                  start,
                  granularity,
                  query.establishmentId,
                )
              : undefined,
          byBarber: rankBy(list, (a) => a.barberId).map(([id, items]) => {
            const bt = totals(items);
            return {
              barberId: id,
              barberName: barbers.find((b) => b.id === id)?.user?.name ?? "",
              grossRevenue: bt.gross,
              netRevenue: bt.net,
              totalTips: bt.tips,
              totalPlatformFees: bt.fees,
              bookingCount: bt.count,
              averageOrderValue: bt.average,
              tipsToRevenueRatio: TIP_RATE,
            };
          }),
          byService: rankBy(list, (a) => a.serviceId).map(([id, items]) => {
            const s = services.find((x) => x.id === id)!;
            const st = totals(items);
            return {
              serviceId: id,
              serviceName: s.name,
              grossRevenue: st.gross,
              netRevenue: st.net,
              bookingCount: st.count,
              averagePrice: s.price,
              durationMinutes: s.durationMinutes,
              revenuePerMinute: round2(s.price / s.durationMinutes),
            };
          }),
          generatedAt: now.toISOString(),
        };
      },
    ],
    [
      "get",
      "/finance/barber/:id/summary",
      ({ path }) => {
        const barber = barbers.find((b) => b.id === path.id);
        const done = appointments.filter(
          (a) => a.barberId === path.id && a.status === "DONE",
        );
        const commission = barber?.commissionPercent ?? 0;
        return {
          totalEarned: round2((totals(done).gross * commission) / 100),
          totalAppointments: done.length,
          commissionPercent: commission,
        };
      },
    ],
  ];

  function match(pattern: string, path: string): Params | undefined {
    const p = pattern.split("/");
    const actual = path.split("/");
    if (p.length !== actual.length) return undefined;
    const params: Params = {};
    for (let i = 0; i < p.length; i++) {
      if (p[i].startsWith(":"))
        params[p[i].slice(1)] = decodeURIComponent(actual[i]);
      else if (p[i] !== actual[i]) return undefined;
    }
    return params;
  }

  function handle(req: DemoRequest): DemoResponse {
    const method = req.method.toLowerCase();
    const [path, qs = ""] = req.url.split("?");
    const query: Params = Object.fromEntries(new URLSearchParams(qs));
    for (const [k, v] of Object.entries(req.params ?? {})) {
      if (v !== undefined && v !== null) query[k] = String(v);
    }

    for (const [m, pattern, handler] of routes) {
      if (m !== method) continue;
      const pathParams = match(pattern, path);
      if (!pathParams) continue;
      const result = handler({ path: pathParams, query, body: req.body });
      if (result === undefined) {
        return reply(404, { message: "Not found" });
      }
      return result instanceof Reply
        ? { status: result.status, data: result.data }
        : { status: 200, data: result };
    }
    return { status: 200, data: method === "get" ? [] : {} };
  }

  return { handle };
}
