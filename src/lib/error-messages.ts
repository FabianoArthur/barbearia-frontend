import { AxiosError } from "axios";

/**
 * Backend error codes mapped to user-friendly PT-BR messages.
 * Keys are matched case-insensitively against the `message` field
 * in backend error responses.
 */
const ERROR_PATTERNS: [RegExp, string][] = [
  // Auth
  [/invalid credentials/i, "E-mail ou senha incorretos."],
  [/token expired/i, "Sessao expirada. Faca login novamente."],
  [
    /invalid or expired refresh token/i,
    "Sessao expirada. Faca login novamente.",
  ],
  [
    /csrf.*token|invalid.*csrf|csrf.*invalid|csrf.*missing/i,
    "Token de seguranca invalido. Recarregue a pagina e tente novamente.",
  ],
  [/unauthorized/i, "Voce nao tem permissao para esta acao."],
  [/forbidden/i, "Voce nao tem permissao para esta acao."],

  // Appointments
  [/already confirmed/i, "Este agendamento ja foi confirmado."],
  [/already canceled/i, "Este agendamento ja foi cancelado."],
  [/already.*finalized|already.*done/i, "Este agendamento ja foi finalizado."],
  [/cannot confirm/i, "Nao e possivel confirmar este agendamento."],
  [/cannot cancel/i, "Nao e possivel cancelar este agendamento."],
  [/cannot reschedule/i, "Nao e possivel reagendar este agendamento."],
  [
    /invalid status transition or amount/i,
    "Transicao de status invalida ou valor incorreto.",
  ],
  [/invalid status transition/i, "Transicao de status invalida."],
  [
    /slot.*conflict|time.*conflict|new time slot conflicts/i,
    "O horario selecionado conflita com outro agendamento.",
  ],
  [/no available slot/i, "Nao ha horarios disponiveis para esta data."],
  [/appointment.*not.*found/i, "Agendamento nao encontrado."],

  // Notifications
  [
    /not in SCHEDULED status|not in scheduled/i,
    "O agendamento nao esta no status correto para envio.",
  ],
  [/has no phone|no phone/i, "O cliente nao possui telefone cadastrado."],
  [
    /invalid state for sending reminder/i,
    "O agendamento nao esta no estado correto para envio de lembrete.",
  ],

  // Barbers / Users
  [
    /email.*already.*use|email.*in.*use|duplicate.*email/i,
    "Este e-mail ja esta em uso.",
  ],
  [
    /barber.*has.*booking|barber.*has.*appointment/i,
    "Nao e possivel remover este barbeiro pois ele possui agendamentos.",
  ],
  [/barber.*not.*found/i, "Barbeiro nao encontrado."],
  [/user.*not.*found/i, "Usuario nao encontrado."],

  // Establishments
  [
    /establishment.*has.*booking|establishment.*has.*appointment/i,
    "Nao e possivel remover este estabelecimento pois ele possui agendamentos.",
  ],
  [/establishment.*not.*found/i, "Estabelecimento nao encontrado."],

  // Services
  [/service.*not.*found/i, "Servico nao encontrado."],
  [
    /service.*has.*booking|service.*has.*appointment/i,
    "Nao e possivel remover este servico pois ele possui agendamentos.",
  ],

  // Payments
  [/refund.*not.*found/i, "Reembolso nao encontrado."],
  [/payment.*not.*found/i, "Pagamento nao encontrado."],
  [/invalid.*refund/i, "Reembolso invalido."],
  [/refund.*exceeds/i, "O valor do reembolso excede o valor pago."],

  // Finance
  [/fee.*config.*not.*found/i, "Configuracao de taxa nao encontrada."],
  [/expense.*not.*found/i, "Despesa nao encontrada."],

  // Clients
  [/client.*not.*found/i, "Cliente nao encontrado."],
  [/cpf.*already|duplicate.*cpf/i, "Ja existe um cliente com este CPF."],

  // Generic (keep at end — broader patterns)
  [/not found/i, "Recurso nao encontrado."],
  [
    /validation.*fail|bad.*request/i,
    "Dados invalidos. Verifique os campos e tente novamente.",
  ],
  [/phone.*invalid|invalid.*phone/i, "Numero de telefone invalido."],
  [/cpf.*invalid|invalid.*cpf/i, "CPF invalido."],
];

const STATUS_FALLBACKS: Record<number, string> = {
  400: "Requisicao invalida. Verifique os dados.",
  401: "Sessao expirada. Faca login novamente.",
  403: "Voce nao tem permissao para esta acao.",
  404: "Recurso nao encontrado.",
  409: "Conflito: o recurso ja foi modificado ou o horario esta ocupado.",
  422: "Dados invalidos. Verifique os campos.",
  429: "Muitas tentativas. Aguarde um momento.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
};

const DEFAULT_ERROR = "Erro inesperado. Tente novamente.";

/**
 * Extracts a user-friendly error message from an API error.
 *
 * 1. Tries to match the backend `message` against known patterns.
 * 2. Falls back to HTTP status-based messages.
 * 3. Falls back to a generic message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    const backendMessage: string =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message[0]
          : "";

    if (backendMessage) {
      for (const [pattern, friendlyMessage] of ERROR_PATTERNS) {
        if (pattern.test(backendMessage)) {
          return friendlyMessage;
        }
      }
      return backendMessage;
    }

    if (status && STATUS_FALLBACKS[status]) {
      return STATUS_FALLBACKS[status];
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message.includes("Network Error")) {
      return "Erro de conexao. Verifique sua internet.";
    }
  }

  return DEFAULT_ERROR;
}
