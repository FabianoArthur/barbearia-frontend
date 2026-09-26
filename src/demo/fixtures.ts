/**
 * Fictional data for the demo build. Every name here is invented.
 *
 * Appointments are generated around a given "now" with a seeded RNG, so the
 * dashboards always look current and the same clock yields the same data.
 */
import type {
  Appointment,
  AppointmentStatus,
  Barber,
  Client,
  Establishment,
  Service,
  User,
} from "@/types";

export const OPENING_MINUTES = 9 * 60; // 09:00
export const CLOSING_MINUTES = 19 * 60; // 19:00
/** Sundays are closed (Date#getDay() === 0). */
export const CLOSED_WEEKDAYS = [0];
export const SLOT_STEP_MINUTES = 30;

const HISTORY_DAYS = 120;
const FUTURE_DAYS = 14;

export const establishments: Establishment[] = [
  {
    id: "est-centro",
    name: "Fio de Navalha — Centro",
    address: "Rua das Palmeiras, 120 — Centro",
    lat: -23.5505,
    lng: -46.6333,
    monthlyCost: 9500,
  },
  {
    id: "est-jardim",
    name: "Fio de Navalha — Jardim",
    address: "Avenida dos Ipês, 845 — Jardim",
    monthlyCost: 7200,
  },
];

const barberSeeds = [
  { id: "brb-rafael", name: "Rafael Moura", est: "est-centro", commission: 45 },
  {
    id: "brb-diego",
    name: "Diego Albuquerque",
    est: "est-centro",
    commission: 40,
  },
  { id: "brb-thiago", name: "Thiago Nunes", est: "est-jardim", commission: 50 },
  { id: "brb-bruno", name: "Bruno Farias", est: "est-jardim", commission: 40 },
];

export const users: User[] = [
  {
    id: "usr-manager",
    name: "Carla Mendes",
    email: "gerente@demo.dev",
    role: "MANAGER",
    establishmentId: "est-centro",
  },
  ...barberSeeds.map<User>((b, i) => ({
    // The barber dashboard uses the user id as the barber id.
    id: b.id,
    name: b.name,
    email: i === 0 ? "barbeiro@demo.dev" : `${b.id.slice(4)}@demo.dev`,
    role: "BARBER",
    establishmentId: b.est,
  })),
];

export const barbers: Barber[] = barberSeeds.map((b) => ({
  id: b.id,
  userId: b.id,
  establishmentId: b.est,
  commissionPercent: b.commission,
  user: users.find((u) => u.id === b.id),
  establishment: establishments.find((e) => e.id === b.est),
}));

const serviceSeeds = [
  { key: "corte", name: "Corte masculino", price: 55, duration: 30 },
  { key: "barba", name: "Barba completa", price: 40, duration: 30 },
  { key: "combo", name: "Corte + barba", price: 85, duration: 60 },
  { key: "degrade", name: "Degradê navalhado", price: 65, duration: 45 },
  { key: "sobrancelha", name: "Sobrancelha", price: 20, duration: 15 },
];

export const services: Service[] = establishments.flatMap((e) =>
  serviceSeeds.map((s) => ({
    id: `${e.id}-${s.key}`,
    establishmentId: e.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.duration,
  })),
);

const clientNames = [
  "Lucas Pereira",
  "Mateus Carvalho",
  "Gabriel Rocha",
  "João Vitor Lima",
  "Pedro Henrique Dias",
  "Felipe Barros",
  "André Teixeira",
  "Rodrigo Pires",
  "Gustavo Ramos",
  "Eduardo Campos",
  "Vinícius Cardoso",
  "Leonardo Freitas",
  "Caio Martins",
  "Henrique Duarte",
];

export const clients: Client[] = clientNames.map((name, i) => ({
  id: `cli-${i + 1}`,
  establishmentId: establishments[i % establishments.length].id,
  name,
  // Fictional, non-validating CPF-shaped strings.
  cpf: String(10_000_000_000 + i * 7_654_321).slice(0, 11),
  // Obviously fake numbers (119000000xx).
  phone: `119000000${String(i + 10).padStart(2, "0")}`,
}));

/** Small deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function pastStatus(rand: () => number): AppointmentStatus {
  const r = rand();
  if (r < 0.86) return "DONE";
  if (r < 0.94) return "CANCELED";
  return "NO_SHOW";
}

function upcomingStatus(rand: () => number): AppointmentStatus {
  const r = rand();
  if (r < 0.55) return "CONFIRMED";
  if (r < 0.8) return "SCHEDULED";
  return "CONFIRMATION_PENDING";
}

export function appointmentCode(rand: () => number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => pick(rand, alphabet.split(""))).join(
    "",
  );
}

/**
 * Builds the appointment book: for each barber and open day, a random
 * subset of the day's slots is taken, never overlapping.
 */
export function generateAppointments(now: Date): Appointment[] {
  const rand = seededRandom(20260226);
  const result: Appointment[] = [];
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() + offset);
    if (CLOSED_WEEKDAYS.includes(day.getDay())) continue;

    // Busier on Fridays and Saturdays, emptier further into the future.
    const weekendBoost = day.getDay() >= 5 ? 0.2 : 0;
    const occupancy =
      offset > 0 ? 0.45 - offset * 0.025 + weekendBoost : 0.5 + weekendBoost;

    for (const barber of barbers) {
      const menu = services.filter(
        (s) => s.establishmentId === barber.establishmentId,
      );
      let minute = OPENING_MINUTES;
      while (minute < CLOSING_MINUTES) {
        const service = pick(rand, menu);
        const fits = minute + service.durationMinutes <= CLOSING_MINUTES;
        if (!fits || rand() > occupancy) {
          minute += SLOT_STEP_MINUTES;
          continue;
        }
        const startsAt = new Date(day);
        startsAt.setMinutes(minute);
        const endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60_000,
        );
        let status: AppointmentStatus;
        if (endsAt <= now) status = pastStatus(rand);
        else if (startsAt <= now) status = "IN_PROGRESS";
        else status = upcomingStatus(rand);

        const client = pick(
          rand,
          clients.filter((c) => c.establishmentId === barber.establishmentId),
        );
        result.push({
          id: `apt-${result.length + 1}`,
          code: appointmentCode(rand),
          establishmentId: barber.establishmentId,
          barberId: barber.id,
          clientId: client.id,
          serviceId: service.id,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          status,
          priceSnapshot: service.price,
          createdAt: new Date(
            startsAt.getTime() - 3 * 86_400_000,
          ).toISOString(),
        });
        minute +=
          Math.ceil(service.durationMinutes / SLOT_STEP_MINUTES) *
          SLOT_STEP_MINUTES;
      }
    }
  }
  return result;
}
