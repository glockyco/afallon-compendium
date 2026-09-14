import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { deploymentPaths } from "../deployment-paths.mjs";
import { stagePublication, type DeploymentMetadata } from "./stage-publication.ts";

const currentArg = Bun.argv[2];
const previousArg = Bun.argv[3];
if (!currentArg || !previousArg) {
  throw new Error("usage: verify-deployment <current-publication-run> <previous-publication-run>");
}

const siteDir = resolve(import.meta.dirname, "..");
const currentRun = resolve(process.cwd(), currentArg);
const previousRun = resolve(process.cwd(), previousArg);

const previous = build(previousRun);
const current = build(currentRun);
const restored = build(previousRun);
if (restored.runId !== previous.runId || restored.publicationSha256 !== previous.publicationSha256) {
  throw new Error("Restaging the prior publication did not restore its identity.");
}
const final = build(currentRun);
if (final.runId !== current.runId || final.publicationSha256 !== current.publicationSha256) {
  throw new Error("Restaging the current publication did not restore its identity.");
}

process.stdout.write(`Local rollback restored ${previous.runId}; deployment stage returned to ${current.runId}.\n`);

function build(runDirectory: string): DeploymentMetadata {
  const expected = stagePublication(runDirectory, siteDir);
  run("bun", ["run", "build:production"]);
  run("bun", ["run", "assert:deployment"]);
  const actual = JSON.parse(readFileSync(join(deploymentPaths(siteDir).outputDir, "_deployment.json"), "utf8")) as DeploymentMetadata;
  if (actual.runId !== expected.runId || actual.publicationSha256 !== expected.publicationSha256) {
    throw new Error(`Built deployment does not match staged publication ${expected.runId}.`);
  }
  return actual;
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: siteDir,
    stdio: "inherit",
    env: { ...process.env, SITE_STAGE: "production" },
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}.`);
}
