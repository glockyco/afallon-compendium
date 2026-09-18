import { expect, test } from "bun:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PUBLICATION_ESSENTIAL_BUDGET, type StaticCoverage, type StaticEntityDetail, type StaticEntitySearch, type StaticItemSearch, type StaticRootManifest } from "@afallon/contracts/public";
import { writeStaticJson } from "./resources";
import { selectPublication } from "./selection";
import { publishFromPlan } from "./application";
import { publicationFixture } from "./publication-fixture.test";

const gate = { accepted: true, complete: false };

test("rejects broken nested edges and damaged reuse without replacing the selected publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-publication-select-"));
  try {
    const { store, plan, options } = await publicationFixture(root);
    const generated = await publishFromPlan(store, plan, { ...options, select: false });
    const mapResources = generated.resources.filter((resource) => /^compendium\.static-(?:map|geometry|imagery)\./.test(resource.reference.schemaId));
    const identity = { buildId: "build", catalogId: "c".repeat(64) };
    const detail = await writeStaticJson<StaticEntityDetail>(store, "compendium.static-entity-detail.v1", { schemaVersion: "compendium.static-entity-detail.v1", ...identity, entity: { entityKey: "items:1", nativeId: 1, kind: "items", name: "Item", description: null, placementIds: [], sections: [] } });
    const entity = await writeStaticJson<StaticEntitySearch>(store, "compendium.static-entity-search.v2", { schemaVersion: "compendium.static-entity-search.v2", ...identity, part: 0, entities: [{ entityKey: "items:1", nativeId: 1, kind: "items", name: "Item", description: null, detail: detail.reference }] });
    const item = await writeStaticJson<StaticItemSearch>(store, "compendium.static-item-search.v2", { schemaVersion: "compendium.static-item-search.v2", ...identity, part: 0, items: [] });
    const coverage = await writeStaticJson<StaticCoverage>(store, "compendium.static-coverage.v1", { schemaVersion: "compendium.static-coverage.v1", ...identity, complete: false, unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0, messages: [] });
    const rootValue: StaticRootManifest = { schemaVersion: "compendium.static-root.v2", ...identity, mode: "preview", complete: false, world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] }, maps: generated.manifest.maps, entitySearch: [entity.reference], itemSearch: [item.reference], guides: {}, coverage: coverage.reference };
    const rootResource = await writeStaticJson(store, rootValue.schemaVersion, rootValue);
    const resources = [...mapResources, entity, item, coverage, detail].map((resource) => ({ reference: resource.reference, identity: resource.identity }));
    const publicationRoot = join(root, "publication");
    const selected = await selectPublication(store, publicationRoot, rootResource, resources, generated.assets, gate);
    const selectedBytes = await readFile(join(publicationRoot, "selected.json"), "utf8");
    expect(await readFile(join(publicationRoot, selected.directory, detail.reference.path))).toEqual(await readFile(store.objectPath(detail.identity.sha256)));
    await selectPublication(store, publicationRoot, rootResource, resources, generated.assets, gate);

    await expect(selectPublication(store, publicationRoot, rootResource, resources.slice(0, -1), generated.assets, gate)).rejects.toThrow("missing");
    await expect(selectPublication(store, publicationRoot, { reference: { ...rootResource.reference, sha256: "f".repeat(64) }, identity: rootResource.identity }, resources, generated.assets, gate)).rejects.toThrow("reference");
    await expect(selectPublication(store, publicationRoot, rootResource, resources, generated.assets, { ...gate, accepted: false })).rejects.toThrow("catalog gate");
    const wrongRoot = await writeStaticJson(store, rootValue.schemaVersion, { ...rootValue, guides: { overview: entity.reference } });
    await expect(selectPublication(store, publicationRoot, wrongRoot, resources, generated.assets, gate)).rejects.toThrow();
    const unsafeRoot = await writeStaticJson(store, rootValue.schemaVersion, { ...rootValue, coverage: { ...coverage.reference, path: "../escape.json" } });
    await expect(selectPublication(store, publicationRoot, unsafeRoot, resources, generated.assets, gate)).rejects.toThrow();

    const wrongDetail = await writeStaticJson<StaticEntityDetail>(store, detail.value.schemaVersion, { ...detail.value, buildId: "other" });
    const wrongEntity = await writeStaticJson<StaticEntitySearch>(store, entity.value.schemaVersion, { ...entity.value, entities: [{ ...entity.value.entities[0]!, detail: wrongDetail.reference }] });
    const wrongBuildRoot = await writeStaticJson(store, rootValue.schemaVersion, { ...rootValue, entitySearch: [wrongEntity.reference] });
    await expect(selectPublication(store, publicationRoot, wrongBuildRoot, [...mapResources, wrongEntity, item, coverage, wrongDetail], generated.assets, gate)).rejects.toThrow("build mismatch");

    const largeCoverage = await writeStaticJson<StaticCoverage>(store, coverage.value.schemaVersion, { ...coverage.value, messages: ["x".repeat(PUBLICATION_ESSENTIAL_BUDGET)] });
    const oversizedRoot = await writeStaticJson(store, rootValue.schemaVersion, { ...rootValue, coverage: largeCoverage.reference });
    await expect(selectPublication(store, publicationRoot, oversizedRoot, [...mapResources, entity, item, largeCoverage, detail], generated.assets, gate)).rejects.toThrow();
    expect(await readFile(join(publicationRoot, "selected.json"), "utf8")).toBe(selectedBytes);

    const copiedDetail = join(publicationRoot, selected.directory, detail.reference.path);
    await chmod(copiedDetail, 0o644);
    await writeFile(copiedDetail, "damaged");
    await expect(selectPublication(store, publicationRoot, rootResource, resources, generated.assets, gate)).rejects.toThrow("mismatch");
    expect(await readFile(join(publicationRoot, "selected.json"), "utf8")).toBe(selectedBytes);
    await store.verify(detail.identity);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);
