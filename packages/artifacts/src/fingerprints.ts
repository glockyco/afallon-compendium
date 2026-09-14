import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import * as path from "node:path";
import { canonicalJson, type ContentIdentity, type SchemaIdentityReference, type StepFingerprint } from "@afallon/contracts";

export interface StepFingerprintInput {
  readonly entrypoint: string;
  readonly buildId: string;
  readonly settings: Record<string, unknown>;
  readonly schemas: readonly SchemaIdentityReference[];
  readonly inputs: Readonly<Record<string, ContentIdentity>>;
}

export async function fingerprintStep(input: StepFingerprintInput): Promise<StepFingerprint> {
  const entrypoint = await realpath(path.resolve(input.entrypoint));
  const build = await Bun.build({
    entrypoints: [entrypoint],
    target: "bun",
    format: "esm",
    splitting: false,
    sourcemap: "none",
    minify: true,
    metafile: true,
    loader: { ".csx": "text" },
  });
  if (!build.success) throw new AggregateError(build.logs, `Bun could not bundle step entrypoint ${entrypoint}.`);
  if (build.outputs.length !== 1) throw new Error(`Step entrypoint must produce one bundled output, received ${build.outputs.length}: ${entrypoint}.`);
  if (!build.metafile) throw new Error(`Bun did not return a metafile for step entrypoint ${entrypoint}.`);

  const outputBytes = new Uint8Array(await build.outputs[0]!.arrayBuffer());
  const implementation = createHash("sha256").update(outputBytes).digest("hex");
  const modulePaths = Object.keys(build.metafile.inputs).sort();
  const probeHashes: Record<string, string> = {};
  for (const modulePath of modulePaths.filter((candidate) => candidate.endsWith(".csx"))) {
    const candidatePath = path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath);
    const absolutePath = await realpath(candidatePath);
    const logicalPath = path.relative(path.dirname(entrypoint), absolutePath).split(path.sep).join("/");
    probeHashes[logicalPath] = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
  }

  const schemas = [...input.schemas].sort((left, right) => left.id.localeCompare(right.id));
  if (new Set(schemas.map((schema) => schema.id)).size !== schemas.length) throw new TypeError("Step fingerprint schemas must have unique identities.");
  const cacheKey = createHash("sha256").update(canonicalJson({
    buildId: input.buildId,
    implementation,
    settings: input.settings,
    schemas,
    inputs: input.inputs,
    probeHashes,
  })).digest("hex");
  return { implementation, cacheKey, transitiveModuleCount: modulePaths.length, probeHashes };
}
