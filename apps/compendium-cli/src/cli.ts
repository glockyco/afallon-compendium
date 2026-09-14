import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { capture } from "@afallon/capture";
import type { CapturePlan } from "@afallon/contracts";
import { withRuntime } from "@afallon/runtime";
import { buildIdentity, toolRevision } from "./build";
import { runCatalogCommand } from "./catalog";
import { loadConfig } from "./config";
import { runPublishCommand } from "./publish";
import { runScanCommand } from "./scan";

const HELP = `Usage:
  bun run compendium scan --config FILE --plan FILE
  bun run compendium capture --config FILE --plan FILE [--plan FILE ...]
  bun run compendium catalog --plan FILE --output DIRECTORY
  bun run compendium publish --plan FILE
  bun run compendium preview
  bun run compendium deploy PUBLICATION_ROOT [ORIGIN]

scan and capture use the configured HotRepl runtime. catalog and publish are offline.
preview serves the staged static site. deploy publishes the staged production build.`;

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    config: { type: "string" },
    plan: { type: "string", multiple: true },
    output: { type: "string" },
  },
});

function plans(): string[] {
  if (values.plan === undefined) return [];
  return (Array.isArray(values.plan) ? values.plan : [values.plan]).map((path) => resolve(path));
}

async function runSiteCommand(command: string[], cwd: string): Promise<void> {
  const child = Bun.spawn(command, { cwd, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`Site command failed with exit code ${exitCode}: ${command.join(" ")}.`);
}

async function main(): Promise<void> {
  const command = positionals[0];
  if (values.help || command === undefined) { console.log(HELP); return; }
  if (!(["scan", "capture", "catalog", "publish", "preview", "deploy"] as string[]).includes(command)) throw new Error(`Unknown command: ${command}. Use --help.`);
  const planPaths = plans();
  if (command === "preview") {
    if (positionals.length !== 1 || values.config || values.output || planPaths.length > 0) throw new Error("preview does not accept operands or options.");
    await runSiteCommand(["bun", "run", "preview"], resolve(import.meta.dir, "../../site"));
    return;
  }
  if (command === "deploy") {
    if (values.config || values.output || planPaths.length > 0 || positionals.length < 2 || positionals.length > 3) throw new Error("deploy requires PUBLICATION_ROOT and accepts one optional ORIGIN.");
    const repositoryRoot = resolve(import.meta.dir, "../../..");
    const deploy = resolve(repositoryRoot, "apps/site/scripts/deploy-production.ts");
    const operands = [resolve(positionals[1]!), ...(positionals[2] ? [positionals[2]] : [])];
    await runSiteCommand(["bun", deploy, ...operands], repositoryRoot);
    return;
  }
  if (positionals.length !== 1) throw new Error(`${command} does not accept positional operands.`);
  if (command === "catalog") {
    if (values.config || !values.output || planPaths.length !== 1) throw new Error("catalog requires one --plan and --output, and does not accept --config.");
    console.log(JSON.stringify({ ok: true, ...await runCatalogCommand(planPaths[0]!, resolve(values.output)) }, null, 2));
    return;
  }
  if (command === "publish") {
    if (values.config || values.output || planPaths.length !== 1) throw new Error("publish requires one --plan and does not accept --config or --output.");
    console.log(JSON.stringify({ ok: true, ...await runPublishCommand(planPaths[0]!) }, null, 2));
    return;
  }
  if (!values.config) throw new Error(`${command} requires --config.`);
  if (values.output) throw new Error(`${command} does not accept --output.`);
  if (planPaths.length === 0 || (command === "scan" && planPaths.length !== 1)) throw new Error(`${command} requires ${command === "scan" ? "one" : "at least one"} --plan.`);
  const config = await loadConfig(values.config);
  const identity = await buildIdentity(config);
  const revision = await toolRevision();
  await withRuntime(config, async (runtime) => {
    if (command === "scan") {
      const result = await runScanCommand(runtime, { config, buildId: identity.buildId, diagnosticRevision: revision, plan: await Bun.file(planPaths[0]!).json() });
      console.log(JSON.stringify({ ok: result.manifest.status === "succeeded", buildId: identity.buildId, manifest: result.manifestPath, targets: result.targets.map((target) => ({ identity: target.targetIdentity, outcome: target.outcome, diagnostics: target.diagnostics })) }, null, 2));
      if (result.manifest.status !== "succeeded") throw new Error(`Scan failed; evidence is preserved in ${result.manifestPath}.`);
      return;
    }
    const capturePlans = await Promise.all(planPaths.map(async (path) => ({ plan: await Bun.file(path).json() as CapturePlan, path })));
    const result = await capture(runtime, config, { ...identity, diagnosticRevision: revision }, capturePlans);
    console.log(JSON.stringify({ ok: true, buildId: identity.buildId, ...result }, null, 2));
  });
}

await main();
