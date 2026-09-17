import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { Assert } from "typebox/value";
import { capture, generateTiles, validateCapturePlan } from "@afallon/capture";
import { ArtifactStore } from "@afallon/artifacts";
import { CapturePlanSchema, TilePlanSchema } from "@afallon/contracts";
import "@afallon/contracts/public";
import { validateScanPlanStructure } from "@afallon/scan";
import { withRuntime } from "@afallon/runtime";
import { buildIdentity, toolRevision } from "./build";
import { runCatalogCommand } from "./catalog";
import { loadConfig } from "./config";
import { runPublishCommand } from "./publish";
import { registerInput } from "./register";
import { runScanCommand } from "./scan";

const HELP = `Usage:
  bun run compendium scan --config FILE --plan FILE [--candidate]
  bun run compendium capture --config FILE --plan FILE [--plan FILE ...] [--candidate]
  bun run compendium register --store DIRECTORY --build ID --file FILE [--schema ID] [--candidate]
  bun run compendium pyramid --store DIRECTORY --plan FILE [--candidate]
  bun run compendium catalog --store DIRECTORY --plan FILE [--candidate]
  bun run compendium publish --store DIRECTORY --output DIRECTORY --plan FILE [--candidate]
  bun run compendium preview
  bun run compendium deploy PUBLICATION_ROOT [ORIGIN]

scan and capture use the configured HotRepl runtime. Other data commands are offline.
register stores reviewed inputs or binary assets and reports immutable content identities.
Plans reference objects in --store; local paths are transport arguments, not evidence identities.
--candidate produces verified output without replacing successful references.
preview builds and serves the staged production site with its response-header rules.
deploy publishes the staged production build; it is never invoked by another command.`;

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2), allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" }, config: { type: "string" },
    plan: { type: "string", multiple: true }, output: { type: "string" },
    store: { type: "string" }, file: { type: "string" }, schema: { type: "string" },
    build: { type: "string" }, candidate: { type: "boolean", default: false },
  },
});

function allowOptions(command: string, allowed: readonly string[]): void {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== false && !allowed.includes(key)) throw new Error(`${command} does not accept --${key}.`);
  }
}

async function runSiteCommand(command: string[], cwd: string): Promise<void> {
  const child = Bun.spawn(command, { cwd, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`Site command failed with exit code ${exitCode}: ${command.join(" ")}.`);
}

async function main(): Promise<void> {
  const command = positionals[0];
  if (values.help || command === undefined) { console.log(HELP); return; }
  const known = ["scan", "capture", "register", "pyramid", "catalog", "publish", "preview", "deploy"];
  if (!known.includes(command)) throw new Error(`Unknown command: ${command}. Use --help.`);
  if (command === "preview") {
    allowOptions(command, []);
    if (positionals.length !== 1) throw new Error("preview does not accept operands.");
    await runSiteCommand(["bun", "run", "preview:production"], resolve(import.meta.dir, "../../site"));
    return;
  }
  if (command === "deploy") {
    allowOptions(command, []);
    if (positionals.length < 2 || positionals.length > 3) throw new Error("deploy requires PUBLICATION_ROOT and accepts one optional ORIGIN.");
    const root = resolve(import.meta.dir, "../../..");
    await runSiteCommand(["bun", resolve(root, "apps/site/scripts/deploy-production.ts"), resolve(positionals[1]!), ...(positionals[2] ? [positionals[2]] : [])], root);
    return;
  }
  if (positionals.length !== 1) throw new Error(`${command} does not accept positional operands.`);
  if (command === "register") {
    allowOptions(command, ["store", "build", "file", "schema", "candidate"]);
    if (!values.store || !values.build || !values.file) throw new Error("register requires --store, --build, and --file.");
    const result = await registerInput({ storeRoot: resolve(values.store), buildId: values.build,
      file: resolve(values.file), schemaId: values.schema, select: !values.candidate });
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }
  const planPaths = (values.plan ?? []).map(path => resolve(path));
  if (!planPaths.length || (command !== "capture" && planPaths.length !== 1)) throw new Error(`${command} requires ${command === "capture" ? "at least one" : "one"} --plan.`);
  if (["catalog", "publish", "pyramid"].includes(command)) {
    allowOptions(command, ["store", "plan", "candidate", ...(command === "publish" ? ["output"] : [])]);
    if (!values.store) throw new Error(`${command} requires --store.`);
    const storeRoot = resolve(values.store);
    if (command === "catalog") {
      console.log(JSON.stringify({ ok: true, ...await runCatalogCommand(planPaths[0]!, storeRoot, !values.candidate) }, null, 2));
    } else if (command === "publish") {
      if (!values.output) throw new Error("publish requires --output.");
      console.log(JSON.stringify({ ok: true, ...await runPublishCommand(planPaths[0]!, storeRoot, resolve(values.output), !values.candidate) }, null, 2));
    } else {
      const plan: unknown = await Bun.file(planPaths[0]!).json();
      Assert(TilePlanSchema, plan);
      const result = await generateTiles(new ArtifactStore(storeRoot), plan, { diagnosticRevision: await toolRevision(), select: !values.candidate });
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    }
    return;
  }
  allowOptions(command, ["config", "plan", "candidate"]);
  if (!values.config) throw new Error(`${command} requires --config.`);
  const requested = await Promise.all(planPaths.map(async path => ({ plan: await Bun.file(path).json() as unknown, path })));
  const scanPlan = command === "scan" ? validateScanPlanStructure(requested[0]!.plan) : null;
  const capturePlans = command === "capture" ? requested.map(input => {
    Assert(CapturePlanSchema, input.plan);
    validateCapturePlan(input.plan);
    return { plan: input.plan, path: input.path };
  }) : [];
  const config = await loadConfig(values.config);
  const identity = await buildIdentity(config);
  const revision = await toolRevision();
  await withRuntime(config, async runtime => {
    if (command === "scan") {
      const result = await runScanCommand(runtime, { config, buildId: identity.buildId, diagnosticRevision: revision, plan: scanPlan, select: !values.candidate });
      console.log(JSON.stringify({ ok: result.manifest.status === "succeeded", buildId: identity.buildId,
        manifestPath: result.manifestPath, manifest: result.manifest,
        targets: result.targets.map(target => ({ identity: target.targetIdentity, outcome: target.outcome, diagnostics: target.diagnostics })) }, null, 2));
      if (result.manifest.status !== "succeeded") throw new Error(`Scan failed; evidence is preserved in ${result.manifestPath}.`);
      return;
    }
    const result = await capture(runtime, config, { ...identity, diagnosticRevision: revision }, capturePlans, { select: !values.candidate });
    console.log(JSON.stringify({ ok: true, buildId: identity.buildId, ...result }, null, 2));
  });
}

await main();
