import { createHash } from "node:crypto";
import { canonicalJson, schemaRegistry, type SchemaIdentity } from "@afallon/contracts";
import type { ArtifactRef } from "@hotrepl/protocol";
import type { Static, TSchema } from "typebox";

const MODULE_ID = /^[a-z0-9][a-z0-9./-]*$/;

export interface ProbeSourceModule {
  readonly id: string;
  readonly source: string;
}

export interface ProbeModuleIdentity {
  readonly id: string;
  readonly sha256: string;
}

export interface ProbeBundle<T extends TSchema = TSchema> {
  readonly id: string;
  readonly schema: T;
  readonly schemaIdentity: SchemaIdentity;
  readonly modules: readonly ProbeModuleIdentity[];
  readonly source: string;
  readonly sha256: string;
}

export interface ProbeBundleDefinition<T extends TSchema> {
  readonly id: string;
  readonly schema: T;
  readonly modules: readonly ProbeSourceModule[];
}

export interface ProbeResult<T extends TSchema> {
  readonly reference: ArtifactRef;
  readonly value: Static<T>;
  readonly observationContext?: unknown;
  readonly bundleSha256: string;
  readonly compiled: boolean;
}

export async function createProbeBundle<T extends TSchema>(definition: ProbeBundleDefinition<T>): Promise<ProbeBundle<T>> {
  if (!MODULE_ID.test(definition.id)) throw new TypeError(`Invalid probe bundle identity: ${JSON.stringify(definition.id)}.`);
  if (definition.modules.length === 0) throw new TypeError("A probe bundle must import at least one source module.");
  const names = new Set<string>();
  const loaded = definition.modules.map(module => {
    if (!MODULE_ID.test(module.id)) throw new TypeError(`Invalid probe module identity: ${JSON.stringify(module.id)}.`);
    if (names.has(module.id)) throw new TypeError(`Probe bundle repeats module ${module.id}.`);
    names.add(module.id);
    const source = module.source;
    if (typeof source !== "string" || source.length === 0) throw new TypeError(`Probe module ${module.id} has no imported source.`);
    return { id: module.id, source, sha256: createHash("sha256").update(source).digest("hex") };
  });
  const registered = schemaRegistry.identify(definition.schema);
  const modules = loaded.map(({ id, sha256 }) => Object.freeze({ id, sha256 }));
  const sha256 = createHash("sha256").update(canonicalJson({
    id: definition.id,
    schema: { id: registered.id, sha256: registered.sha256 },
    modules,
  })).digest("hex");
  const source = loaded.map(module => `// afallon probe module: ${module.id} (${module.sha256})\n${module.source.replace(/\n?$/, "\n")}`).join("\n");
  return Object.freeze({
    id: definition.id,
    schema: definition.schema,
    schemaIdentity: Object.freeze({ id: registered.id, sha256: registered.sha256 }),
    modules: Object.freeze(modules),
    source,
    sha256,
  });
}
