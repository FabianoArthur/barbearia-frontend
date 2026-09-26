import {
  formatDate,
  formatDateString,
  parseDate,
  parseDateRange,
} from "./date-utils";

describe("formatDate", () => {
  it("formats full ISO dates as dd/MM/yyyy", () => {
    expect(formatDate("2026-02-09")).toBe("09/02/2026");
  });

  it("formats month-only and year-only values", () => {
    expect(formatDate("2026-02")).toBe("02/2026");
    expect(formatDate("2026")).toBe("2026");
  });

  it("returns unknown formats untouched", () => {
    expect(formatDate("W07")).toBe("W07");
  });
});

describe("parseDate / formatDateString", () => {
  it("round-trips a YYYY-MM-DD string", () => {
    const date = parseDate("2026-12-31");
    expect(date).toBeInstanceOf(Date);
    expect(formatDateString(date)).toBe("2026-12-31");
  });

  it("returns undefined / empty string for missing or invalid input", () => {
    expect(parseDate("")).toBeUndefined();
    expect(parseDate("not-a-date")).toBeUndefined();
    expect(formatDateString(undefined)).toBe("");
  });

  it("parses both ends of a range", () => {
    const { from, to } = parseDateRange("2026-01-01", "");
    expect(formatDateString(from)).toBe("2026-01-01");
    expect(to).toBeUndefined();
  });
});
