import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import type { CatalogGateResult } from "@afallon/catalog";
import type { StaticCoverage, StaticEntitySearch, StaticItemSearch, StaticRootManifest } from "@afallon/contracts/public";
import { writeStaticJson } from "./resources";
import { selectPublication } from "./selection";

const gate: CatalogGateResult = { accepted: true, complete: false, buildMatches: true, catalogMatches: true, missingSourceKeys: [], outOfBoundsPlacementIds: [], unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0 };

test("selects a complete candidate atomically and preserves it after validation failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-publication-select-"));
  try {
    const store = new ArtifactStore(join(root, "objects"));
    const identity = { buildId: "build", catalogId: "c".repeat(64) };
    const entity = await writeStaticJson<StaticEntitySearch>(store, "compendium.static-entity-search.v1", { schemaVersion: "compendium.static-entity-search.v1", ...identity, entities: [] });
    const item = await writeStaticJson<StaticItemSearch>(store, "compendium.static-item-search.v1", { schemaVersion: "compendium.static-item-search.v1", ...identity, items: [] });
    const coverage = await writeStaticJson<StaticCoverage>(store, "compendium.static-coverage.v1", { schemaVersion: "compendium.static-coverage.v1", ...identity, complete: false, unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0, messages: ["Incomplete preview."] });
    const rootValue: StaticRootManifest = { schemaVersion: "compendium.static-root.v1", ...identity, mode: "preview", complete: false, maps: [], entitySearch: entity.reference, itemSearch: item.reference, coverage: coverage.reference };
    const rootResource = await writeStaticJson(store, rootValue.schemaVersion, rootValue);
    const resources = [entity, item, coverage].map((resource) => ({ reference: resource.reference, identity: resource.identity }));
    const publicationRoot = join(root, "publication");
    const selected = await selectPublication(store, publicationRoot, { reference: rootResource.reference, identity: rootResource.identity }, resources, [], gate);
    const selectedBytes = await readFile(join(publicationRoot, "selected.json"), "utf8");
    expect(selected.root.sha256).toBe(rootResource.identity.sha256);

    await expect(selectPublication(store, publicationRoot, { reference: rootResource.reference, identity: rootResource.identity }, resources.slice(1), [], gate)).rejects.toThrow("missing");
    await expect(selectPublication(store, publicationRoot, { reference: { ...rootResource.reference, sha256: "f".repeat(64) }, identity: rootResource.identity }, resources, [], gate)).rejects.toThrow("root reference");
    await expect(selectPublication(store, publicationRoot, { reference: rootResource.reference, identity: rootResource.identity }, resources, [], { ...gate, accepted: false })).rejects.toThrow("catalog gate");

    const wrongEntity = await writeStaticJson<StaticEntitySearch>(store, "compendium.static-entity-search.v1", { schemaVersion: "compendium.static-entity-search.v1", buildId: "other", catalogId: identity.catalogId, entities: [] });
    const wrongRootValue = { ...rootValue, entitySearch: wrongEntity.reference };
    const wrongRoot = await writeStaticJson(store, wrongRootValue.schemaVersion, wrongRootValue);
    await expect(selectPublication(store, publicationRoot, { reference: wrongRoot.reference, identity: wrongRoot.identity }, [{ reference: wrongEntity.reference, identity: wrongEntity.identity }, ...resources.slice(1)], [], gate)).rejects.toThrow("build mismatch");
    expect(await readFile(join(publicationRoot, "selected.json"), "utf8")).toBe(selectedBytes);
  } finally { await rm(root, { recursive: true, force: true }); }
});
