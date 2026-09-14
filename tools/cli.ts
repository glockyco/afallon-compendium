import { randomUUID } from "node:crypto";
import { readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { buildIdentity, hashFile, toolRevision } from "./build";
import { loadConfig } from "./config";
import { extract } from "./extract";
import { beginRun } from "./runs";
import { withRuntime } from "@afallon/runtime";
import { traverse } from "./traversal";
import { capture } from "./capture";
import type { CapturePlan } from "@afallon/contracts"
import { prepareIllustration } from "./illustrations";
import { normalize } from "../pipeline/normalize";
import { generateTiles } from "../pipeline/tiles";
import { preparePublication } from "../pipeline/publication";
import { planCapture } from "./capture-planner";
import { planTiles } from "./tile-planner";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    output: { type: "string" }, config: { type: "string" }, help: { type: "boolean", short: "h" },
    probe: { type: "string" }, prelude: { type: "string" }, plan: { type: "string", multiple: true },
    surveys: { type: "string", multiple: true }, owners: { type: "string" }, database: { type: "string" },
  },
});

async function main() {
  if (values.help || positionals.length === 0) {
    console.log("Usage: bun run compendium <doctor|inspect|extract|probe|probe-check|traverse|capture|illustration> --config local/config.json [--probe file.csx] [--prelude file.csx] [--plan file.json ...]\n       bun run compendium <plan-capture|plan-tiles> --config local/config.json [--surveys artifacts/scene-survey ...] [--owners local/reviewed-cell-owners.json] [--database artifacts/.../normalized.sqlite]\n       bun run compendium <normalize|tiles|publication> --plan file.json --output directory\n\nCapture uses finalSceneNativeId and finalScenePath from the installation config.\nRun through `nix develop --command bun run compendium ...`.\nDoctor verifies the installation, endpoint, build, and shared output path.\nInspect records complete currently-loaded inspection data, not full-game coverage.\nExtract validates canonical records, relationships, loot rules, world inventory, and authored producers with observation context. Load the configured research character first. Runtime commands use exclusive ownership and confirm cleanup before reporting success.\nProbe executes trusted C# with an optional shared prelude; args.researchCharacter comes from the local configuration.\nProbe-check compiles every probe against the live runtime without executing probe bodies or writing artifacts.\nTraverse requires --plan file.json. It visits bounded scene/stream selections, validates source exports, and restores owned state. Inactive streams remain explicit coverage gaps.\nCapture requires --plan file.json. It visits requested scenes, verifies geometry and raster registration, and does not claim complete imagery coverage.\nPlan-capture writes world capture plans from scene surveys, normalized placements, and the latest successful capture inventories.\nPlan-tiles writes tile plans from successful capture manifests and the current capture-plan tile IDs.\nIllustration requires --plan file.json. It prepares a hashed optional illustration layer from disk without connecting to the game; it never satisfies primary capture coverage.\nNormalize requires --plan file.json. It builds SQLite and map indexes from hashed extraction manifests without connecting to the game.\nTiles requires --plan file.json. It builds lossless WebP pyramids from verified capture manifests without connecting to the game.\nPublication requires --plan file.json. It validates and prepares an immutable local browser artifact. It does not deploy or upload files.");
    return;
  }
  const command = positionals[0]!;
  if (!( ["doctor", "inspect", "extract", "probe", "probe-check", "traverse", "capture", "illustration", "plan-capture", "plan-tiles", "normalize", "tiles", "publication"] as string[]).includes(command)) throw new Error("Unknown command. Use --help.");
  const optionPlanPaths = values.plan === undefined ? [] : Array.isArray(values.plan) ? values.plan : [values.plan];
  const positionalPlanPaths = command === "capture" ? positionals.slice(1) : [];
  const planPaths = [...optionPlanPaths, ...positionalPlanPaths];
  if (command !== "capture" && positionalPlanPaths.length !== 0) throw new Error("Only capture accepts plan paths after the command.");
  const planning = command === "plan-capture" || command === "plan-tiles";
  if (!planning && (values.surveys !== undefined || values.owners !== undefined || values.database !== undefined)) throw new Error("--surveys, --owners, and --database are only valid for plan-capture and plan-tiles.");
  if (planning && command === "plan-tiles" && (values.surveys !== undefined || values.owners !== undefined || values.database !== undefined)) throw new Error("--surveys, --owners, and --database are only valid for plan-capture.");
  const offline = ["normalize", "tiles", "publication"].includes(command);
  if (offline && (!values.output || values.config)) throw new Error("Offline commands require --output directory and do not accept --config.");
  if (planning && (!values.config || values.output)) throw new Error("Planning commands require --config and do not accept --output.");
  if (!offline && !planning && (!values.config || values.output)) throw new Error("Runtime and illustration commands require --config and do not accept --output.");
  if (command === "probe" && !values.probe) throw new Error("The probe command requires --probe file.csx.");
  if (command !== "probe" && (values.probe || values.prelude)) throw new Error("--probe and --prelude are only valid for the probe command.");
  const requiresPlan = ["traverse", "capture", "illustration", "normalize", "tiles", "publication"].includes(command);
  if (requiresPlan && planPaths.length === 0) throw new Error(`The ${command} command requires --plan file.json.`);
  if (!requiresPlan && planPaths.length !== 0) throw new Error("--plan is only valid for traverse, capture, illustration, normalize, tiles, and publication.");
  const plan = planPaths.length > 0 && (command === "traverse" || command === "capture")
    ? command === "capture" ? await Promise.all(planPaths.map(path => Bun.file(path).json())) : await Bun.file(planPaths[0]!).json()
    : undefined;
  const preludeFile = values.prelude ? resolve(values.prelude) : undefined;
  if (offline) {
    const result = command === "normalize"
      ? await normalize(resolve(planPaths[0]!), resolve(values.output!))
      : command === "tiles"
        ? await generateTiles(resolve(planPaths[0]!), resolve(values.output!))
        : await preparePublication(resolve(planPaths[0]!), resolve(values.output!));
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }
  const config = await loadConfig(values.config!);
  const identity = await buildIdentity(config);
  if (planning) {
    const surveys = values.surveys === undefined ? undefined : Array.isArray(values.surveys) ? values.surveys : [values.surveys];
    const result = command === "plan-capture"
      ? await planCapture({ config, buildId: identity.buildId, surveys, owners: values.owners, database: values.database })
      : await planTiles({ config, buildId: identity.buildId });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "illustration") {
    const result = await prepareIllustration(config, identity, resolve(planPaths[0]!));
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }
  const doctorSource = resolve(import.meta.dir, "probes/doctor.csx");

  await withRuntime(config, async runtime => {
    const temporary = resolve(config.outputRoot, `.doctor-${randomUUID()}.json`);
    let installation: Record<string, unknown>;
    try {
      const report = await runtime.probe(doctorSource, temporary);
      installation = report.value as Record<string, unknown>;
      if (installation.gameAssemblySha256 !== identity.inputHashes.gameAssembly) {
        throw new Error("The running game does not match the configured installation.");
      }
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    }
    if (command === "doctor") {
      await runtime.complete();
      console.log(JSON.stringify({ ok: true, ...identity, installation, endpoint: config.hotreplUrl, sharedOutputVerified: true, outputRoot: config.outputRoot, runtimeOutputRoot: config.runtimeOutputRoot, researchCharacter: config.character, bun: Bun.version, nixShell: process.env.AFALLON_DEV_SHELL === "1", protocol: runtime.handshake.protocolVersion }, null, 2));
      return;
    }
    if (command === "probe-check") {
      const probeDirectory = resolve(import.meta.dir, "probes");
      const entries = await readdir(probeDirectory, { withFileTypes: true });
      const sources = [
        ...entries.filter(entry => entry.isFile() && entry.name.endsWith(".csx")).map(entry => ({ name: entry.name, path: resolve(probeDirectory, entry.name) })),
        { name: "runtime-owner.csx", path: resolve(import.meta.dir, "../packages/runtime/src/probes/runtime-owner.csx") },
      ].sort((left, right) => left.name.localeCompare(right.name));
      const conditions = resolve(probeDirectory, "conditions.csx");
      const captureVisuals = resolve(probeDirectory, "capture-visuals.csx");
      const results: { name: string; error?: string }[] = [];
      const started = performance.now();
      for (const entry of sources) {
        const source = entry.path;
        const stem = entry.name.slice(0, -4);
        const prelude = ["relationships", "npc-producers", "world-sources"].includes(stem) ? conditions
          : ["capture-geometry", "capture-session"].includes(stem) ? captureVisuals
            : undefined;
        const context = stem === "runtime-owner" ? 'var ownerToken = "compile-check"; var ownerAction = "claim"; var ownerReceiptPath = "compile-check.json"; var ownerReason = "compile-check";' : "";
        try {
          await runtime.compileProbe(source, prelude, context);
          results.push({ name: entry.name });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          results.push({ name: entry.name, error: message.replace(/\\s+/g, " ") });
        }
      }
      const elapsedMs = Math.round(performance.now() - started);
      for (const result of results.filter(result => result.error === undefined)) console.log(`PASS probes/${result.name}`);
      for (const result of results.filter(result => result.error !== undefined)) console.log(`FAIL probes/${result.name}: ${result.error}`);
      const failures = results.filter(result => result.error !== undefined);
      console.log(`Probe compile check: ${results.length} probes, ${failures.length} failures, ${elapsedMs} ms; live runtime compilation only (probe bodies did not execute).`);
      if (failures.length > 0) throw new Error(`${failures.length} probe(s) failed live compilation.`);
      return;
    }
    if (command === "capture") {
      const result = await capture(runtime, config, identity, (plan as CapturePlan[]).map((value, index) => ({ plan: value, path: resolve(planPaths[index]!) })));
      console.log(JSON.stringify({ ok: true, buildId: identity.buildId, ...result }, null, 2));
      return;
    }
    if (command === "traverse") {
      const result = await traverse(runtime, config, identity, plan);
      console.log(JSON.stringify({ ok: true, buildId: identity.buildId, ...result }, null, 2));
      return;
    }
    if (command === "extract") {
      const result = await extract(runtime, config, identity);
      console.log(JSON.stringify({ ok: true, buildId: identity.buildId, manifest: result.manifest, counts: result.validation.canonicalTotals, worldInventory: result.validation.worldInventory.totals, npcProducers: result.validation.npcProducers.exportedTotals, worldSources: result.validation.worldSources.totals.exported, placementRoles: result.validation.placementRoles.summary, spatial: result.validation.spatial, unresolvedReferences: result.validation.unresolved.length, diagnostics: { unsetReferences: result.validation.unset.length, quantityRanges: result.validation.quantityDiagnostics.length, relationships: result.validation.relationshipDiagnostics.length, blankDisplayNames: result.validation.blankDisplayNames.length, worldInventory: result.validation.worldInventory.diagnostics.length, npcProducers: result.validation.npcProducers.diagnostics.length, worldSources: result.validation.worldSources.diagnostics.length }, coverage: result.coverage, fullGameCoverage: false }, null, 2));
      return;
    }
    const source = command === "probe" ? resolve(values.probe!) : resolve(import.meta.dir, "probes/inspect.csx");
    const run = await beginRun(config.outputRoot, {
      ...identity,
      inputHashes: { ...identity.inputHashes, "runtime-owner": runtime.ownerSourceHash, "tool:runtime": await hashFile(resolve(import.meta.dir, "../packages/runtime/src/runtime.ts")), probe: await hashFile(source), ...(preludeFile ? { prelude: await hashFile(preludeFile) } : {}) },
      toolRevision: await toolRevision(),
      command,
      settings: { character: config.character, endpoint: config.hotreplUrl, timeoutMs: config.timeoutMs, runtimeOwnerToken: runtime.ownerToken },
    });
    try {
      const output = resolve(run.directory, "result.json");
      const result = await runtime.probe(source, output, { preludeFile, parameters: { researchCharacter: config.character } });
      const artifact = await run.addArtifact("result.json");
      if (artifact.sha256 !== result.reference.sha256) throw new Error("Artifact changed between runtime verification and run registration.");
      await runtime.complete();
      await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
      await run.addArtifact("runtime-cleanup.json");
      await run.succeed();
      console.log(JSON.stringify({ ok: true, buildId: identity.buildId, manifest: run.manifestPath, artifact, result: command === "inspect" ? { coverage: "Currently loaded content only. See the complete artifact for counts and rows." } : undefined }, null, 2));
    } catch (error) {
      await run.fail(error);
      console.error(`Failed run: ${run.manifestPath}`);
      throw error;
    }
  });
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  // Terminate a stalled SDK handshake socket if it never yields a Session to close.
  process.exit(process.exitCode || 1);
}
