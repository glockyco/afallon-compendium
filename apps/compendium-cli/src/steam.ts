import { open, stat } from "node:fs/promises";

export const AFALLON_APP_ID = "2597810";
export const STEAM_FULLY_INSTALLED_STATE = 4;
export const STEAM_SUCCESS_RESULT = "No Error";

export interface SteamAppManifest {
  readonly appId: string;
  readonly installDir: string;
  readonly buildId: string;
  readonly stateFlags: number;
}

function oneField(text: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const values = [...text.matchAll(new RegExp(`"${escaped}"\\s+"([^"]*)"`, "g"))];
  if (values.length !== 1 || values[0]?.[1] === undefined) {
    throw new Error(`Steam manifest must contain one ${key} field.`);
  }
  return values[0][1];
}

export function parseSteamManifest(text: string, expectedAppId = AFALLON_APP_ID): SteamAppManifest {
  const appId = oneField(text, "appid");
  if (appId !== expectedAppId) throw new Error(`Steam manifest identifies app ${appId}, expected ${expectedAppId}.`);
  const buildId = oneField(text, "buildid");
  if (!/^\d+$/.test(buildId)) throw new Error("Steam manifest buildid must be decimal digits.");
  const installDir = oneField(text, "installdir");
  if (installDir.trim() === "") throw new Error("Steam manifest installdir must not be empty.");
  const stateText = oneField(text, "StateFlags");
  if (!/^\d+$/.test(stateText)) throw new Error("Steam manifest StateFlags must be a non-negative integer.");
  const stateFlags = Number(stateText);
  if (!Number.isSafeInteger(stateFlags)) throw new Error("Steam manifest StateFlags exceeds the supported integer range.");
  return { appId, installDir, buildId, stateFlags };
}

export async function readSteamManifest(path: string, expectedAppId = AFALLON_APP_ID): Promise<SteamAppManifest> {
  return parseSteamManifest(await Bun.file(path).text(), expectedAppId);
}

export function requireFullyInstalled(manifest: SteamAppManifest): SteamAppManifest {
  if (manifest.stateFlags !== STEAM_FULLY_INSTALLED_STATE) {
    throw new Error(`Steam app ${manifest.appId} is not fully installed: StateFlags ${manifest.stateFlags}.`);
  }
  return manifest;
}

export interface AppendedLog {
  readonly offset: number;
  readonly endOffset: number;
  readonly text: string;
}

export async function logLength(path: string): Promise<number> {
  try {
    return (await stat(path)).size;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return 0;
    throw error;
  }
}

export async function readAppendedLog(path: string, offset: number): Promise<AppendedLog> {
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("Log offset must be a non-negative safe integer.");
  let handle;
  try {
    handle = await open(path, "r");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return { offset, endOffset: offset, text: "" };
    throw error;
  }
  try {
    const size = (await handle.stat()).size;
    const start = size < offset ? 0 : offset;
    const length = size - start;
    if (length === 0) return { offset: start, endOffset: size, text: "" };
    const bytes = Buffer.allocUnsafe(length);
    const { bytesRead } = await handle.read(bytes, 0, length, start);
    return { offset: start, endOffset: start + bytesRead, text: bytes.subarray(0, bytesRead).toString("utf8") };
  } finally {
    await handle.close();
  }
}

export function steamLogShowsLogon(text: string): boolean {
  return text.includes("RecvMsgClientLogOnResponse");
}

export function findSteamSchedulerResult(text: string, appId = AFALLON_APP_ID): string | null {
  const escaped = appId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`AppID\\s+${escaped}\\s+scheduler finished\\s*:\\s*removed from schedule\\s*\\(result\\s+([^,)]+)`, "g");
  let result: string | null = null;
  for (const match of text.matchAll(pattern)) result = match[1]?.trim() ?? null;
  return result;
}
