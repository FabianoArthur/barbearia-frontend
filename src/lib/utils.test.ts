import { formatCpfInput, formatCurrency, formatPhone } from "./utils";

describe("formatCpfInput", () => {
  it.each([
    ["", ""],
    ["123", "123"],
    ["1234", "123.4"],
    ["1234567", "123.456.7"],
    ["1234567890", "123.456.789-0"],
    ["12345678901", "123.456.789-01"],
  ])("masks %j as %j", (input, expected) => {
    expect(formatCpfInput(input)).toBe(expected);
  });

  it("drops non-digits and anything past 11 digits", () => {
    expect(formatCpfInput("123.456.789-0199")).toBe("123.456.789-01");
  });
});

describe("formatPhone", () => {
  it.each([
    ["11", "11"],
    ["11987", "(11) 987"],
    ["11987654321", "(11) 98765-4321"],
    ["(11) 98765-4321 ext", "(11) 98765-4321"],
  ])("masks %j as %j", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });
});

describe("formatCurrency", () => {
  it("formats numbers as Brazilian reais", () => {
    // Intl uses a non-breaking space between the symbol and the amount.
    expect(formatCurrency(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(formatCurrency(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
});
