import type { AppointmentListItem, AppointmentStatus } from "@/types";
import {
  getMinutesUntilStart,
  isLate,
  isUnconfirmedAndClose,
} from "./appointment-utils";

const NOW = new Date("2026-03-10T14:00:00.000Z");

function appointment(
  status: AppointmentStatus,
  minutesFromNow: number,
): AppointmentListItem {
  return {
    id: "a1",
    barberId: "b1",
    barberName: "Barber",
    clientId: "c1",
    clientName: "Client",
    serviceId: "s1",
    serviceName: "Corte",
    serviceValue: 50,
    status,
    date: new Date(NOW.getTime() + minutesFromNow * 60_000).toISOString(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isLate", () => {
  it("is true when the start time has passed and the visit has not begun", () => {
    expect(isLate(appointment("CONFIRMED", -5))).toBe(true);
    expect(isLate(appointment("SCHEDULED", -1))).toBe(true);
  });

  it("is false for future appointments", () => {
    expect(isLate(appointment("CONFIRMED", 10))).toBe(false);
  });

  it.each<AppointmentStatus>(["IN_PROGRESS", "DONE", "CANCELED", "NO_SHOW"])(
    "is never true for terminal status %s",
    (status) => {
      expect(isLate(appointment(status, -60))).toBe(false);
    },
  );
});

describe("isUnconfirmedAndClose", () => {
  it("flags pending confirmations inside the threshold", () => {
    expect(isUnconfirmedAndClose(appointment("CONFIRMATION_PENDING", 30))).toBe(
      true,
    );
    expect(isUnconfirmedAndClose(appointment("CONFIRMATION_PENDING", -5))).toBe(
      true,
    );
  });

  it("ignores pending confirmations further away than the threshold", () => {
    expect(isUnconfirmedAndClose(appointment("CONFIRMATION_PENDING", 31))).toBe(
      false,
    );
    expect(
      isUnconfirmedAndClose(appointment("CONFIRMATION_PENDING", 50), 60),
    ).toBe(true);
  });

  it("ignores any other status", () => {
    expect(isUnconfirmedAndClose(appointment("CONFIRMED", 5))).toBe(false);
  });
});

describe("getMinutesUntilStart", () => {
  it("returns whole minutes, negative when overdue", () => {
    expect(getMinutesUntilStart(appointment("CONFIRMED", 45))).toBe(45);
    expect(getMinutesUntilStart(appointment("CONFIRMED", -3))).toBe(-3);
  });
});
