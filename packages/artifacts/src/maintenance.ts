import type { Dirent } from "node:fs";
import { readFile, readdir, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import { isErrno } from "./artifact-filesystem";
import { ArtifactStore } from "./store";

export interface TerminalRunRevisionCompaction {
  readonly runId: string;
  readonly revisions: number;
  readonly bytes: number;
}

export interface TerminalRunCompactionReport {
  readonly dryRun: boolean;
  readonly runs: readonly TerminalRunRevisionCompaction[];
  readonly summary: {
    readonly runs: number;
    readonly revisions: number;
    readonly bytes: number;
  };
}

export async function compactTerminalRunRevisions(
  store: ArtifactStore,
  options: { readonly apply?: boolean } = {},
): Promise<TerminalRunCompactionReport> {
  const runsRoot = path.join(store.root, "runs");
  let runIds: string[];
  try {
    runIds = (await readdir(runsRoot, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    if (isErrno(error, "ENOENT")) runIds = [];
    else throw error;
  }

  const runs: TerminalRunRevisionCompaction[] = [];
  for (const runId of runIds) {
    const runDirectory = path.join(runsRoot, runId);
    let manifest: unknown;
    try { manifest = JSON.parse(await readFile(path.join(runDirectory, "manifest.json"), "utf8")); }
    catch (error) {
      if (isErrno(error, "ENOENT")) continue;
      throw error;
    }
    if (!isTerminalManifest(manifest, runId)) throw new Error(`Run ${runId} has an invalid terminal manifest.`);
    const revisionsDirectory = path.join(runDirectory, "revisions");
    let entries: Dirent[];
    try { entries = await readdir(revisionsDirectory, { withFileTypes: true }); }
    catch (error) {
      if (isErrno(error, "ENOENT")) continue;
      throw error;
    }
    let bytes = 0;
    for (const entry of entries) {
      if (!entry.isFile() || !/^\d{8}\.json$/.test(entry.name)) {
        throw new Error(`Run ${runId} has an unexpected revision entry: ${entry.name}.`);
      }
      bytes += (await stat(path.join(revisionsDirectory, entry.name))).size;
    }
    runs.push({ runId, revisions: entries.length, bytes });
    if (options.apply) await rm(revisionsDirectory, { recursive: true });
  }

  return {
    dryRun: !options.apply,
    runs,
    summary: {
      runs: runs.length,
      revisions: runs.reduce((sum, run) => sum + run.revisions, 0),
      bytes: runs.reduce((sum, run) => sum + run.bytes, 0),
    },
  };
}

function isTerminalManifest(value: unknown, runId: string): boolean {
  if (value === null || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return manifest.runId === runId
    && (manifest.status === "succeeded" || manifest.status === "failed")
    && (manifest.schemaVersion === "compendium.artifact-run.v1" || manifest.schemaVersion === "compendium.artifact-run.v2");
}
