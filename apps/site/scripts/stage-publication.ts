import { createHash } from "node:crypto";
import { cpSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { deploymentPaths } from "../deployment-paths.mjs";

interface RunManifest {
  runId: string;
  input: {
    buildId: string;
    command: string;
    settings: { mode?: unknown };
  };
  status: string;
  artifacts: Array<{ path: string; bytes: number; sha256: string }>;
}

interface Publication {
  schemaVersion: string;
  buildId: string;
  mode: "preview" | "release";
  coverage: { complete: boolean };
}

export interface DeploymentMetadata {
  schemaVersion: "afallon.deployment.v1";
  runId: string;
  buildId: string;
  mode: "preview" | "release";
  coverageComplete: boolean;
  sourceManifestSha256: string;
  publicationSha256: string;
}

export function stagePublication(runDirectory: string, siteDir = resolve(import.meta.dirname, "..")): DeploymentMetadata {
  const runDir = resolve(runDirectory);
  const manifestPath = join(runDir, "manifest.json");
  const publicDir = join(runDir, "public");
  const manifest = parseJson<RunManifest>(manifestPath);
  const publication = parseJson<Publication>(join(publicDir, "publication.json"));

  if (manifest.status !== "succeeded" || manifest.input.command !== "publication") {
    throw new Error("Deployment requires a successful publication run.");
  }
  if (publication.mode !== "preview" && publication.mode !== "release") {
    throw new Error("Publication mode must be preview or release.");
  }
  if (manifest.input.buildId !== publication.buildId || manifest.input.settings.mode !== publication.mode) {
    throw new Error("Publication identity does not match its run manifest.");
  }
  if (publication.mode === "release" && !publication.coverage.complete) {
    throw new Error("A release publication must report complete coverage.");
  }

  const publicFiles = listFiles(publicDir);
  const expected = new Map(
    manifest.artifacts
      .filter((artifact) => artifact.path.startsWith("public/"))
      .map((artifact) => [artifact.path.slice("public/".length), artifact]),
  );
  if (publicFiles.length !== expected.size) {
    throw new Error(`Public artifact count mismatch: manifest=${expected.size}, directory=${publicFiles.length}.`);
  }

  for (const relativePath of publicFiles) {
    assertPublicPath(relativePath);
    const artifact = expected.get(relativePath);
    if (!artifact) throw new Error(`Public file is absent from the run manifest: ${relativePath}`);
    const path = join(publicDir, relativePath);
    const bytes = lstatSync(path).size;
    const sha256 = hashFile(path);
    if (bytes !== artifact.bytes || sha256 !== artifact.sha256) {
      throw new Error(`Public file does not match the run manifest: ${relativePath}`);
    }
  }

  const paths = deploymentPaths(siteDir);
  rmSync(paths.root, { recursive: true, force: true });
  mkdirSync(paths.staticDir, { recursive: true });
  copyTrackedStatic(join(siteDir, "static"), paths.staticDir);
  symlinkSync(publicDir, join(paths.staticDir, "data"), "dir");

  const metadata: DeploymentMetadata = {
    schemaVersion: "afallon.deployment.v1",
    runId: manifest.runId,
    buildId: publication.buildId,
    mode: publication.mode,
    coverageComplete: publication.coverage.complete,
    sourceManifestSha256: hashFile(manifestPath),
    publicationSha256: hashFile(join(publicDir, "publication.json")),
  };
  writeFileSync(join(paths.staticDir, "_deployment.json"), `${JSON.stringify(metadata)}\n`);
  return metadata;
}

function copyTrackedStatic(source: string, target: string): void {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.name === "data") continue;
    const sourcePath = join(source, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Tracked static asset cannot be a symlink: ${entry.name}`);
    cpSync(sourcePath, join(target, entry.name), { recursive: true });
  }
}

function assertPublicPath(path: string): void {
  const allowed = path === "publication.json"
    || /^guide-[a-z0-9-]+\.json$/.test(path)
    || /^details\/(?:entities|items)-\d{4}\.json$/.test(path)
    || /^imagery\/[0-9a-f]{64}\.webp$/.test(path);
  if (!allowed) throw new Error(`Public artifact has an unsupported path: ${path}`);
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Public artifact cannot contain a symlink: ${relative(root, path)}`);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(relative(root, path).split(sep).join("/"));
      else throw new Error(`Public artifact contains a non-file entry: ${relative(root, path)}`);
    }
  };
  visit(root);
  return files.sort();
}

function parseJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

if (import.meta.main) {
  const runDirectory = Bun.argv[2];
  if (!runDirectory) throw new Error("usage: stage-publication <publication-run-directory>");
  process.stdout.write(`${JSON.stringify(stagePublication(runDirectory), null, 2)}\n`);
}
