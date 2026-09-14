import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprintStep, type StepFingerprintInput } from "./fingerprints";

async function writeFixture(root: string): Promise<string> {
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "entry.ts"), 'import { value } from "./relevant";\nimport probe from "./probe.csx";\nconsole.log(value, probe);\n');
  await writeFile(join(root, "relevant.ts"), 'export const value = "stable";\n');
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
    expect(baseline.transitiveModuleCount).toBe(3);
    expect(Object.keys(baseline.probeHashes)).toEqual(["probe.csx"]);

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
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
