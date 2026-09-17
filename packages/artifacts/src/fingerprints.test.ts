import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprintStep, type StepFingerprintInput } from "./fingerprints";

async function writeFixture(root: string): Promise<string> {
  await mkdir(join(root, "node_modules/runtime-sdk"), { recursive: true });
  await writeFile(join(root, "node_modules/runtime-sdk/package.json"), JSON.stringify({ name: "runtime-sdk", type: "module", exports: "./index.js", sideEffects: false }));
  await writeFile(join(root, "node_modules/runtime-sdk/index.js"), 'export function connect() { return "native"; }\n');
  await writeFile(join(root, "entry.ts"), 'import { value } from "./relevant";\nimport probe from "./probe.csx" with {type:"text"};\nconsole.log(value, probe);\n');
  await writeFile(join(root, "relevant.ts"), 'import owner from "./owner.csx" with {type:"text"};\nimport serialized from "./serialized.py" with {type:"text"};\nimport { connect } from "runtime-sdk";\nexport function connectRuntime() { return connect(); }\nexport const value = ["stable", owner, serialized];\n');
  await writeFile(join(root, "owner.csx"), 'var token = "native-owner";\n');
  await writeFile(join(root, "serialized.py"), 'print("serialized-input")\n');
  await writeFile(join(root, "probe.csx"), 'public static class Probe { public const int Value = 1; }\n');
  await writeFile(join(root, "unrelated.ts"), 'export const unrelated = 1;\n');
  return join(root, "entry.ts");
}

function input(entrypoint: string): StepFingerprintInput {
  return {
    entrypoint,
    buildId: "25153357",
    settings: { target: "current-scene" },
    schemas: [{ id: "compendium.world-sources.v7", sha256: "a".repeat(64) }],
    inputs: { inventory: { sha256: "b".repeat(64), bytes: 10 } },
  };
}

test("fingerprints follow the executable dependency closure", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-fingerprint-"));
  try {
    const firstEntry = await writeFixture(join(root, "first"));
    const secondEntry = await writeFixture(join(root, "second"));
    const baseline = await fingerprintStep(input(firstEntry));
    const cleanCopy = await fingerprintStep(input(secondEntry));
    expect(cleanCopy).toEqual(baseline);
    expect(Object.keys(baseline.probeHashes).sort()).toEqual(["owner.csx", "probe.csx", "serialized.py"]);

    await writeFile(join(root, "first", "unrelated.ts"), 'export const unrelated = 2;\n');
    expect(await fingerprintStep(input(firstEntry))).toEqual(baseline);

    await writeFile(join(root, "first", "relevant.ts"), 'export const value = "changed";\n');
    const relevantChange = await fingerprintStep(input(firstEntry));
    expect(relevantChange.implementation).not.toBe(baseline.implementation);
    expect(relevantChange.cacheKey).not.toBe(baseline.cacheKey);

    const settingsChange = await fingerprintStep({ ...input(secondEntry), settings: { target: "build-scenes" } });
    expect(settingsChange.implementation).toBe(baseline.implementation);
    expect(settingsChange.cacheKey).not.toBe(baseline.cacheKey);
    const inputChange = await fingerprintStep({ ...input(secondEntry), inputs: { inventory: { sha256: "c".repeat(64), bytes: 10 } } });
    expect(inputChange.cacheKey).not.toBe(baseline.cacheKey);
    const schemaChange = await fingerprintStep({ ...input(secondEntry), schemas: [{ id: "compendium.world-sources.v7", sha256: "d".repeat(64) }] });
    expect(schemaChange.cacheKey).not.toBe(baseline.cacheKey);

    await writeFile(join(root, "second", "probe.csx"), 'public static class Probe { public const int Value = 2; }\n');
    const probeChange = await fingerprintStep(input(secondEntry));
    expect(probeChange.probeHashes).not.toEqual(baseline.probeHashes);
    expect(probeChange.implementation).not.toBe(baseline.implementation);
    await writeFile(join(root, "second", "owner.csx"), 'var token = "changed-native-owner";\n');
    const ownerChange = await fingerprintStep(input(secondEntry));
    expect(ownerChange.probeHashes["owner.csx"]).not.toBe(probeChange.probeHashes["owner.csx"]);
    expect(ownerChange.cacheKey).not.toBe(probeChange.cacheKey);
    await writeFile(join(root, "second", "serialized.py"), 'print("changed-serialized-input")\n');
    const serializedChange = await fingerprintStep(input(secondEntry));
    expect(serializedChange.cacheKey).not.toBe(ownerChange.cacheKey);
    await writeFile(join(root, "second/node_modules/runtime-sdk/index.js"), 'export function connect() { return "changed-native"; }\n');
    expect((await fingerprintStep(input(secondEntry))).cacheKey).not.toBe(serializedChange.cacheKey);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
