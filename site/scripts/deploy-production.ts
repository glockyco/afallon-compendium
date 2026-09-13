import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { deploymentPaths } from "../deployment-paths.mjs";
import { stagePublication, type DeploymentMetadata } from "./stage-publication.ts";

const runArg = Bun.argv[2];
const origin = Bun.argv[3] ?? "https://afallon.compendiums.org";
if (!runArg) throw new Error("usage: deploy-production <publication-run-directory> [origin]");

const siteDir = resolve(import.meta.dirname, "..");
const metadata = stagePublication(resolve(process.cwd(), runArg), siteDir);
run("bun", ["run", "build:production"]);
run("bun", ["run", "assert:deployment"]);
// Keep the deployment command explicit: this service has static assets and no Worker entry point.
run("wrangler", ["deploy"]);
await smokeProduction(origin, metadata, siteDir);
process.stdout.write(`Production smoke passed for publication ${metadata.runId}.\n`);

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: siteDir,
    stdio: "inherit",
    env: { ...process.env, SITE_STAGE: "production" },
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}.`);
}

async function smokeProduction(origin: string, expected: DeploymentMetadata, siteDir: string): Promise<void> {
  const imagery = readdirSync(join(deploymentPaths(siteDir).outputDir, "data", "imagery"))
    .filter((name) => name.endsWith(".webp"))
    .sort()[0];
  if (!imagery) throw new Error("Deployment has no imagery probe.");

  const deadline = Date.now() + 120_000;
  let lastError: unknown = new Error("Production smoke did not run.");
  while (Date.now() < deadline) {
    try {
      await smokeOnce(origin, expected, imagery);
      return;
    } catch (error) {
      lastError = error;
      await Bun.sleep(5_000);
    }
  }
  throw lastError;
}

async function smokeOnce(origin: string, expected: DeploymentMetadata, imagery: string): Promise<void> {
  const deploymentResponse = await freshFetch(`${origin}/_deployment.json`);
  if (!deploymentResponse.ok) throw new Error(`/_deployment.json returned ${deploymentResponse.status}.`);
  const deployed = await deploymentResponse.json() as DeploymentMetadata;
  if (deployed.runId !== expected.runId || deployed.publicationSha256 !== expected.publicationSha256) {
    throw new Error(`Production still serves publication ${deployed.runId ?? "unknown"}.`);
  }

  const rootResponse = await freshFetch(`${origin}/`);
  if (!rootResponse.ok || !(await rootResponse.text()).includes("<title>Afallon Compendium</title>")) {
    throw new Error("The production atlas shell is unavailable.");
  }

  const publicationResponse = await freshFetch(`${origin}/data/publication.json`);
  if (!publicationResponse.ok) throw new Error(`/data/publication.json returned ${publicationResponse.status}.`);
  const publication = await publicationResponse.json() as { buildId?: unknown; mode?: unknown; coverage?: { complete?: unknown } };
  if (publication.buildId !== expected.buildId || publication.mode !== expected.mode || publication.coverage?.complete !== expected.coverageComplete) {
    throw new Error("The production publication identity does not match the deployment.");
  }

  const guideResponse = await freshFetch(`${origin}/guide/`);
  if (!guideResponse.ok || !(await guideResponse.text()).includes("Adventure Guide")) {
    throw new Error("The production Adventure Guide is unavailable.");
  }

  const imageResponse = await freshFetch(`${origin}/data/imagery/${imagery}`);
  if (!imageResponse.ok || !(imageResponse.headers.get("content-type") ?? "").includes("image/webp")) {
    throw new Error("The production imagery probe is unavailable.");
  }

  const missingResponse = await freshFetch(`${origin}/does-not-exist-${expected.runId}`);
  if (missingResponse.status !== 404 || !(await missingResponse.text()).includes("Page not found")) {
    throw new Error("An unknown production route did not return the custom 404 page.");
  }
}

function freshFetch(url: string): Promise<Response> {
  const separator = url.includes("?") ? "&" : "?";
  return fetch(`${url}${separator}smoke=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
}
