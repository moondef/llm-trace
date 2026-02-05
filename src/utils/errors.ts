import type { SerializedError } from "../types.ts";

export function serializeError(err: unknown): SerializedError {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  return { message: String(err) };
}
