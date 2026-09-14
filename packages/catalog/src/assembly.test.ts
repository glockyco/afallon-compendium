import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog";
import { assembleCatalog, catalogLogicalIdentity, type CatalogAssemblyInput, type CatalogLogicalIdentityInput } from "./assembly";

function normalized(): NormalizedDatabaseInput {
  const reference = { path: "input.json", sha256: "0".repeat(64) };
  return {
    buildId: "build", identityResults: [], entities: [], scenes: [], mapSpaces: [], bindings: [],
    placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [],
    merchantTables: [], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [],
    lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [],
    itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
    provenance: { plan: reference, profile: reference, sources: [] },
  };
}

async function fixture(run: (root: string, store: ArtifactStore, input: CatalogAssemblyInput) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-catalog-assembly-"));
  try {
    const store = new ArtifactStore(join(root, "artifacts"));
    const first = await store.putBytes(new TextEncoder().encode("first"));
    const second = await store.putBytes(new TextEncoder().encode("second"));
    await run(root, store, {
      normalized: normalized(),
      sources: [
        { key: "second", kind: "evidence", identity: second },
        { key: "first", kind: "evidence", identity: first },
      ],
      identity: { schemaVersion: "catalog.v1", settings: { mode: "release" }, assemblerFingerprint: "d".repeat(64) },
    });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test("assembles deterministic catalogs from verified objects", async () => {
  await fixture(async (root, store, input) => {
    const first = await assembleCatalog(store, join(root, "first.sqlite"), input);
    const second = await assembleCatalog(store, join(root, "second.sqlite"), {
      ...input,
      sources: [...input.sources].reverse(),
    });
    expect(second.catalogId).toBe(first.catalogId);
    expect(second.sha256).toBe(first.sha256);
    expect(first.catalogId).not.toBe(first.sha256);
    expect(second.bytes).toBe(first.bytes);
    expect(first.counts).toEqual({ entities: 0, placements: 0, regions: 0, sources: 0, roles: 0, conditions: 0, domainRelations: 0, blockers: 0 });
  });
});

test("logical identity covers build, schema, settings, inputs, and assembler", () => {
  const base: CatalogLogicalIdentityInput = {
    buildId: "build", schemaVersion: "catalog.v1", settings: { mode: "release" },
    inputs: { source: { sha256: "a".repeat(64), bytes: 1 } }, assemblerFingerprint: "b".repeat(64),
  };
  const identity = catalogLogicalIdentity(base);
  expect(catalogLogicalIdentity({ ...base, inputs: { ...base.inputs } })).toBe(identity);
  expect(catalogLogicalIdentity({ ...base, buildId: "other" })).not.toBe(identity);
  expect(catalogLogicalIdentity({ ...base, schemaVersion: "catalog.v2" })).not.toBe(identity);
  expect(catalogLogicalIdentity({ ...base, settings: { mode: "preview" } })).not.toBe(identity);
  expect(catalogLogicalIdentity({ ...base, inputs: { source: { sha256: "c".repeat(64), bytes: 1 } } })).not.toBe(identity);
  expect(catalogLogicalIdentity({ ...base, assemblerFingerprint: "d".repeat(64) })).not.toBe(identity);
});

test("preserves the selected catalog on malformed input, bad references, and identity collisions", async () => {
  await fixture(async (root, store, input) => {
    const destination = join(root, "selected.sqlite");
    await writeFile(destination, "selected");

    const malformed = { ...input, normalized: { ...input.normalized, entities: undefined } } as unknown as CatalogAssemblyInput;
    await expect(assembleCatalog(store, destination, malformed)).rejects.toThrow("normalized.entities");

    const badReference = {
      ...input,
      sources: [{ key: "missing", kind: "evidence", identity: { sha256: "f".repeat(64), bytes: 1 } }],
    };
    await expect(assembleCatalog(store, destination, badReference)).rejects.toThrow();

    const collision = { ...input, sources: [input.sources[0]!, { ...input.sources[0]! }] };
    await expect(assembleCatalog(store, destination, collision)).rejects.toThrow("identity collision");
    expect(await readFile(destination, "utf8")).toBe("selected");
  });
});
