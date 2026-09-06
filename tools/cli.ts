import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { buildIdentity, hashFile, toolRevision } from "./build";
import { loadConfig } from "./config";
import { beginRun } from "./runs";
import { withRuntime } from "./runtime";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { config: { type: "string" }, help: { type: "boolean", short: "h" }, probe: { type: "string" } },
});

async function main() {
  if (values.help || positionals.length === 0) {
    console.log("Usage: bun run compendium <doctor|inspect|probe> --config local/config.json [--probe file.csx]\n\nRun through `nix develop --command bun run compendium ...`.\nDoctor verifies the installation, endpoint, build, and shared output path.\nInspect records complete currently-loaded inspection data, not full-game coverage.\nProbe executes a trusted C# body with an explicit return and verifies its file artifact.");
    return;
  }
  const command = positionals[0]!;
  if (positionals.length !== 1 || !["doctor", "inspect", "probe"].includes(command)) throw new Error("Unknown command. Use --help.");
  if (!values.config) throw new Error("Supply --config with an explicit local configuration file.");
  if (command === "probe" && !values.probe) throw new Error("The probe command requires --probe file.csx.");
  if (command !== "probe" && values.probe) throw new Error("--probe is only valid for the probe command.");
  const config = await loadConfig(values.config);
  const identity = await buildIdentity(config);
  const doctorSource = resolve(import.meta.dir, "probes/doctor.csx");
  const source = command === "probe" ? resolve(values.probe!) : resolve(import.meta.dir, "probes/inspect.csx");

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
      console.log(JSON.stringify({ ok: true, ...identity, installation, endpoint: config.hotreplUrl, sharedOutputVerified: true, outputRoot: config.outputRoot, runtimeOutputRoot: config.runtimeOutputRoot, researchCharacter: config.character, bun: Bun.version, nixShell: process.env.AFALLON_DEV_SHELL === "1", protocol: runtime.session.handshake.protocolVersion }, null, 2));
      return;
    }
    const run = await beginRun(config.outputRoot, {
      ...identity,
      inputHashes: { ...identity.inputHashes, probe: await hashFile(source) },
      toolRevision: await toolRevision(),
      command,
      settings: { character: config.character, endpoint: config.hotreplUrl, timeoutMs: config.timeoutMs },
    });
    try {
      const output = resolve(run.directory, "result.json");
      const result = await runtime.probe(source, output);
      const artifact = await run.addArtifact("result.json");
      if (artifact.sha256 !== result.reference.sha256) throw new Error("Artifact changed between runtime verification and run registration.");
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
  process.exit(1);
}
