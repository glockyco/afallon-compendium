import { createHash } from "node:crypto";

export class CanonicalJsonError extends TypeError {
  override name = "CanonicalJsonError";
}

export function canonicalJson(value: unknown): string {
  return serialize(value, "$", new WeakSet<object>());
}

export function canonicalJsonSha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function serialize(value: unknown, path: string, ancestors: WeakSet<object>): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new CanonicalJsonError(`${path} contains a non-finite number`);
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new CanonicalJsonError(`${path} contains unsupported ${typeof value}`);
  }
  if (ancestors.has(value)) throw new CanonicalJsonError(`${path} contains a cycle`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item, index) => serialize(item, `${path}[${index}]`, ancestors)).join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new CanonicalJsonError(`${path} contains a non-plain object`);
    }

    const entries: Array<[string, unknown]> = [];
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) {
        throw new CanonicalJsonError(`${path}.${key} is not a data property`);
      }
      entries.push([key, descriptor.value]);
    }
    entries.sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${serialize(item, `${path}.${key}`, ancestors)}`).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}
