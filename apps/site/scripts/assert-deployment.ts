import { lstatSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { hashFile, listFiles, parseJson } from "./deployment-files";
import { deploymentPaths } from "../deployment-paths.mjs";
import { verifyPublicationGraph } from "./publication-graph";
import type { DeploymentMetadata } from "./stage-publication.ts";

const FREE_ASSET_LIMIT = 20_000;
const MAX_ASSET_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".html", ".json", ".js", ".css", ".webp", ".png", ".ico", ""]);
const siteDir = resolve(import.meta.dirname, "..");
const outputDir = deploymentPaths(siteDir).outputDir;
const files = listFiles(outputDir);

for (const required of ["index.html", "404.html", "items/index.html", "coverage/index.html", "data/publication.json", "_deployment.json", "_headers", "favicon.ico", "favicon-32x32.png", "apple-touch-icon.png", "logo.png", "og-default.png"]) {
  if (!files.includes(required)) throw new Error(`Deployment output is missing ${required}.`);
}
if (files.length > FREE_ASSET_LIMIT) {
  throw new Error(`Deployment contains ${files.length} files; Cloudflare Free permits ${FREE_ASSET_LIMIT}.`);
}

let totalBytes = 0;
let largest = { path: "", bytes: 0 };
for (const relativePath of files) {
  const bytes = lstatSync(join(outputDir, relativePath)).size;
  totalBytes += bytes;
  if (bytes > largest.bytes) largest = { path: relativePath, bytes };
  if (bytes > MAX_ASSET_BYTES) {
    throw new Error(`${relativePath} is ${bytes} bytes; Cloudflare permits at most ${MAX_ASSET_BYTES}.`);
  }
  const extension = extname(relativePath);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(`Deployment output has an unsupported file type: ${relativePath}`);
  }
}

const metadata = parseJson<DeploymentMetadata>(join(outputDir, "_deployment.json"));
const publicationPath = join(outputDir, "data", "publication.json");
const { publication } = verifyPublicationGraph(join(outputDir, "data"));
if (metadata.schemaVersion !== "afallon.deployment.v2") throw new Error("Deployment metadata has an unsupported schema.");
if (metadata.buildId !== publication.buildId || metadata.catalogId !== publication.catalogId || metadata.mode !== publication.mode || metadata.coverageComplete !== publication.complete) {
  throw new Error("Deployment metadata does not match the staged publication.");
}
if (metadata.publicationSha256 !== hashFile(publicationPath)) throw new Error("The staged publication hash changed during the build.");
if (publication.mode === "release" && !publication.complete) throw new Error("A release publication must report complete coverage.");
if (publication.mode === "preview" && publication.complete) throw new Error("A preview publication cannot report complete coverage.");

process.stdout.write(`${JSON.stringify({
  publicationId: metadata.publicationId,
  buildId: metadata.buildId,
  mode: metadata.mode,
  coverageComplete: metadata.coverageComplete,
  files: files.length,
  bytes: totalBytes,
  largest,
}, null, 2)}\n`);
