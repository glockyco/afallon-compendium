import { Database } from "bun:sqlite";
import sharp from "sharp";
import { expect, test } from "bun:test";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore, beginArtifactRun, readArtifactLeases, readLatestSuccess } from "@afallon/artifacts";
import type { ContentIdentity } from "@afallon/contracts";
import type { PublicationPlan, PublicationPresentation } from "@afallon/contracts/public";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { publishFromPlan } from "./application";

async function publicationFixture(root: string, buildId = "build") {
  const store = new ArtifactStore(join(root, "store"));
  const tile = await store.putBytes(await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }).webp().toBuffer());
  const layer = { id: "game", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 10, 10], tiles: [{ z: 0, x: 0, y: 0, url: "tile.webp", sha256: tile.sha256, bytes: tile.bytes, width: 256, height: 256, state: "captured" }] };
  const imagery = await store.putBytes(new TextEncoder().encode(JSON.stringify({ schemaVersion: "compendium.catalog-imagery.v1", buildId, layer, inputs: [{ sha256: tile.sha256, bytes: tile.bytes }] })));
  const databasePath = join(root, "catalog.sqlite");
  const db = openNormalizedDatabase(databasePath);
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run(buildId, "compendium.catalog.v2", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), buildId, "compendium.catalog.v2", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run(buildId, 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run(buildId, "world", "World");
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(buildId, "items", 1, "items:1", "Item", null, null, 1, "{}", "[]");
    db.query("INSERT INTO entity_details VALUES (?, ?)").run("items:1", JSON.stringify({ entityKey: "items:1", kind: "items", nativeId: 1, name: "Item", internalName: null, description: null, publicData: { localization: null, gameplay: null, icon: null }, roles: [], placementIds: [], sources: [], relationships: { merchantStock: [], lootBindings: [], lootEntries: [], resourceYields: [], questAssociations: [], transitions: [], conditions: [] }, provenance: [] }));
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("placement", buildId, 1, "scene", "world", 0, 0, 0, 5, 5, null, "null", "[]");
    db.query("INSERT INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("game", buildId, "world", "game-map", imagery.sha256, imagery.bytes, JSON.stringify(layer), "[]");
  } finally { db.close(); }
  const catalog = await store.putFile(databasePath);
  const catalogRun = await beginArtifactRun(store, { buildId, operation: "catalog", inputs: {}, settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test" });
  try {
    await catalogRun.addArtifact("catalog.sqlite", catalog, { mediaType: "application/vnd.sqlite3", schemaId: "compendium.catalog.v2", references: [imagery, tile].map(({ sha256, bytes }) => ({ kind: "object" as const, content: { sha256, bytes } })) });
    await catalogRun.succeed();
  } finally { await catalogRun.release(); }
  const presentation: PublicationPresentation = { schemaVersion: "compendium.publication-presentation.v1", buildId, catalogId: "c".repeat(64), worldOffsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], spatialBounds: [{ mapSpaceId: "world", minX: 0, minY: 0, maxX: 10, maxY: 10 }], capturedMapSpaceIds: [] };
  const presentationObject = await store.putBytes(new TextEncoder().encode(JSON.stringify(presentation)));
  const plan: PublicationPlan = { schemaVersion: "compendium.publish-plan.v2", buildId, mode: "preview", catalog: { manifest: catalogRun.manifestIdentity!, object: { sha256: catalog.sha256, bytes: catalog.bytes }, catalogId: "c".repeat(64) }, presentation: { sha256: presentationObject.sha256, bytes: presentationObject.bytes } };
  return { store, plan, options: { publicationRoot: join(root, "publication"), diagnosticRevision: "test", select: true }, referencePath: join(store.root, "refs", buildId, "publish", "latest-success.json") };
}

async function shiftedPlan(store: ArtifactStore, plan: PublicationPlan): Promise<PublicationPlan> {
  const presentation: PublicationPresentation = JSON.parse(await readFile(store.objectPath(plan.presentation.sha256), "utf8"));
  presentation.worldOffsets[0]!.worldX = 100;
  const object = await store.putBytes(new TextEncoder().encode(JSON.stringify(presentation)));
  return { ...plan, presentation: { sha256: object.sha256, bytes: object.bytes } };
}

test("hands off unselected candidates, counts startup coverage, and releases publication leases", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publish-handoff-")));
  try {
    const { store, plan, options } = await publicationFixture(root);
    const candidate = await publishFromPlan(store, plan, { ...options, select: false });
    expect(candidate.selection).toBeNull();
    expect(await readLatestSuccess(store, plan.buildId, "publish")).toBeNull();
    expect(await readArtifactLeases(store)).toEqual([]);
    const selected = await publishFromPlan(store, plan, options);
    expect((await readLatestSuccess(store, plan.buildId, "publish"))?.manifest.runId).toBe(selected.runManifest.runId);
    expect(JSON.parse(await readFile(join(options.publicationRoot, "selected.json"), "utf8"))).toEqual(selected.selection);
    expect(selected.measurements.essentialBytes).toBe(selected.root.identity.bytes + selected.manifest.coverage.bytes + selected.manifest.maps.reduce((sum, map) => sum + map.imagery.bytes + map.parts.reduce((total, part) => total + part.bytes, 0), 0));
    expect(selected.measurements.essentialRequests).toBe(2 + selected.manifest.maps.reduce((sum, map) => sum + 1 + map.parts.length, 0));
    expect(await readArtifactLeases(store)).toEqual([]);
    await expect(publishFromPlan(store, { ...plan, mode: "release" }, options)).rejects.toThrow();
    expect((await readLatestSuccess(store, plan.buildId, "publish"))?.manifest.runId).toBe(selected.runManifest.runId);
    expect(await readArtifactLeases(store)).toEqual([]);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);

test("rolls back both selectors without rewriting success and retains both leases until selection ends", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publish-rollback-")));
  try {
    const { store, plan, options, referencePath } = await publicationFixture(root);
    const first = await publishFromPlan(store, plan, options);
    const beforeReference = await readFile(referencePath);
    const beforeSelection = await readFile(join(options.publicationRoot, "selected.json"));
    const verify = store.verify.bind(store);
    let sealedPath: string | undefined;
    let sealedBytes: Buffer | undefined;
    store.verify = async (identity: ContentIdentity) => {
      const pointer = JSON.parse(await readFile(referencePath, "utf8"));
      if (pointer.runId !== first.runManifest.runId) {
        store.verify = verify;
        sealedPath = join(store.root, pointer.manifest.path);
        sealedBytes = await readFile(sealedPath);
        const leases = await readArtifactLeases(store);
        expect(leases.map((lease) => lease.runId).sort()).toEqual([pointer.runId, `publication-${pointer.runId}`].sort());
        expect(leases.every((lease) => lease.objects.some((object) => object.sha256 === identity.sha256))).toBe(true);
        throw new Error("Injected selection failure");
      }
      return await verify(identity);
    };
    await expect(publishFromPlan(store, await shiftedPlan(store, plan), options)).rejects.toThrow();
    expect(sealedPath).toBeDefined();
    expect((await readFile(sealedPath!)).equals(sealedBytes!)).toBe(true);
    expect(JSON.parse(sealedBytes!.toString("utf8")).status).toBe("succeeded");
    expect(await readFile(referencePath)).toEqual(beforeReference);
    expect(await readFile(join(options.publicationRoot, "selected.json"))).toEqual(beforeSelection);
    expect(await readArtifactLeases(store)).toEqual([]);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);

test("does not steal a live publication-root lock across stores and builds", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publish-live-owner-")));
  try {
    const first = await publicationFixture(root);
    await publishFromPlan(first.store, first.plan, first.options);
    const otherRoot = await realpath(await mkdtemp(join(root, "other-")));
    const second = await publicationFixture(otherRoot, "other-build");
    const options = { ...second.options, publicationRoot: first.options.publicationRoot };
    const selectedPath = join(options.publicationRoot, "selected.json");
    const before = await readFile(selectedPath);
    const lock = new Database(join(options.publicationRoot, ".publication-selection.sqlite"), { create: true });
    lock.exec("BEGIN EXCLUSIVE");
    try {
      await expect(publishFromPlan(second.store, second.plan, options)).rejects.toThrow();
      expect(await readFile(selectedPath)).toEqual(before);
      expect(await readLatestSuccess(second.store, second.plan.buildId, "publish")).toBeNull();
      expect(await readArtifactLeases(second.store)).toEqual([]);
    } finally { lock.close(); }
    const selected = await publishFromPlan(second.store, second.plan, options);
    expect(JSON.parse(await readFile(selectedPath, "utf8"))).toEqual(selected.selection);
    expect(await readArtifactLeases(second.store)).toEqual([]);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);

for (const state of ["preparing", "settled"] as const) test(`does not restore stale snapshots from a ${state} selection journal`, async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publish-journal-phase-")));
  try {
    const { store, plan, options, referencePath } = await publicationFixture(root);
    await publishFromPlan(store, plan, options);
    const publicationPath = join(options.publicationRoot, "selected.json");
    const previousReference = (await readFile(referencePath)).toString("base64");
    const previousPublication = (await readFile(publicationPath)).toString("base64");
    await publishFromPlan(store, await shiftedPlan(store, plan), options);
    const currentReference = await readFile(referencePath);
    const currentPublication = await readFile(publicationPath);
    const journalPath = join(store.root, "refs", plan.buildId, "publish", ".publication-selection-interrupted.json");
    const pendingPath = join(options.publicationRoot, ".publication-selection.pending.json");
    await writeFile(journalPath, JSON.stringify({ state, referencePath, publicationPath, previousReference, previousPublication }));
    await writeFile(pendingPath, JSON.stringify({ journalPath }));
    const verify = store.verify.bind(store);
    let observedRecovery = false;
    store.verify = async (identity: ContentIdentity) => {
      if (JSON.parse(await readFile(pendingPath, "utf8")).journalPath !== journalPath) {
        observedRecovery = true;
        store.verify = verify;
        throw new Error("Injected failure after journal cleanup");
      }
      return await verify(identity);
    };
    await expect(publishFromPlan(store, plan, options)).rejects.toThrow();
    expect(observedRecovery).toBe(true);
    expect(await readFile(referencePath)).toEqual(currentReference);
    expect(await readFile(publicationPath)).toEqual(currentPublication);
    expect(await readArtifactLeases(store)).toEqual([]);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);

test("recovers an interrupted selector pair under its original locks before selecting another root", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publish-interrupted-")));
  try {
    const { store, plan, options, referencePath } = await publicationFixture(root);
    const first = await publishFromPlan(store, plan, options);
    const beforeReference = await readFile(referencePath);
    const beforeSelection = await readFile(join(options.publicationRoot, "selected.json"));
    const crashPath = join(root, "interrupted.json");
    const child = Bun.spawn([process.execPath, "--eval", `
      import { readFile, writeFile } from "node:fs/promises";
      import { ArtifactStore } from ${JSON.stringify(import.meta.resolve("@afallon/artifacts"))};
      import { publishFromPlan } from ${JSON.stringify(import.meta.resolve("./application"))};
      const fixture = JSON.parse(process.env.PUBLICATION_FIXTURE);
      const store = new ArtifactStore(fixture.storeRoot);
      const verify = store.verify.bind(store);
      store.verify = async (identity) => {
        const pointer = JSON.parse(await readFile(fixture.referencePath, "utf8"));
        if (pointer.runId !== fixture.previousRunId) {
          await writeFile(fixture.crashPath, JSON.stringify(pointer));
          process.kill(process.pid, "SIGKILL");
          await Promise.withResolvers().promise;
        }
        return await verify(identity);
      };
      await publishFromPlan(store, fixture.plan, fixture.options);
      throw new Error("Publisher did not reach the interruption point.");
    `], { env: { ...process.env, PUBLICATION_FIXTURE: JSON.stringify({ storeRoot: store.root, plan: await shiftedPlan(store, plan), options, referencePath, previousRunId: first.runManifest.runId, crashPath }) }, stdin: "ignore", stdout: "ignore", stderr: "ignore" });
    expect(await child.exited).not.toBe(0);
    const interrupted = JSON.parse(await readFile(crashPath, "utf8"));
    expect(interrupted.runId).not.toBe(first.runManifest.runId);
    expect(JSON.parse(await readFile(referencePath, "utf8")).runId).toBe(interrupted.runId);
    expect(await readFile(join(options.publicationRoot, "selected.json"))).toEqual(beforeSelection);
    const sealedPath = join(store.root, interrupted.manifest.path);
    const sealedBytes = await readFile(sealedPath);
    const abandonedLeases = (await readArtifactLeases(store)).map((lease) => lease.runId).sort();

    const originalLock = new Database(join(options.publicationRoot, ".publication-selection.sqlite"), { create: true });
    originalLock.exec("BEGIN EXCLUSIVE");
    const nextOptions = { ...options, publicationRoot: join(root, "next-publication") };
    try {
      await expect(publishFromPlan(store, plan, nextOptions)).rejects.toThrow();
      expect(JSON.parse(await readFile(referencePath, "utf8")).runId).toBe(interrupted.runId);
    } finally { originalLock.close(); }

    const verify = store.verify.bind(store);
    let observedRecovery = false;
    store.verify = async (identity: ContentIdentity) => {
      if ((await readFile(referencePath)).equals(beforeReference)) {
        observedRecovery = true;
        store.verify = verify;
        throw new Error("Injected failure after recovery");
      }
      return await verify(identity);
    };
    await expect(publishFromPlan(store, plan, nextOptions)).rejects.toThrow();
    expect(observedRecovery).toBe(true);
    expect(await readFile(referencePath)).toEqual(beforeReference);
    expect(await readFile(join(options.publicationRoot, "selected.json"))).toEqual(beforeSelection);
    expect(await readFile(sealedPath)).toEqual(sealedBytes);
    expect((await readArtifactLeases(store)).map((lease) => lease.runId).sort()).toEqual(abandonedLeases);
    const selected = await publishFromPlan(store, plan, nextOptions);
    expect((await readLatestSuccess(store, plan.buildId, "publish"))?.manifest.runId).toBe(selected.runManifest.runId);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);
