export class ApiError extends Error {
  status_code: number;
  constructor(status_code: number, message: string) {
    super(message);
    this.status_code = status_code;
  }
}

export const NETWORK_ERROR_MESSAGE = "Não foi possível falar com o servidor.";

// Message safe to show the user: the API's own text for ApiError, a generic
// one for anything else (network down, CORS, bug).
export function getErrorMessage(error: unknown, fallback = NETWORK_ERROR_MESSAGE): string {
  return error instanceof ApiError ? error.message : fallback;
}
