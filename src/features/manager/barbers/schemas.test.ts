import { addBarberSchema, updateBarberSchema } from "./schemas";

// Form inputs arrive as strings; the schemas coerce them to numbers.
describe("barber schemas", () => {
  it("coerces the commission typed into the form", () => {
    expect(updateBarberSchema.parse({ commissionPercent: "40" })).toEqual({
      commissionPercent: 40,
    });
    expect(updateBarberSchema.parse({ commissionPercent: 55 })).toEqual({
      commissionPercent: 55,
    });
  });

  it("keeps the commission between 0 and 100", () => {
    expect(
      updateBarberSchema.safeParse({ commissionPercent: "101" }).error
        ?.issues[0]?.message,
    ).toBe("Maximo 100%");
    expect(
      updateBarberSchema.safeParse({ commissionPercent: -1 }).error?.issues[0]
        ?.message,
    ).toBe("Minimo 0%");
  });

  it("validates a new barber account", () => {
    const result = addBarberSchema.safeParse({
      name: "Rafa",
      email: "not-an-email",
      password: "123",
      establishmentId: "",
      commissionPercent: "50",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toEqual([
      "email",
      "password",
      "establishmentId",
    ]);
  });
});
