import type { Static, TSchema } from "typebox";
import { Assert } from "typebox/value";
import { schemaRegistry } from "./schema-registry";

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
