import { Database } from "bun:sqlite";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { evaluateCatalogGate, queryCatalogMaps, type CatalogSpatialBounds } from "@afallon/catalog";
import { PublicTileLayerSchema, PublicWorldSchema, type PublicTileLayer, type PublicWorldOffset } from "@afallon/contracts/public";
import { buildStaticPublication } from "@afallon/publication";

interface PublishPlan {
  schemaVersion: "compendium.publish-plan.v1";
  catalogPath: string;
  artifactRoot: string;
  publicationRoot: string;
  mode: "preview" | "release";
  requiredSourceKeys: string[];
  spatialBounds: CatalogSpatialBounds[];
  worldOffsets: PublicWorldOffset[];
  imagery: Array<{ metadataPath: string; tileRoot: string }>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

function parsePlan(value: unknown): PublishPlan {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Publish plan must be an object.");
  const row = value as Record<string, unknown>;
  if (row.schemaVersion !== "compendium.publish-plan.v1" || (row.mode !== "preview" && row.mode !== "release")) throw new TypeError("Publish plan schemaVersion or mode is invalid.");
  for (const key of ["requiredSourceKeys", "spatialBounds", "worldOffsets", "imagery"]) if (!Array.isArray(row[key])) throw new TypeError(`Publish plan ${key} must be an array.`);
  const requiredSourceKeys = row.requiredSourceKeys as unknown[];
  if (!requiredSourceKeys.every((entry) => typeof entry === "string" && entry.length > 0)) throw new TypeError("Publish plan requiredSourceKeys must contain non-empty strings.");
  const spatialBounds = row.spatialBounds as CatalogSpatialBounds[];
  for (const [index, bounds] of spatialBounds.entries()) {
    if (!bounds || typeof bounds !== "object" || typeof bounds.mapSpaceId !== "string" || ![bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isFinite)) throw new TypeError(`Publish plan spatialBounds[${index}] is invalid.`);
  }
  const worldOffsets = row.worldOffsets as PublicWorldOffset[];
  Assert(PublicWorldSchema, { mapSpaceId: "world", label: "validation", bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }, offsets: worldOffsets, unplacedMapSpaceIds: [] });
  const imagery = (row.imagery as unknown[]).map((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`Publish plan imagery[${index}] must be an object.`);
    const asset = entry as Record<string, unknown>;
    return { metadataPath: text(asset.metadataPath, `imagery[${index}].metadataPath`), tileRoot: text(asset.tileRoot, `imagery[${index}].tileRoot`) };
  });
  return { schemaVersion: row.schemaVersion, catalogPath: text(row.catalogPath, "catalogPath"), artifactRoot: text(row.artifactRoot, "artifactRoot"), publicationRoot: text(row.publicationRoot, "publicationRoot"), mode: row.mode, requiredSourceKeys: requiredSourceKeys as string[], spatialBounds, worldOffsets, imagery };
}

async function registerImagery(db: Database, store: ArtifactStore, planDirectory: string, imagery: PublishPlan["imagery"], buildId: string): Promise<void> {
  const insert = db.query<void, [string, string, string, string, string, number, string, string]>("INSERT OR REPLACE INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const registration of imagery) {
    const metadataPath = resolve(planDirectory, registration.metadataPath);
    const value: unknown = JSON.parse(await readFile(metadataPath, "utf8"));
    Assert(PublicTileLayerSchema, value);
    const layer = value as PublicTileLayer;
    const tileRoot = resolve(planDirectory, registration.tileRoot);
    for (const tile of layer.tiles) {
      const stored = await store.putFile(resolve(tileRoot, tile.url));
      if (stored.sha256 !== tile.sha256 || stored.bytes !== tile.bytes) throw new Error(`Imagery tile identity mismatch: ${tile.url}.`);
    }
    const bytes = new TextEncoder().encode(JSON.stringify(layer));
    const stored = await store.putBytes(bytes);
    insert.run(layer.id, buildId, layer.mapSpaceId, layer.kind, stored.sha256, stored.bytes, JSON.stringify(layer), JSON.stringify([{ artifact: metadataPath }]));
  }
}

export async function runPublishCommand(planPath: string) {
  const absolutePlan = resolve(planPath);
  const plan = parsePlan(JSON.parse(await readFile(absolutePlan, "utf8")));
  const planDirectory = dirname(absolutePlan);
  const db = new Database(resolve(planDirectory, plan.catalogPath));
  try {
    const identity = queryCatalogMaps(db);
    const store = new ArtifactStore(resolve(planDirectory, plan.artifactRoot));
    await registerImagery(db, store, planDirectory, plan.imagery, identity.buildId);
    const gate = evaluateCatalogGate(db, { mode: plan.mode, expectedBuildId: identity.buildId, expectedCatalogId: identity.catalogId, requiredSourceKeys: plan.requiredSourceKeys, spatialBounds: plan.spatialBounds });
    const result = await buildStaticPublication(db, store, resolve(planDirectory, plan.publicationRoot), plan.mode, gate, plan.worldOffsets);
    return { buildId: identity.buildId, catalogId: identity.catalogId, gate, manifest: result.manifest, selection: result.selection };
  } finally {
    db.close();
  }
}
