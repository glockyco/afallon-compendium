import type { Static, TSchema } from "typebox";
import { Compile, type Validator } from "typebox/compile";
import { Assert } from "typebox/value";
import { schemaRegistry } from "./schema-registry";

// A compiled validator accepts the same values as `Assert` and is about a hundred times faster on large evidence
// documents. When it rejects a value, `Assert` runs to produce the error.
const validators = new WeakMap<TSchema, Validator<{}, TSchema>>();
function validator(schema: TSchema): Validator<{}, TSchema> {
  let compiled = validators.get(schema);
  if (compiled === undefined) { compiled = Compile(schema); validators.set(schema, compiled); }
  return compiled;
}
function accepts<T extends TSchema>(schema: T, value: unknown): value is Static<T> {
  return validator(schema).Check(value);
}

export interface ContractDecodeContext {
  readonly objectId: string;
  readonly target: string;
}

export class ContractDecodeError extends TypeError {
  readonly objectId: string;
  readonly schemaId: string;
  readonly instancePath: string;
  readonly target: string;

  constructor(context: ContractDecodeContext, schemaId: string, instancePath: string, detail: string, cause: unknown) {
    super(`Artifact ${context.objectId} failed ${schemaId} at ${instancePath} for ${context.target}: ${detail}`, { cause });
    this.name = "ContractDecodeError";
    this.objectId = context.objectId;
    this.schemaId = schemaId;
    this.instancePath = instancePath;
    this.target = context.target;
  }
}

export function decodeContract<T extends TSchema>(schema: T, value: unknown, context: ContractDecodeContext): Static<T> {
  const { id } = schemaRegistry.identify(schema);
  try {
    if (accepts(schema, value)) return value;
    Assert(schema, value);
    return value;
  } catch (error) {
    const failure = firstFailure(error);
    throw new ContractDecodeError(context, id, failure.instancePath, failure.detail, error);
  }
}

function firstFailure(error: unknown): { instancePath: string; detail: string } {
  const cause = error instanceof Error && error.cause !== null && typeof error.cause === "object"
    ? error.cause as Record<string, unknown>
    : null;
  const errors = Array.isArray(cause?.errors) ? cause.errors : [];
  const failure = errors.length > 0 && errors[0] !== null && typeof errors[0] === "object"
    ? errors[0] as Record<string, unknown>
    : null;
  return {
    instancePath: typeof failure?.instancePath === "string" && failure.instancePath.length > 0 ? failure.instancePath : "/",
    detail: typeof failure?.message === "string" ? failure.message : "Schema validation failed.",
  };
}
