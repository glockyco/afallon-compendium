import { mkdir, rm } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { ArtifactRecord, ArtifactRunInput } from "@afallon/contracts";
import { ArtifactStore, beginArtifactRun } from "@afallon/artifacts";
import type { Run } from "./runs";

export async function beginCaptureRun(store: ArtifactStore, input: ArtifactRunInput): Promise<Run> {
  const artifactRun = await beginArtifactRun(store, input);
  const directory = resolve(store.root, ".work", artifactRun.runId);
  await mkdir(directory, { recursive: true });
  let finalized = false;
  const removeWorkingDirectory = async (): Promise<void> => {
    await rm(directory, { recursive: true, force: true });
  };
  return {
    runId: artifactRun.runId,
    directory,
    manifestPath: artifactRun.manifestPath,
    async addArtifact(relativePath): Promise<ArtifactRecord> {
      if (finalized) throw new Error(`Capture run ${artifactRun.runId} is already finalized.`);
      const object = await store.putFile(resolve(directory, relativePath));
      await artifactRun.addArtifact(relativePath, object, { mediaType: mediaType(relativePath) });
      return { path: relativePath, sha256: object.sha256, bytes: object.bytes };
    },
    async succeed(): Promise<void> {
      if (finalized) throw new Error(`Capture run ${artifactRun.runId} is already finalized.`);
      try {
        await artifactRun.succeed();
        finalized = true;
      } finally { await removeWorkingDirectory(); }
    },
    async fail(error): Promise<void> {
      if (finalized) throw new Error(`Capture run ${artifactRun.runId} is already finalized.`);
      finalized = true;
      try { await artifactRun.fail(error); }
      finally { await removeWorkingDirectory(); }
    },
  };
}

function mediaType(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".json") return "application/json";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}
