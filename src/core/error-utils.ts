export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: SerializedError;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error(safeStringify(error));
}

export function serializeError(error: unknown, depth = 0): SerializedError {
  const normalized = toError(error);
  const code = (normalized as Error & { code?: unknown }).code;
  const cause = (normalized as Error & { cause?: unknown }).cause;

  return {
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    code:
      typeof code === 'string' || typeof code === 'number'
        ? String(code)
        : undefined,
    cause:
      cause !== undefined && depth < 5
        ? serializeError(cause, depth + 1)
        : undefined,
  };
}

export function errorMessage(error: unknown): string {
  return toError(error).message;
}