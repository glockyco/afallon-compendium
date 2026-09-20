import { expect, test } from "bun:test";
import { appendFile, mkdtemp, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AFALLON_APP_ID,
  findSteamSchedulerResult,
  parseSteamManifest,
  readAppendedLog,
  requireFullyInstalled,
  steamLogShowsLogon,
} from "./steam";

function manifest(fields: Partial<Record<"appid" | "StateFlags" | "installdir" | "buildid", string>> = {}): string {
  return `"AppState"\n{\n\t"appid"\t\t"${fields.appid ?? AFALLON_APP_ID}"\n\t"StateFlags"\t\t"${fields.StateFlags ?? "4"}"\n\t"installdir"\t\t"${fields.installdir ?? "Afallon"}"\n\t"buildid"\t\t"${fields.buildid ?? "25153357"}"\n}\n`;
}

test("parses one fully identified Afallon manifest", () => {
  expect(requireFullyInstalled(parseSteamManifest(manifest()))).toEqual({
    appId: AFALLON_APP_ID,
    installDir: "Afallon",
    buildId: "25153357",
    stateFlags: 4,
  });
});

test("rejects wrong applications, absent fields, and ambiguous fields", () => {
  expect(() => parseSteamManifest(manifest({ appid: "2241380" }))).toThrow("expected 2597810");
  expect(() => parseSteamManifest(manifest().replace(/.*"buildid".*\n/, ""))).toThrow("one buildid field");
  expect(() => parseSteamManifest(`${manifest()}\n"buildid" "999"\n`)).toThrow("one buildid field");
});

test("rejects unfinished installation states", () => {
  expect(() => requireFullyInstalled(parseSteamManifest(manifest({ StateFlags: "6" })))).toThrow("StateFlags 6");
  expect(() => parseSteamManifest(manifest({ StateFlags: "pending" }))).toThrow("non-negative integer");
});

test("recognizes only terminal scheduler results for Afallon", () => {
  const unrelated = "AppID 228980 scheduler finished : removed from schedule (result No Error, state 0xc)";
  const suspended = `AppID ${AFALLON_APP_ID} scheduler finished : staying in schedule (result Suspended, state 0x40a)`;
  const success = `AppID ${AFALLON_APP_ID} scheduler finished : removed from schedule (result No Error, state 0xc)`;
  expect(findSteamSchedulerResult(`${unrelated}\n${suspended}`)).toBeNull();
  expect(findSteamSchedulerResult(`${unrelated}\n${suspended}\n${success}`)).toBe("No Error");
  expect(findSteamSchedulerResult(`${success}\n${success.replace("No Error", "Disk Write Failure")}`)).toBe("Disk Write Failure");
});

test("recognizes Steam client logon evidence", () => {
  expect(steamLogShowsLogon("RecvMsgClientLogOnResponse() : 'OK'")).toBeTrue();
  expect(steamLogShowsLogon("scheduler ready")).toBeFalse();
});

test("reads only appended log bytes and recovers from rotation", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-steam-log-"));
  const path = join(root, "content_log.txt");
  try {
    await writeFile(path, "before\n");
    const offset = Bun.file(path).size;
    await appendFile(path, "after\n");
    expect(await readAppendedLog(path, offset)).toEqual({ offset, endOffset: offset + 6, text: "after\n" });
    await truncate(path, 0);
    await appendFile(path, "rotated\n");
    expect(await readAppendedLog(path, offset + 100)).toEqual({ offset: 0, endOffset: 8, text: "rotated\n" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
