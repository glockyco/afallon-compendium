import { mkdir, readdir, rm } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { ArtifactRunInput, CaptureArtifact, ContentIdentity, LogicalArtifact } from "@afallon/contracts";
import { ArtifactStore, beginArtifactRun, type ArtifactRun, type ArtifactMetadata } from "@afallon/artifacts";

export interface CaptureWorkspace {
  readonly run: ArtifactRun;
  readonly store: ArtifactStore;
  readonly directory: string;
  readonly artifacts: ReadonlyMap<string, CaptureArtifact>;
  registerFile(name: string, metadata?: Partial<ArtifactMetadata>): Promise<CaptureArtifact>;
  registerObject(name: string, content: ContentIdentity, metadata?: Partial<ArtifactMetadata>): Promise<CaptureArtifact>;
  preserveFailureEvidence(): Promise<void>;
  dispose(): Promise<void>;
}

export async function beginCaptureWorkspace(store: ArtifactStore, input: ArtifactRunInput): Promise<CaptureWorkspace> {
  const run = await beginArtifactRun(store, input);
  const directory = resolve(store.root, ".work", run.runId);
  try { await mkdir(directory, { recursive: true }); }
  catch (error) {
    try { await run.fail(error); }
    finally { await run.release(); }
    throw error;
  }
  const artifacts = new Map<string, CaptureArtifact>();
  const registerObject = async (name: string, content: ContentIdentity, metadata: Partial<ArtifactMetadata> = {}): Promise<CaptureArtifact> => {
    const previous = artifacts.get(name);
    if (previous !== undefined) {
      if (previous.content.sha256 !== content.sha256 || previous.content.bytes !== content.bytes) throw new Error(`Capture evidence changed: ${name}.`);
      return previous;
    }
    const output = await run.addArtifact(name, await store.verify(content), { mediaType: mediaType(name), ...metadata });
    const reference = { name: output.name, content: output.content };
    artifacts.set(name, reference);
    return reference;
  };
  const registerFile = async (name: string, metadata: Partial<ArtifactMetadata> = {}): Promise<CaptureArtifact> => {
    const object = await run.putFile(resolve(directory, name));
    let schemaId: string | undefined;
    if (extname(name) === ".json") {
      try {
        const value = await Bun.file(store.objectPath(object.sha256)).json();
        if (typeof value.schemaVersion === "string") schemaId = value.schemaVersion;
      } catch { /* Invalid JSON remains diagnostic evidence. */ }
    }
    return registerObject(name, object, { ...(schemaId === undefined ? {} : { schemaId }), ...metadata });
  };
  return {
    run, store, directory, artifacts, registerFile, registerObject,
    async preserveFailureEvidence() {
      const visit = async (relative: string): Promise<void> => {
        for (const entry of await readdir(resolve(directory, relative), { withFileTypes: true })) {
          const name = relative === "" ? entry.name : `${relative}/${entry.name}`;
          if (entry.isDirectory()) await visit(name);
          else if (entry.isFile() && !artifacts.has(name)) await registerFile(name);
        }
      };
      await visit("");
    },
    async dispose() {
      try { await rm(directory, { recursive: true, force: true }); }
      finally { await run.release(); }
    },
  };
}

export function objectReferences(contents: readonly ContentIdentity[]): NonNullable<LogicalArtifact["references"]> {
  return contents.map(content => ({ kind: "object" as const, content }));
}

function mediaType(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".json") return "application/json";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}
