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
    // Fingerprint declared dependencies even when unused exports let the bundler omit them.
    ignoreDCEAnnotations: true,
    metafile: true,
    loader: { ".csx": "text", ".py": "text" },
  });
  if (!build.success) throw new AggregateError(build.logs, `Bun could not bundle step entrypoint ${entrypoint}.`);
  if (build.outputs.length !== 1) throw new Error(`Step entrypoint must produce one bundled output, received ${build.outputs.length}: ${entrypoint}.`);
  if (!build.metafile) throw new Error(`Bun did not return a metafile for step entrypoint ${entrypoint}.`);

  const modulePaths = Object.keys(build.metafile.inputs).sort();
  const probeHashes: Record<string, string> = {};
  const modules: { id: string; sha256: string; imports: { id: string; kind: string; attributes: Record<string, string> }[] }[] = [];
  const logicalIds = new Map<string, string>();
  for (const modulePath of modulePaths) {
    const candidatePath = path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath);
    const absolutePath = await realpath(candidatePath);
    const logicalPath = path.relative(path.dirname(entrypoint), absolutePath).split(path.sep).join("/");
    const sha256 = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
    logicalIds.set(modulePath, logicalPath);
    modules.push({ id: logicalPath, sha256, imports: [] });
    if (modulePath.endsWith(".csx") || modulePath.endsWith(".py")) probeHashes[logicalPath] = sha256;
  }
  for (const [index, modulePath] of modulePaths.entries()) {
    modules[index]!.imports = build.metafile.inputs[modulePath]!.imports.map(edge => ({
      id: logicalIds.get(edge.path) ?? (path.isAbsolute(edge.path) ? path.relative(path.dirname(entrypoint), edge.path).split(path.sep).join("/") : edge.path),
      kind: edge.kind,
      attributes: edge.with ?? {},
    }));
  }
  modules.sort((left, right) => left.id.localeCompare(right.id));
  const implementation = createHash("sha256").update(canonicalJson({
    algorithm: "compendium.executable-closure.v2",
    runtime: Bun.version,
    modules,
  })).digest("hex");

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
