import { publicBookingSchema } from "./schemas";

const valid = {
  clientName: "  Joao Silva ",
  clientCpf: "123.456.789-01",
  clientPhone: "(11) 98765-4321",
};

function firstError(input: Partial<typeof valid>) {
  const result = publicBookingSchema.safeParse({ ...valid, ...input });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("publicBookingSchema", () => {
  it("normalises a valid booking form", () => {
    expect(publicBookingSchema.parse(valid)).toEqual({
      clientName: "Joao Silva",
      clientCpf: "12345678901",
      clientPhone: "11987654321",
    });
  });

  it("accepts accented names", () => {
    expect(firstError({ clientName: "Ândrea D'Ávila" })).toBeUndefined();
  });

  it.each([
    ["", "Por favor, informe seu nome completo."],
    ["Joao 2", "O nome nao pode conter numeros"],
    ["Joao_Silva x", "O nome contem caracteres invalidos"],
    ["Joao", "Informe seu nome e sobrenome"],
    ["Joao S", "Cada parte do nome deve ter pelo menos 2 letras"],
  ])("rejects the name %j", (clientName, message) => {
    expect(firstError({ clientName })).toContain(message);
  });

  it("requires exactly 11 CPF digits", () => {
    expect(firstError({ clientCpf: "123.456.789" })).toContain("CPF invalido");
  });

  it("validates Brazilian phone numbers with area code", () => {
    expect(firstError({ clientPhone: "" })).toContain("informe seu telefone");
    expect(firstError({ clientPhone: "(11) 1234" })).toContain(
      "telefone invalido",
    );
  });
});
