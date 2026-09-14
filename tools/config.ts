import { mkdir, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep, win32 } from "node:path";
import { CompendiumConfigInputSchema, type CompendiumConfig } from "@afallon/contracts";
import { Assert } from "typebox/value";

export async function loadConfig(file: string): Promise<CompendiumConfig> {
  const location = resolve(file);
  const value: unknown = await Bun.file(location).json();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Configuration must be a JSON object.");
  }
  const input = value as Record<string, unknown>;
  const allowed: Record<string, true> = { gamePath: true, outputRoot: true, runtimeOutputRoot: true, hotreplUrl: true, character: true, finalSceneNativeId: true, finalScenePath: true, timeoutMs: true, mapSpaceProfile: true };
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(allowed, key)) throw new Error(`Unknown configuration field: ${key}`);
  }
  function text(key: string): string {
    const value = input[key];
    if (typeof value !== "string" || value.trim() === "" || value.includes("\0")) {
      throw new Error(`Configuration field ${key} must be a nonempty string.`);
    }
    return value;
  }
  const finalSceneNativeId = input.finalSceneNativeId;
  if (typeof finalSceneNativeId !== "number" || !Number.isSafeInteger(finalSceneNativeId) || finalSceneNativeId < 0) {
    throw new Error("finalSceneNativeId must be a non-negative integer.");
  }
  const finalScenePath = text("finalScenePath");
  const endpoint = new URL(text("hotreplUrl"));
  if (!["ws:", "wss:"].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
    throw new Error("hotreplUrl must be a WebSocket URL without embedded credentials.");
  }
  const runtimeOutputRoot = text("runtimeOutputRoot").replaceAll("\\", "/").replace(/\/+$/, "");
  if (!/^[A-Za-z]:\//.test(runtimeOutputRoot) || runtimeOutputRoot.split("/").includes("..")) {
    throw new Error("runtimeOutputRoot must be an absolute Windows path without parent traversal.");
  }
  const timeoutMs = input.timeoutMs ?? 10000;
  if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) {
    throw new Error("timeoutMs must be an integer from 100 to 120000.");
  }
  Assert(CompendiumConfigInputSchema, value);
  const gamePath = await realpath(resolve(dirname(location), text("gamePath")));
  for (const name of ["Afallon.exe", "GameAssembly.dll", "Afallon_Data/il2cpp_data/Metadata/global-metadata.dat"]) {
    if (!(await stat(resolve(gamePath, name))).isFile()) throw new Error(`Missing game file: ${name}`);
  }
  const output = resolve(dirname(location), text("outputRoot"));
  await mkdir(output, { recursive: true });
  const outputRoot = await realpath(output);
  if (isWithin(gamePath, outputRoot)) throw new Error("outputRoot must be outside the game installation.");
  const mapSpaceProfile = input.mapSpaceProfile === undefined ? undefined : await realpath(resolve(dirname(location), text("mapSpaceProfile")));
  return { gamePath, outputRoot, runtimeOutputRoot, hotreplUrl: endpoint.href, character: text("character"), finalSceneNativeId, finalScenePath, timeoutMs, mapSpaceProfile };
}

export function isWithin(root: string, path: string): boolean {
  const suffix = relative(root, path);
  return suffix === "" || (!isAbsolute(suffix) && suffix !== ".." && !suffix.startsWith(`..${sep}`));
}

export async function toRuntimePath(config: CompendiumConfig, hostFile: string): Promise<string> {
  const parent = await realpath(dirname(resolve(hostFile)));
  const target = resolve(parent, hostFile.split(sep).at(-1)!);
  if (!isWithin(config.outputRoot, target)) throw new Error("Artifact path escapes outputRoot.");
  return `${config.runtimeOutputRoot}/${relative(config.outputRoot, target).split(sep).join("/")}`;
}

export async function toHostPath(config: CompendiumConfig, runtimeFile: string): Promise<string> {
  const suffix = win32.relative(config.runtimeOutputRoot, runtimeFile);
  if (!suffix || win32.isAbsolute(suffix) || suffix === ".." || suffix.startsWith("..\\")) {
    throw new Error("Runtime artifact path escapes runtimeOutputRoot.");
  }
  const target = await realpath(resolve(config.outputRoot, ...suffix.split("\\")));
  if (!isWithin(config.outputRoot, target)) throw new Error("Artifact symlink escapes outputRoot.");
  return target;
}
