import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompendiumConfig } from "@afallon/contracts";
import { CPP2IL_VERSION, runCpp2ilSnapshot } from "./recover";
import type { ProcessRequest, ProcessRunner } from "./update";

const config: CompendiumConfig = {
  gamePath: "/games/Afallon",
  outputRoot: "/artifacts",
  runtimeOutputRoot: "Z:/artifacts",
  hotreplUrl: "ws://127.0.0.1:18601",
  character: "AtlasSurvey",
  finalSceneNativeId: 3,
  finalScenePath: "Assets/SCENES/Coalway woods.unity",
  timeoutMs: 10_000,
};

function installation(buildId: string, metadataByte: string) {
  return {
    manifest: { appId: "2597810", installDir: "Afallon", buildId, stateFlags: 4 },
    inputHashes: {
      steamManifest: "1".repeat(64),
      gameAssembly: "2".repeat(64),
      unityPlayer: "3".repeat(64),
      metadata: metadataByte.repeat(64),
    },
  };
}

function successfulRunner(requests: ProcessRequest[]): ProcessRunner {
  return {
    async run(request) {
      requests.push(request);
      if (request.args[0] === "--version") return { exitCode: 0, stdout: `Cpp2IL ${CPP2IL_VERSION}\n`, stderr: "" };
      const outputIndex = request.args.indexOf("--output-to");
      const output = request.args[outputIndex + 1]!;
      await mkdir(join(output, "DiffableCs", "Assembly-CSharp"), { recursive: true });
      await writeFile(join(output, "DiffableCs", "Assembly-CSharp", "RPGItem.cs"), "public class RPGItem {}\n");
      return { exitCode: 0, stdout: "complete", stderr: "" };
    },
  };
}

test("records pinned inputs and promotes a complete declaration snapshot", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "afallon-recover-"));
  try {
    const requests: ProcessRequest[] = [];
    const recoveryRoot = join(temporary, ".recovered");
    let ignoredRoot = "";
    const dependencies = {
      recoveryRoot,
      processRunner: successfulRunner(requests),
      observeInstallation: async () => installation("25160000", "a"),
      assertIgnored: async (root: string) => { ignoredRoot = root; },
      now: () => new Date("2026-09-20T12:00:00.000Z"),
    };
    const result = await runCpp2ilSnapshot(config, "/tools/Cpp2IL", dependencies);

    expect(ignoredRoot).toBe(recoveryRoot);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toEqual({ program: "/tools/Cpp2IL", args: ["--version"] });
    expect(requests[1]!.args.slice(0, 2)).toEqual(["--game-path", "/games/Afallon"]);
    expect(requests[1]!.args.slice(-2)).toEqual(["--output-as", "diffable-cs"]);
    expect(result.snapshotPath).toBe(join(recoveryRoot, "steam-25160000-aaaaaaaaaaaa"));
    expect(result.receipt.input.manifest.stateFlags).toBe(4);
    expect(result.receipt.toolVersion).toBe(CPP2IL_VERSION);
    expect(result.receipt.arguments).toEqual([...requests[1]!.args]);
    expect(JSON.parse(await readFile(join(result.snapshotPath, "snapshot.json"), "utf8"))).toEqual(result.receipt);
    expect(JSON.parse(await readFile(join(recoveryRoot, "current.json"), "utf8"))).toMatchObject({
      snapshot: "steam-25160000-aaaaaaaaaaaa",
      buildId: "25160000",
      metadataSha256: "a".repeat(64),
    });

    const repeated = await runCpp2ilSnapshot(config, "/tools/Cpp2IL", dependencies);
    expect(repeated).toEqual(result);
    expect(requests).toHaveLength(3);
    expect(requests[2]).toEqual({ program: "/tools/Cpp2IL", args: ["--version"] });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("removes private staging output after Cpp2IL fails", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "afallon-recover-fail-"));
  try {
    const recoveryRoot = join(temporary, ".recovered");
    await mkdir(recoveryRoot);
    const priorPointer = '{"snapshot":"steam-prior"}\n';
    await writeFile(join(recoveryRoot, "current.json"), priorPointer);
    const processRunner: ProcessRunner = {
      async run(request) {
        if (request.args[0] === "--version") return { exitCode: 0, stdout: CPP2IL_VERSION, stderr: "" };
        return { exitCode: 9, stdout: "", stderr: "bad metadata" };
      },
    };
    await expect(runCpp2ilSnapshot(config, "/tools/Cpp2IL", {
      recoveryRoot,
      processRunner,
      observeInstallation: async () => installation("25160000", "b"),
      assertIgnored: async () => {},
    })).rejects.toThrow("Cpp2IL failed with exit 9: bad metadata");
    expect(await readdir(recoveryRoot)).toEqual(["current.json"]);
    expect(await readFile(join(recoveryRoot, "current.json"), "utf8")).toBe(priorPointer);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("retains the current snapshot and one previous snapshot", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "afallon-recover-retain-"));
  try {
    const recoveryRoot = join(temporary, ".recovered");
    const requests: ProcessRequest[] = [];
    let current = installation("100", "a");
    let day = 1;
    const dependencies = {
      recoveryRoot,
      processRunner: successfulRunner(requests),
      observeInstallation: async () => current,
      assertIgnored: async () => {},
      now: () => new Date(`2026-09-0${day}T00:00:00.000Z`),
    };
    await runCpp2ilSnapshot(config, "/tools/Cpp2IL", dependencies);
    current = installation("200", "b"); day = 2;
    await runCpp2ilSnapshot(config, "/tools/Cpp2IL", dependencies);
    current = installation("300", "c"); day = 3;
    await runCpp2ilSnapshot(config, "/tools/Cpp2IL", dependencies);

    const entries = (await readdir(recoveryRoot)).sort();
    expect(entries).toEqual(["current.json", "steam-200-bbbbbbbbbbbb", "steam-300-cccccccccccc"]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
