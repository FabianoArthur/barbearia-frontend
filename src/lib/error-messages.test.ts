import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { getApiErrorMessage } from "./error-messages";

function apiError(status: number, data: unknown): AxiosError {
  const response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError(
    "Request failed",
    "ERR",
    undefined,
    undefined,
    response,
  );
}

describe("getApiErrorMessage", () => {
  it("translates known backend messages", () => {
    expect(
      getApiErrorMessage(apiError(401, { message: "Invalid credentials" })),
    ).toBe("E-mail ou senha incorretos.");
    expect(
      getApiErrorMessage(
        apiError(409, { message: "New time slot conflicts with booking" }),
      ),
    ).toBe("O horario selecionado conflita com outro agendamento.");
  });

  it("uses the first entry of validation message arrays", () => {
    expect(
      getApiErrorMessage(apiError(400, { message: ["cpf is invalid", "x"] })),
    ).toBe("CPF invalido.");
  });

  it("prefers specific patterns over the generic 'not found'", () => {
    expect(
      getApiErrorMessage(apiError(404, { message: "Barber not found" })),
    ).toBe("Barbeiro nao encontrado.");
  });

  it("passes through unknown backend messages", () => {
    expect(
      getApiErrorMessage(apiError(400, { message: "Something odd" })),
    ).toBe("Something odd");
  });

  it("falls back to the HTTP status when there is no message", () => {
    expect(getApiErrorMessage(apiError(429, {}))).toBe(
      "Muitas tentativas. Aguarde um momento.",
    );
  });

  it("maps network failures and hides other internal errors", () => {
    expect(getApiErrorMessage(new Error("Network Error"))).toBe(
      "Erro de conexao. Verifique sua internet.",
    );
    expect(getApiErrorMessage(new Error("boom"))).toBe(
      "Erro inesperado. Tente novamente.",
    );
    expect(getApiErrorMessage("??")).toBe("Erro inesperado. Tente novamente.");
  });
});
