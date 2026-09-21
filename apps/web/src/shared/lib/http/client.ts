import { API_URL } from "./config";
import { ApiError } from "./errors";
import { translateApiMessage } from "./messages";

function send(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    // The session is an httpOnly cookie the browser attaches on its own; JS
    // never sees the token.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // ngrok's free tier answers browser requests with an HTML warning page
      // unless this header is present (harmless when the API isn't behind ngrok).
      "ngrok-skip-browser-warning": "1",
      ...options.headers,
    },
  });
}

// The access cookie is short-lived (1h). On a 401 the API can swap the refresh
// cookie for a new pair; calls that fail together share one refresh, since the
// refresh token rotates.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= send("/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// These 401s mean "wrong credentials" / "no session", not "expired": no retry.
const NO_REFRESH = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/logout", "/auth/forgot", "/auth/confirm"];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) {
    response = await send(path, options);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, translateApiMessage(body.message, response.status), body.message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

const withBody = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body ? JSON.stringify(body) : undefined,
});

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, withBody("POST", body)),
  put: <T>(path: string, body?: unknown) => request<T>(path, withBody("PUT", body)),
  patch: <T>(path: string, body?: unknown) => request<T>(path, withBody("PATCH", body)),
  delete: <T>(path: string, body?: unknown) => request<T>(path, withBody("DELETE", body)),
};
