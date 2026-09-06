import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CompendiumConfig } from "./config";

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
    metadata: resolve(config.gamePath, "Afallon_Data/il2cpp_data/Metadata/global-metadata.dat"),
  };
  const inputHashes: Record<string, string> = {};
  await Promise.all(Object.entries(files).map(async ([key, path]) => { inputHashes[key] = await hashFile(path); }));
  return { buildId: buildIds[0]![1]!, inputHashes };
}

export async function toolRevision(): Promise<string> {
  const process = Bun.spawn(["git", "rev-parse", "HEAD"], { cwd: resolve(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" });
  const revision = (await new Response(process.stdout).text()).trim();
  if (await process.exited !== 0) throw new Error("Cannot identify the tool repository revision.");
  return revision;
}
