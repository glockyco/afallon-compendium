import { chmodSync, cpSync, mkdirSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { hashFile, listFiles, parseJson } from "./deployment-files";
import type { StaticResourceReference } from "@afallon/contracts/public";
import { verifyPublicationGraph } from "./publication-graph";
import { verifyPublicationParity } from "./publication-parity";
import { deploymentPaths } from "../deployment-paths.mjs";

interface SelectedPublication {
  root: StaticResourceReference;
  directory: string;
}

export interface DeploymentMetadata {
  schemaVersion: "afallon.deployment.v2";
  publicationId: string;
  buildId: string;
  catalogId: string;
  mode: "preview" | "release";
  coverageComplete: boolean;
  selectionSha256: string;
  publicationSha256: string;
}

export function stagePublication(publicationRoot: string, siteDir = resolve(import.meta.dirname, "..")): DeploymentMetadata {
  const root = resolve(publicationRoot);
  const selectionPath = join(root, "selected.json");
  const selection = parseJson<SelectedPublication>(selectionPath);
  const publicDir = realpathSync(join(root, selection.directory));
  if (relative(root, publicDir).startsWith("..")) throw new Error("Selected publication directory escapes its root.");
  const graph = verifyPublicationGraph(publicDir, selection.root);
  const { publication, files, sha256: publicationSha256 } = graph;
  if (publication.mode === "release" && !publication.complete) throw new Error("A release publication must report complete coverage.");
  verifyPublicationParity(graph, join(siteDir, "static", "data", "publication.json"));

  for (const relativePath of listFiles(publicDir)) {
    if (!files.has(relativePath)) throw new Error(`Selected publication has an unreferenced file: ${relativePath}.`);
  }

  const paths = deploymentPaths(siteDir);
  rmSync(paths.root, { recursive: true, force: true });
  mkdirSync(paths.staticDir, { recursive: true });
  copyTrackedStatic(join(siteDir, "static"), paths.staticDir);
  const stagedPublication = join(paths.staticDir, "data");
  cpSync(publicDir, stagedPublication, { recursive: true });
  makeWritable(stagedPublication);

  const metadata: DeploymentMetadata = {
    schemaVersion: "afallon.deployment.v2",
    publicationId: selection.root.sha256,
    buildId: publication.buildId,
    catalogId: publication.catalogId,
    mode: publication.mode,
    coverageComplete: publication.complete,
    selectionSha256: hashFile(selectionPath),
    publicationSha256,
  };
  writeFileSync(join(paths.staticDir, "_deployment.json"), `${JSON.stringify(metadata)}\n`);
  return metadata;
}

function makeWritable(root: string): void {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      chmodSync(path, 0o755);
      makeWritable(path);
    } else if (entry.isFile()) chmodSync(path, 0o644);
    else throw new Error(`Staged publication contains an unsupported entry: ${relative(root, path)}.`);
  }
}

function copyTrackedStatic(source: string, target: string): void {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.name === "data") continue;
    const sourcePath = join(source, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Tracked static asset cannot be a symlink: ${entry.name}`);
    cpSync(sourcePath, join(target, entry.name), { recursive: true });
  }
}


if (import.meta.main) {
  const publicationRoot = Bun.argv[2];
  if (!publicationRoot) throw new Error("usage: stage-publication <selected-publication-root>");
  process.stdout.write(`${JSON.stringify(stagePublication(publicationRoot), null, 2)}\n`);
}
