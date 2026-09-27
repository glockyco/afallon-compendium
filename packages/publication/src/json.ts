// Narrowing for the opaque gameplay and source payloads that the catalog stores as JSON.

export type JsonRecord = Record<string, unknown>;

export function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

export function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
