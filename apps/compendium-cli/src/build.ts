import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { CompendiumConfig } from "@afallon/contracts";

export async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export async function buildIdentity(config: CompendiumConfig) {
  const manifestPath = resolve(dirname(dirname(config.gamePath)), "appmanifest_2597810.acf");
  const manifest = await Bun.file(manifestPath).text();
  const buildIds = [...manifest.matchAll(/"buildid"\s+"(\d+)"/g)];
  if (!/"appid"\s+"2597810"/.test(manifest) || buildIds.length !== 1) {
    throw new Error("Steam manifest does not identify one Afallon build.");
  }
  const files = {
    steamManifest: manifestPath,
    gameAssembly: resolve(config.gamePath, "GameAssembly.dll"),
    unityPlayer: resolve(config.gamePath, "UnityPlayer.dll"),
    metadata: resolve(config.gamePath, "Afallon_Data/il2cpp_data/Metadata/global-metadata.dat"),
  };
  const inputHashes: Record<string, string> = {};
  await Promise.all(Object.entries(files).map(async ([key, path]) => { inputHashes[key] = await hashFile(path); }));
  return { buildId: buildIds[0]![1]!, inputHashes };
}

// The revision is read from the repository files, not from a git process: once sharp has run in
// this process, Bun 1.3 child processes return no output, and the tests exercise that path.
export async function toolRevision(): Promise<string> {
  const gitDirectory = resolve(import.meta.dir, "..", "..", "..", ".git");
  const head = (await readFile(resolve(gitDirectory, "HEAD"), "utf8")).trim();
  const reference = head.startsWith("ref: ") ? head.slice("ref: ".length) : null;
  const revision = reference === null ? head : await resolveReference(gitDirectory, reference);
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Cannot identify the tool repository revision.");
  return revision;
}

async function resolveReference(gitDirectory: string, reference: string): Promise<string> {
  const loose = Bun.file(resolve(gitDirectory, reference));
  if (await loose.exists()) return (await loose.text()).trim();
  const packed = await readFile(resolve(gitDirectory, "packed-refs"), "utf8");
  for (const line of packed.split("\n")) {
    const [sha, name] = line.split(" ");
    if (name === reference && sha !== undefined) return sha;
  }
  throw new Error(`Cannot resolve git reference ${reference}.`);
}
