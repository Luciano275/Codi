const FRAMEWORK_ERROR_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Volvé a iniciar sesión.',
  403: 'No tenés permisos para esta acción.',
  429: 'Demasiados intentos. Esperá un momento y volvé a intentar.',
};

const SERVER_ERROR_MESSAGE = 'El servidor no pudo responder. Intentá más tarde.';

interface ApiErrorInput {
  status: number;
  message?: unknown;
  fallback: string;
  overrides?: Record<number, string>;
}

/**
 * Resuelve el texto que ve el usuario a partir de una respuesta de la API.
 * Los status sin copy propio del dominio (401, 403, 429, 5xx) se traducen acá;
 * el resto conserva el mensaje del backend, que en los 4xx de negocio sí es
 * texto pensado para leerse.
 */
export function readApiErrorMessage({
  status,
  message,
  fallback,
  overrides,
}: ApiErrorInput): string {
  const byStatus = overrides?.[status] ?? FRAMEWORK_ERROR_MESSAGES[status];
  if (byStatus) return byStatus;
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  if (typeof message === 'string' && message) return message;
  return fallback;
}
