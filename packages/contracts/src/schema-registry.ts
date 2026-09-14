import type { TSchema } from "typebox";
import { canonicalJson, canonicalJsonSha256 } from "./canonical-json";

const SCHEMA_ID = /^[a-z][a-z0-9.-]*\.v[1-9][0-9]*$/;

export interface SchemaIdentity {
  readonly id: string;
  readonly sha256: string;
}

export interface RegisteredSchema<T extends TSchema = TSchema> extends SchemaIdentity {
  readonly schema: T;
}

export class SchemaRegistry {
  readonly #schemas = new Map<string, RegisteredSchema>();
  readonly #identities = new WeakMap<TSchema, RegisteredSchema>();

  register<T extends TSchema>(id: string, schema: T): RegisteredSchema<T> {
    if (!SCHEMA_ID.test(id)) throw new TypeError(`Invalid schema identity: ${JSON.stringify(id)}`);
    if (this.#schemas.has(id)) throw new Error(`Schema identity is already registered: ${id}`);

    canonicalJson(schema);
    const snapshot = deepFreeze(schema);
    const registered = Object.freeze({ id, sha256: canonicalJsonSha256(normalizeSchemaIdentity(snapshot)), schema: snapshot });
    this.#schemas.set(id, registered);
    this.#identities.set(snapshot, registered);
    return registered;
  }

  identify<T extends TSchema>(schema: T): RegisteredSchema<T> {
    const registered = this.#identities.get(schema);
    if (!registered) throw new Error("Schema is not registered.");
    return registered as RegisteredSchema<T>;
  }

  get(id: string): RegisteredSchema | undefined {
    return this.#schemas.get(id);
  }

  require(id: string): RegisteredSchema {
    const registered = this.get(id);
    if (!registered) throw new Error(`Schema identity is not registered: ${id}`);
    return registered;
  }

  entries(): readonly RegisteredSchema[] {
    return [...this.#schemas.values()].sort((left, right) => left.id.localeCompare(right.id));
  }
}

export const schemaRegistry = new SchemaRegistry();

function normalizeSchemaIdentity(value: unknown, parentKey = ""): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => normalizeSchemaIdentity(item));
    if ((parentKey === "required" || parentKey === "enum" || parentKey === "type") && normalized.every((item) => typeof item === "string")) {
      return [...normalized].sort((left, right) => left.localeCompare(right));
    }
    return normalized;
  }
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeSchemaIdentity(item, key)]));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
