import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";

import { beginRun, loadVerifiedRun, type VerifiedRun } from "../tools/runs";
import { toolRevision } from "../tools/build";
import { compileMapSpaces } from "../tools/map-spaces";
import { MapSpaceProfileSchema, type MapSpaceProfile } from "../tools/spatial-contracts";
import { SceneCatalogSchema, type SceneCatalog } from "../tools/map-contracts";
import { IllustrationOutputSchema, type IllustrationOutput } from "../tools/illustration-contracts";
import { TilePyramidSchema, type TilePyramid } from "./tile-contracts";
import type { EntityDetail, NormalizedEntityDetails, NormalizedItemSources, NormalizedMapProjection, NormalizedCoverageSummary, NormalizedPlacement, NormalizedRegion } from "./normalized-contracts";
import { projectAdventureGuide } from "./guide-projection";
import { PUBLICATION_SCHEMA_VERSION, PublicEntitySchema, PublicGuideBossSchema, PublicGuideBossSummarySchema, PublicGuideDungeonSchema, PublicGuideDungeonSummarySchema, PublicGuidePropertySchema, PublicGuideRegionSchema, PUBLIC_MARKER_CATEGORY_VALUES, type PublicAffine, type PublicDetailSection, type PublicDetailRow, type PublicEntity, type PublicItemSource, type PublicLevelRange, type PublicMarkerCategory, type PublicMovement, type PublicPatrolPath, type PublicPlacement, type PublicRegion, type PublicTileLayer, type PublicTravel, type PublicationData, type PublicEntitySummary, type PublicItemSummary } from "./public-contracts";
import { WorldOffsetsSchema, type WorldOffsets, buildWorldLayout } from "./world-layout";
import { validateEntityDetails, validateItemSources, validatePublication } from "./publication-validation";


// Resamples a calibrated illustration onto the world tile lattice. The lattice is the one captured
// imagery uses: a tile at zoom z covers 256 / 2 ** z world units on each axis, and image row zero
// is the northern edge. Each lattice pixel is mapped back through the inverse transform and
// sampled bilinearly from the artwork, so a rotated zone is handled the same way as an aligned one.
// Only the part inside the map's reviewed bounds is published, and the finest level is the one
// closest to the artwork's own resolution, so no pixel is invented.
async function tileIllustration(
  layerId: string,
  mapSpaceId: string,
  bytes: Uint8Array,
  image: { width: number; height: number },
  affine: PublicAffine,
  bounds: { min: { x: number; y: number }; max: { x: number; y: number } },
  coarsestZoom: number,
  assetBytes: Map<string, Uint8Array>,
): Promise<Omit<PublicTileLayer, "kind" | "label">> {
  const { xAxis, yAxis, origin } = affine;
  const determinant = xAxis.x * yAxis.y - xAxis.y * yAxis.x;
  if (!Number.isFinite(determinant) || determinant === 0) throw new Error(`Illustration "${layerId}" has a degenerate transform.`);
  // Inverse of [xAxis yAxis]: world delta -> artwork pixel.
  const inverse = { a: yAxis.y / determinant, b: -yAxis.x / determinant, c: -xAxis.y / determinant, d: xAxis.x / determinant };
  const toArtwork = (wx: number, wy: number): [number, number] => {
    const dx = wx - origin.x, dy = wy - origin.y;
    return [inverse.a * dx + inverse.b * dy, inverse.c * dx + inverse.d * dy];
  };
  const toWorld = (px: number, py: number): [number, number] => [origin.x + xAxis.x * px + yAxis.x * py, origin.y + xAxis.y * px + yAxis.y * py];
  const corners = [toWorld(0, 0), toWorld(image.width, 0), toWorld(0, image.height), toWorld(image.width, image.height)];
  const artwork = { minX: Math.min(...corners.map((c) => c[0])), maxX: Math.max(...corners.map((c) => c[0])), minY: Math.min(...corners.map((c) => c[1])), maxY: Math.max(...corners.map((c) => c[1])) };
  const clip = { minX: Math.max(artwork.minX, bounds.min.x), maxX: Math.min(artwork.maxX, bounds.max.x), minY: Math.max(artwork.minY, bounds.min.y), maxY: Math.min(artwork.maxY, bounds.max.y) };
  if (clip.minX >= clip.maxX || clip.minY >= clip.maxY) throw new Error(`Illustration "${layerId}" does not overlap its map's bounds.`);
  // World units per artwork pixel along each axis; the finest zoom whose lattice pixel is no
  // finer than the artwork pixel.
  const unitsPerPixel = Math.min(Math.hypot(xAxis.x, xAxis.y), Math.hypot(yAxis.x, yAxis.y));
  const maxZoom = Math.floor(Math.log2(1 / unitsPerPixel));
  const span = Math.max(clip.maxX - clip.minX, clip.maxY - clip.minY);
  // No coarser than the map's own pyramid: world offsets are aligned to that lattice, not beyond it.
  const minZoom = Math.max(coarsestZoom, Math.min(maxZoom, Math.floor(Math.log2(256 / span))));
  const source = await sharp(bytes, { limitInputPixels: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tiles: PublicTileLayer["tiles"] = [];
  for (let z = maxZoom; z >= minZoom; z--) {
    const unitsPerTile = 256 / 2 ** z;
    const pixelsPerUnit = 2 ** z;
    // Sample from a copy shrunk to about the lattice resolution so minification averages rather than aliases.
    const shrink = Math.min(1, pixelsPerUnit * unitsPerPixel);
    const sampled = shrink < 1
      ? await sharp(source.data, { raw: { width: source.info.width, height: source.info.height, channels: 4 } }).resize({ width: Math.max(1, Math.round(source.info.width * shrink)), height: Math.max(1, Math.round(source.info.height * shrink)), fit: "fill" }).raw().toBuffer({ resolveWithObject: true })
      : source;
    const scaleX = sampled.info.width / image.width, scaleY = sampled.info.height / image.height;
    const tileMinX = Math.floor(clip.minX / unitsPerTile), tileMaxX = Math.ceil(clip.maxX / unitsPerTile);
    const tileMinY = Math.floor(clip.minY / unitsPerTile), tileMaxY = Math.ceil(clip.maxY / unitsPerTile);
    for (let ty = tileMinY; ty < tileMaxY; ty++) for (let tx = tileMinX; tx < tileMaxX; tx++) {
      const tilePixels = Buffer.alloc(256 * 256 * 4);
      let opaque = 0;
      const worldLeft = tx * unitsPerTile, worldTop = (ty + 1) * unitsPerTile;
      for (let row = 0; row < 256; row++) {
        const wy = worldTop - (row + 0.5) / pixelsPerUnit;
        for (let column = 0; column < 256; column++) {
          const wx = worldLeft + (column + 0.5) / pixelsPerUnit;
          if (wx < clip.minX || wx >= clip.maxX || wy < clip.minY || wy >= clip.maxY) continue;
          const [ax, ay] = toArtwork(wx, wy);
          const sx = ax * scaleX - 0.5, sy = ay * scaleY - 0.5;
          if (sx < -0.5 || sy < -0.5 || sx >= sampled.info.width - 0.5 || sy >= sampled.info.height - 0.5) continue;
          const x0 = Math.max(0, Math.floor(sx)), y0 = Math.max(0, Math.floor(sy));
          const x1 = Math.min(sampled.info.width - 1, x0 + 1), y1 = Math.min(sampled.info.height - 1, y0 + 1);
          const fx = Math.min(1, Math.max(0, sx - x0)), fy = Math.min(1, Math.max(0, sy - y0));
          const at = (row * 256 + column) * 4;
          for (let channel = 0; channel < 4; channel++) {
            const p00 = sampled.data[(y0 * sampled.info.width + x0) * 4 + channel]!, p10 = sampled.data[(y0 * sampled.info.width + x1) * 4 + channel]!;
            const p01 = sampled.data[(y1 * sampled.info.width + x0) * 4 + channel]!, p11 = sampled.data[(y1 * sampled.info.width + x1) * 4 + channel]!;
            tilePixels[at + channel] = Math.round((p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy);
          }
          if (tilePixels[at + 3]! !== 0) opaque++;
        }
      }
      const state = opaque === 0 ? "empty" : opaque === 256 * 256 ? "captured" : "partial";
      const webp = await sharp(tilePixels, { raw: { width: 256, height: 256, channels: 4 } }).webp({ quality: 82 }).toBuffer();
      const sha256 = createHash("sha256").update(webp).digest("hex"), url = `imagery/${sha256}.webp`;
      assetBytes.set(url, webp);
      // Coverage reads the pixel under a placement, so the game map's alpha counts like a capture's.
      tiles.push({ z, x: tx, y: ty, width: 256, height: 256, url, sha256, bytes: webp.byteLength, state });
    }
  }
  // The extent is the union of the finest tiles, which is what the reader's lattice covers.
  const finest = 256 / 2 ** maxZoom;
  return {
    id: layerId, mapSpaceId, tileSize: 256, minZoom, maxZoom,
    extent: [Math.floor(clip.minX / finest) * finest, Math.floor(clip.minY / finest) * finest, Math.ceil(clip.maxX / finest) * finest, Math.ceil(clip.maxY / finest) * finest],
    tiles,
  };
}

const reference = Type.Object({ path: Type.String({ minLength: 1 }), sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }) }, { additionalProperties: false });
export const GuideDocumentSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.adventure-guide.v1"), buildId: Type.String({ minLength: 1 }),
  counts: Type.Object({ dungeons: Type.Integer({ minimum: 0 }), bosses: Type.Integer({ minimum: 0 }), regions: Type.Integer({ minimum: 0 }), properties: Type.Integer({ minimum: 0 }) }, { additionalProperties: false }),
  guide: Type.Object({
    dungeons: Type.Array(Type.Union([PublicGuideDungeonSchema, PublicGuideDungeonSummarySchema])),
    bosses: Type.Array(Type.Union([PublicGuideBossSchema, PublicGuideBossSummarySchema])),
    regions: Type.Array(PublicGuideRegionSchema), properties: Type.Array(PublicGuidePropertySchema),
  }, { additionalProperties: false }),
  entities: Type.Array(PublicEntitySchema),
}, { additionalProperties: false });
export const PublicationPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-plan.v2"),
  buildId: Type.String({ minLength: 1 }),
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  normalized: reference,
  pyramids: Type.Array(reference, { minItems: 1 }),
  illustrations: Type.Array(reference),
  worldOffsets: reference,
}, { additionalProperties: false });
export type PublicationPlan = Static<typeof PublicationPlanSchema>;

async function jsonArtifact<T extends { schemaVersion: string; buildId: string }>(run: VerifiedRun, path: string, schemaVersion: T["schemaVersion"]): Promise<T> {
  const { bytes } = await run.readArtifact(path);
  const value = JSON.parse(new TextDecoder().decode(bytes)) as T;
  if (value.schemaVersion !== schemaVersion || value.buildId !== run.manifest.input.buildId) throw new Error(`Publication input schema or build mismatch: ${path}`);
  return value;
}

async function readWorldOffsets(path: string, expectedSha256: string, buildId: string): Promise<WorldOffsets> {
  const bytes = await readFile(path);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256) throw new Error(`World offsets hash mismatch: ${path}`);
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  Assert(WorldOffsetsSchema, value);
  const offsets = value as WorldOffsets;
  if (offsets.buildId !== buildId) throw new Error(`World offsets build mismatch: ${path}`);
  return offsets;
}

function label(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

const categoryLabels: Readonly<Record<PublicMarkerCategory, string>> = {
  boss: "Boss",
  enemy: "Enemy",
  neutral: "Neutral",
  merchant: "Merchant",
  questGiver: "Quest giver",
  townsfolk: "Townsfolk",
  craftingStation: "Crafting station",
  container: "Container",
  oreVein: "Ore Vein",
  herb: "Herb",
  mushroom: "Mushroom",
  fishingSpot: "Fishing Spot",
  interactiveObject: "Interactive object",
  town: "Town",
  fort: "Fort",
  camp: "Camp",
  property: "Property",
  dungeonEntrance: "Dungeon entrance",
  corruptionAltar: "Altar of corruption",
  challengeStone: "Challenge stone",
  graveyard: "Graveyard",
  travelPoint: "Travel point",
};
const mapIconCategories: Readonly<Record<string, PublicMarkerCategory>> = {
  town: "town",
  fort: "fort",
  camp: "camp",
  dungeon: "dungeonEntrance",
  challengeStone: "challengeStone",
};
const roleCategory: Readonly<Record<string, PublicMarkerCategory | null>> = {
  enemy: "enemy",
  boss: "boss",
  elite: "enemy",
  neutral: "neutral",
  friendly: "townsfolk",
  npc: null,
  merchant: "merchant",
  questGiver: "questGiver",
  resourceProducer: null,
  oreVein: "oreVein",
  herb: "herb",
  mushroom: "mushroom",
  fishingHole: "fishingSpot",
  container: "container",
  storage: "container",
  transition: "travelPoint",
  respawnDestination: "graveyard",
  usefulInteraction: "interactiveObject",
  questLocation: "interactiveObject",
  craftingService: "craftingStation",
  propertyPurchaseService: "property",
  corruptionAltar: "corruptionAltar",
  combatant: null,
  dialogue: null,
  inspect: null,
  trade: null,
  adventurerProducer: null,
  adventurerPopulationManager: null,
};

export function categoryForRole(role: { role: string; scope?: unknown }): PublicMarkerCategory | null {
  if (role.role === "mapIcon") return typeof role.scope === "string" ? mapIconCategories[role.scope] ?? null : null;
  return roleCategory[role.role] ?? null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function levelRange(min: unknown, max: unknown): PublicLevelRange | undefined {
  if (typeof min !== "number" || !Number.isInteger(min) || min < 1 || typeof max !== "number" || !Number.isInteger(max) || max < min || (min === 100 && max === 100)) return undefined;
  return { min, max };
}

function consistentLevelRange(ranges: readonly (PublicLevelRange | undefined)[]): PublicLevelRange | undefined {
  const known = ranges.filter((range): range is PublicLevelRange => range !== undefined);
  if (known.length === 0) return undefined;
  const first = known[0]!;
  return known.every((range) => range.min === first.min && range.max === first.max) ? first : undefined;
}

export function gameplayLevelRange(gameplay: unknown): PublicLevelRange | undefined {
  const value = record(gameplay);
  if (!value) return undefined;
  const candidates: Array<[string, string]> = [
    ["minLevel", "maxLevel"],
    ["dungeonLevelMin", "dungeonLevelMax"],
    ["zoneScalingMinLevel", "zoneScalingMaxLevel"],
    ["levelRangeMin", "levelRangeMax"],
    ["LevelRangeMin", "LevelRangeMax"],
  ];
  for (const [min, max] of candidates) {
    const range = levelRange(value[min], value[max]);
    if (range) return range;
  }
  return undefined;
}

type LevelSourceRanges = {
  levelOverrides: Array<PublicLevelRange | undefined>;
  zoneScaling: Array<PublicLevelRange | undefined>;
  direct: Array<PublicLevelRange | undefined>;
};

function sourceLevelRanges(data: Record<string, unknown>): LevelSourceRanges {
  const overrides = record(data.overrides);
  const levels = record(overrides?.levels);
  const zoneScaling = record(overrides?.zoneScaling);
  return {
    levelOverrides: [levels?.enabled === true ? levelRange(levels.minLevel, levels.maxLevel) : undefined],
    zoneScaling: [zoneScaling?.enabled === true ? levelRange(zoneScaling.minLevel, zoneScaling.maxLevel) : undefined],
    direct: [levelRange(data.LevelRangeMin, data.LevelRangeMax), levelRange(data.levelRangeMin, data.levelRangeMax)],
  };
}

export function selectLevelRange(
  levelOverrides: readonly (PublicLevelRange | undefined)[],
  zoneScaling: readonly (PublicLevelRange | undefined)[],
  canonical: readonly (PublicLevelRange | undefined)[],
): PublicLevelRange | undefined {
  for (const ranges of [levelOverrides, zoneScaling, canonical]) {
    const known = ranges.filter((range): range is PublicLevelRange => range !== undefined);
    if (known.length === 0) continue;
    const first = known[0]!;
    return known.every((range) => range.min === first.min && range.max === first.max) ? first : undefined;
  }
  return undefined;
}

// Combatant and adventurer-producer are extraction facts, not game map categories.
// They occur only alongside a mapped NPC or world category in the current run.
// Every world scene authors its own copy of the game's world map icons, so one icon is
// observed once per scene (six times for Coalway woods and its challenge-stone variants).
// The atlas shows one marker per icon: placements that are map icons only, on the same map
// at the same point with the same icon kind, fold into the one with the lowest id. A titled
// copy supplies the label; two different titles at one point is an authoring contradiction.
export function foldRegions(regions: readonly PublicRegion[]): PublicRegion[] {
  const seen = new Map<string, PublicRegion>();
  for (const region of [...regions].sort((left, right) => left.id.localeCompare(right.id))) {
    const key = JSON.stringify([region.mapSpaceId, region.name, region.shape, region.polygon.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)])]);
    if (!seen.has(key)) seen.set(key, region);
  }
  return [...seen.values()].sort((left, right) => left.id.localeCompare(right.id));
}

const DUNGEON_TRAVEL_MERGE_DISTANCE = 6;

function sameTravelDestination(left: PublicTravel, right: PublicTravel): boolean {
  const a = left.destination, b = right.destination;
  if (a.status !== b.status || a.mapSpaceId !== b.mapSpaceId || a.placementId !== b.placementId) return false;
  if (a.status === "unresolved") return a.reason === b.reason && a.position === undefined && b.position === undefined;
  return a.position !== undefined && b.position !== undefined
    && Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]) <= 0.1;
}

export function foldTravelPlacements(placements: readonly PublicPlacement[]): { placements: PublicPlacement[]; replacementIds: ReadonlyMap<string, string> } {
  const replacementIds = new Map<string, string>();
  const claimed = new Set<string>();
  const travelPoints = placements.filter((placement) => placement.categories.includes("travelPoint") && placement.travel !== undefined);
  const mergedTravel = new Map<string, PublicPlacement>();

  // Normal and corrupted scene variants author separate copies of the same door. Collapse only
  // copies with the same source point and resolved destination; nearby distinct doors stay separate.
  for (const representative of [...travelPoints].sort((left, right) => left.placementId.localeCompare(right.placementId))) {
    const representativeTravel = representative.travel;
    if (claimed.has(representative.placementId) || !representativeTravel) continue;
    const equivalents = travelPoints.filter((travel) => travel.travel !== undefined
      && travel.mapSpaceId === representative.mapSpaceId
      && Math.hypot(travel.position[0] - representative.position[0], travel.position[1] - representative.position[1]) <= 0.1
      && sameTravelDestination(representativeTravel, travel.travel));
    if (equivalents.length < 2) continue;
    const labels = equivalents.map((travel) => travel.label).filter((value) => value !== "0" && value.toLocaleLowerCase() !== "travel point");
    const mergedLabel = labels.sort((left, right) => left.localeCompare(right))[0] ?? representative.label;
    const categories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => equivalents.some((travel) => travel.categories.includes(category)));
    for (const travel of equivalents) {
      if (travel.placementId === representative.placementId) continue;
      claimed.add(travel.placementId);
      replacementIds.set(travel.placementId, representative.placementId);
    }
    mergedTravel.set(representative.placementId, {
      ...representative,
      label: mergedLabel,
      categories,
      entityKeys: [...new Set(equivalents.flatMap((travel) => travel.entityKeys))].sort(),
      itemKeys: [...new Set(equivalents.flatMap((travel) => travel.itemKeys))].sort(),
      searchText: [mergedLabel, ...categories.map((category) => categoryLabels[category])].join(" "),
    });
  }

  const deduplicated = placements.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedTravel.get(placement.placementId) ?? placement);
  const dungeons = deduplicated.filter((placement) => placement.categories.includes("dungeonEntrance"));
  const deduplicatedTravel = deduplicated.filter((placement) => placement.categories.includes("travelPoint") && placement.travel !== undefined);
  const mergedByDungeon = new Map<string, PublicPlacement>();

  for (const dungeon of dungeons) {
    const nearby = deduplicatedTravel
      .filter((travel) => {
        const travelData = travel.travel;
        return !claimed.has(travel.placementId)
          && travel.mapSpaceId === dungeon.mapSpaceId
          && travelData !== undefined
          && (travelData.destination.status === "unresolved" || travelData.destination.mapSpaceId !== dungeon.mapSpaceId)
          && Math.hypot(travel.position[0] - dungeon.position[0], travel.position[1] - dungeon.position[1]) <= DUNGEON_TRAVEL_MERGE_DISTANCE;
      })
      .sort((left, right) => Number(right.travel?.destination.status === "resolved") - Number(left.travel?.destination.status === "resolved")
        || Math.hypot(left.position[0] - dungeon.position[0], left.position[1] - dungeon.position[1]) - Math.hypot(right.position[0] - dungeon.position[0], right.position[1] - dungeon.position[1])
        || left.placementId.localeCompare(right.placementId));
    const representative = nearby[0];
    const representativeTravel = representative?.travel;
    if (!representative || representativeTravel?.destination.status !== "resolved") continue;
    const equivalents = nearby.filter((travel) => travel.travel !== undefined && (travel.travel.destination.status === "unresolved" || sameTravelDestination(representativeTravel, travel.travel)));
    for (const travel of equivalents) {
      claimed.add(travel.placementId);
      replacementIds.set(travel.placementId, dungeon.placementId);
    }
    const categories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => category === "travelPoint" || dungeon.categories.includes(category));
    const mergedLabel = representative.label !== "0" && representative.label.toLocaleLowerCase() !== "travel point" ? representative.label : dungeon.label;
    mergedByDungeon.set(dungeon.placementId, {
      ...dungeon,
      label: mergedLabel,
      categories,
      entityKeys: [...new Set([...dungeon.entityKeys, ...equivalents.flatMap((travel) => travel.entityKeys)])].sort(),
      itemKeys: [...new Set([...dungeon.itemKeys, ...equivalents.flatMap((travel) => travel.itemKeys)])].sort(),
      travel: representativeTravel,
      searchText: [mergedLabel, ...categories.map((category) => categoryLabels[category])].join(" "),
    });
  }

  return {
    placements: deduplicated.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedByDungeon.get(placement.placementId) ?? placement),
    replacementIds,
  };
}

export function foldMapIcons(placements: readonly NormalizedPlacement[]): NormalizedPlacement[] {
  const groups = new Map<string, NormalizedPlacement[]>();
  const result: NormalizedPlacement[] = [];
  for (const placement of placements) {
    const iconOnly = placement.roles.length > 0 && placement.roles.every((role) => role.role === "mapIcon");
    if (!iconOnly || !placement.mapSpaceId || !placement.mapPosition) { result.push(placement); continue; }
    const scopes = [...new Set(placement.roles.map((role) => String(role.scope)))].sort();
    const key = JSON.stringify([placement.mapSpaceId, scopes, Math.round(placement.mapPosition.x * 100), Math.round(placement.mapPosition.y * 100)]);
    const group = groups.get(key);
    if (group) group.push(placement); else groups.set(key, [placement]);
  }
  for (const group of groups.values()) {
    group.sort((left, right) => left.placementId.localeCompare(right.placementId));
    const labels = [...new Set(group.map((placement) => placement.label).filter((label): label is string => typeof label === "string" && label.trim().length > 0))];
    if (labels.length > 1) throw new Error(`Map icons at one point carry different titles: ${labels.join(" / ")}`);
    result.push(labels.length === 1 && group[0]!.label !== labels[0] ? { ...group[0]!, label: labels[0]! } : group[0]!);
  }
  return result.sort((left, right) => left.placementId.localeCompare(right.placementId));
}

function placementCategories(placement: NormalizedPlacement): PublicMarkerCategory[] {
  // Adventurers are hired companions the game spawns from one staging point; they have no
  // place of their own, so their spawner publishes no marker.
  if (placement.roles.some((role) => role.role === "adventurer")) return [];
  const categories = new Set<PublicMarkerCategory>();
  for (const role of placement.roles) {
    const category = categoryForRole(role);
    if (category) categories.add(category);
  }
  // A friendly character with a service is listed by the service, not also as townsfolk.
  if (categories.has("townsfolk") && (categories.has("merchant") || categories.has("questGiver"))) categories.delete("townsfolk");
  // A door is a travel point and a chest is a container; the interaction is how a player
  // uses them, not a second category.
  if (categories.has("travelPoint") || categories.has("container")) categories.delete("interactiveObject");
  return PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => categories.has(category));
}

type NormalizedRegionForPublication = Pick<NormalizedRegion, "regionId" | "name" | "shape" | "mapSpaceId" | "mapGeometry">;

type RegionGeometry =
  | { kind: "box"; corners: readonly unknown[] }
  | { kind: "sphere"; center: readonly unknown[]; radius: unknown };

function regionGeometry(value: unknown, shape: NormalizedRegionForPublication["shape"]): RegionGeometry | null {
  const geometry = record(value);
  if (!geometry || geometry.kind !== shape) return null;
  if (shape === "box" && Array.isArray(geometry.corners)) return { kind: "box", corners: geometry.corners };
  if (shape === "sphere" && Array.isArray(geometry.center)) return { kind: "sphere", center: geometry.center, radius: geometry.radius };
  return null;
}

function finitePointPair(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "number" || !Number.isFinite(value[0]) || typeof value[1] !== "number" || !Number.isFinite(value[1])) return null;
  return [value[0], value[1]];
}

export function publicRegionFromNormalized(
  region: NormalizedRegionForPublication,
  offset: { worldX: number; worldY: number } = { worldX: 0, worldY: 0 },
): PublicRegion | null {
  if (!region.regionId || !region.name.trim() || !region.mapSpaceId) return null;
  const geometry = regionGeometry(region.mapGeometry, region.shape);
  if (!geometry) return null;
  let polygon: [number, number][];
  if (geometry.kind === "box") {
    if (geometry.corners.length !== 4) return null;
    const corners = geometry.corners.map(finitePointPair);
    if (corners.some((corner): corner is null => corner === null)) return null;
    polygon = corners as [number, number][];
  } else {
    const center = finitePointPair(geometry.center);
    const radius = geometry.radius;
    if (!center || typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0) return null;
    polygon = Array.from({ length: 32 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 32;
      return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius] as [number, number];
    });
  }
  return {
    id: region.regionId,
    mapSpaceId: region.mapSpaceId,
    name: region.name.trim(),
    shape: region.shape,
    polygon: polygon.map(([x, y]) => [x + offset.worldX, y + offset.worldY]),
  };
}

function sourceKindLabel(kind: string): string {
  return ({
    merchant: "Vendor",
    "npc-loot": "Drop",
    "world-loot": "Drop",
    container: "Container",
    resource: "Resource yield",
    quest: "Quest reward",
  } as Record<string, string>)[kind] ?? "Source";
}

function placementLevelRange(
  placement: NormalizedPlacement,
  entities: readonly EntityDetail[],
  sources: readonly NormalizedMapProjection["sources"][number][],
): PublicLevelRange | undefined {
  // A producer override is authored for this placement, so it wins over the NPC base
  // range the way the game applies it. Only sources of equal specificity can conflict.
  const sourceRanges = sources
    .filter((source) => source.placementId === placement.placementId)
    .map((source) => sourceLevelRanges(source.data));
  const npcRanges = placement.roles
    .filter((role) => role.npcId !== null)
    .map((role) => entities.find((entity) => entity.entityKey === `npcs:${role.npcId}`))
    .map((entity) => gameplayLevelRange(entity?.publicData.gameplay));
  return selectLevelRange(
    sourceRanges.flatMap((ranges) => ranges.levelOverrides),
    sourceRanges.flatMap((ranges) => ranges.zoneScaling),
    [...sourceRanges.flatMap((ranges) => ranges.direct), ...npcRanges],
  );
}

function sceneLevelRange(scene: EntityDetail | undefined): PublicLevelRange | undefined {
  return gameplayLevelRange(scene?.publicData.gameplay);
}

const nativeLineBreaks = /<br\s*\/?>/gi;
const nativeFormatTags = /<\/?(?:color|size|b|i|u|s|font|font-weight|mark|link|align|alpha|cspace|indent|line-height|line-indent|margin|margin-left|margin-right|mspace|nobr|pos|rotate|space|style|sub|sup|voffset|width|uppercase|lowercase|smallcaps)(?:=[^>]*|\s[^>]*)?>/gi;
function plainText(value: string): string {
  return (value.includes("<") ? value.replace(nativeLineBreaks, "\n").replace(nativeFormatTags, "") : value).trim();
}

function scalarRows(value: unknown, prefix = ""): PublicDetailRow[] {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [{ label: label(prefix || "Value"), value: plainText(String(value)) }];
  const rows: PublicDetailRow[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (/^source$|source.*(path|name)|path$|hierarchy|instanceid|native(type|method)|saver|savedstate|runtime|provenance|icon|localization|guid|serialized|file(name)?|^text$|^component|^current|observation|^active(Self|InHierarchy)$|^enabled$|^spawnedCount$|^ownerEntityKeys$|^sourceLabel$/i.test(key)) continue;
    rows.push(...scalarRows(child, prefix ? `${prefix} / ${label(key)}` : label(key)));
  }
  return rows;
}

function sectionsFor(entity: EntityDetail, names: Map<string, string>): PublicDetailSection[] {
  const sections: PublicDetailSection[] = [];
  const add = (title: string, rows: PublicDetailRow[]) => {
    if (rows.length === 0) return;
    const section = sections.find((candidate) => candidate.title === title);
    if (!section) { sections.push({ title, rows: [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()] }); return; }
    const existing = new Set(section.rows.map((row) => JSON.stringify(row)));
    for (const row of rows) if (!existing.has(JSON.stringify(row))) { section.rows.push(row); existing.add(JSON.stringify(row)); }
  };
  const itemRow = (id: number | null, value: string): PublicDetailRow | null => {
    const key = id === null ? "" : `items:${id}`;
    if (!key || !names.has(key)) return null;
    return { label: names.get(key)!, value, entityKey: key };
  };
  const relationships = entity.relationships;
  add("Vendor stock", relationships.merchantStock.flatMap((row) => {
    const currency = row.currencyId === null ? undefined : names.get(`currencies:${row.currencyId}`);
    const value = typeof row.cost === "number" ? `${row.cost}${currency ? ` ${currency}` : ""}` : "";
    const item = itemRow(row.itemId, value);
    return item ? [item] : [];
  }));
  add("Drops", relationships.lootEntries.flatMap((row) => {
    const minimum = row.min ?? row.max;
    const maximum = row.max ?? row.min;
    const value = typeof minimum === "number" && typeof maximum === "number" ? `Quantity ${minimum === maximum ? minimum : `${minimum}–${maximum}`}` : "";
    const item = itemRow(row.itemId, value);
    return item ? [item] : [];
  }));
  add("Gathering outputs", relationships.resourceYields.flatMap((row) => {
    const values = [typeof row.rank === "number" ? `Rank ${row.rank}` : "", typeof row.min === "number" && typeof row.max === "number" ? `Quantity ${row.min === row.max ? row.min : `${row.min}–${row.max}`}` : ""].filter(Boolean);
    const item = itemRow(row.itemId, values.join(" · "));
    return item ? [item] : [];
  }));
  add("Quest associations", relationships.questAssociations.flatMap((row) => {
    if (row.questId === null) return [];
    const key = `quests:${row.questId}`;
    const name = names.get(key);
    return name ? [{ label: label(row.associationKind), value: name, entityKey: key }] : [];
  }));
  for (const association of relationships.questAssociations) add(`Quest details — ${label(association.associationKind)}`, scalarRows(association.context));
  for (const condition of relationships.conditions) add("Requirements", scalarRows(condition.payload));
  add("Properties", scalarRows(entity.publicData.gameplay));
  return sections;
}

function spatialAreas(placement: NormalizedPlacement, resolver: ReturnType<typeof compileMapSpaces>): Array<Array<[number, number]>> {
  const shape = placement.shape;
  if (!shape || shape.kind === "point") return [];
  const radius = shape.radius;
  if (typeof radius !== "number" || !(radius > 0)) return [];
  const polygon: Array<[number, number]> = [];
  for (let index = 0; index < 48; index++) {
    const angle = index * Math.PI * 2 / 48;
    const point = { x: placement.worldPosition.x + radius * Math.cos(angle), y: placement.worldPosition.y, z: placement.worldPosition.z + radius * Math.sin(angle) };
    const candidate = resolver.resolve(placement.sceneNativeId, placement.scenePath, point).candidates.find(candidate => candidate.mapSpaceId === placement.mapSpaceId);
    if (!candidate) throw new Error(`Publication area crosses an unresolved map boundary: ${placement.placementId}`);
    polygon.push([candidate.mapPosition.x, candidate.mapPosition.y]);
  }
  return [polygon];
}

function resolvedPatrolPath(
  name: string,
  placement: NormalizedPlacement,
  paths: NormalizedMapProjection["patrolPaths"],
  resolver: ReturnType<typeof compileMapSpaces>,
  offset: { worldX: number; worldY: number },
): PublicPatrolPath {
  const matches = paths.filter((path) => path.sceneNativeId === placement.sceneNativeId && path.name === name);
  if (matches.length === 0) return { name, status: "unresolved", reason: "The source scene has no patrol path with this name." };
  if (matches.length > 1) return { name, status: "unresolved", reason: "The source scene has more than one patrol path with this name." };
  const path = matches[0]!;
  if (path.worldPoints.length === 0) return { name, status: "unresolved", reason: "The patrol path has no authored points." };
  const points: Array<[number, number]> = [];
  for (const point of path.worldPoints) {
    const candidates = resolver.resolve(path.sceneNativeId, path.scenePath, point).candidates.filter((candidate) => candidate.mapSpaceId === placement.mapSpaceId);
    if (candidates.length !== 1) return { name, status: "unresolved", reason: "A patrol point does not resolve uniquely to the placement map." };
    points.push([candidates[0]!.mapPosition.x + offset.worldX, candidates[0]!.mapPosition.y + offset.worldY]);
  }
  return { name, status: "resolved", looping: path.looping, groupPatrol: path.groupPatrol, groupSpacing: path.groupSpacing, poiRadius: path.poiRadius, points };
}

function movementForPlacement(
  placement: NormalizedPlacement,
  entities: readonly EntityDetail[],
  sources: readonly NormalizedMapProjection["sources"][number][],
  paths: NormalizedMapProjection["patrolPaths"],
  resolver: ReturnType<typeof compileMapSpaces>,
  offset: { worldX: number; worldY: number },
): PublicMovement[] {
  const movements: PublicMovement[] = [];
  const npcIds = [...new Set(placement.roles.flatMap((role) => role.npcId === null ? [] : [role.npcId]))];
  for (const npcId of npcIds) {
    const entity = entities.find((candidate) => candidate.entityKey === `npcs:${npcId}`);
    const gameplay = record(entity?.publicData.gameplay);
    for (const rawPhase of Array.isArray(gameplay?.aiPhases) ? gameplay.aiPhases : []) {
      const phase = record(rawPhase);
      if (!phase || !Number.isSafeInteger(phase.phaseIndex)) continue;
      for (const rawBehavior of Array.isArray(phase.behaviors) ? phase.behaviors : []) {
        const behavior = record(rawBehavior);
        const movement = record(behavior?.movement);
        if (!behavior || !movement || !Number.isSafeInteger(behavior.behaviorIndex) || typeof behavior.chance !== "number") continue;
        const owner = { kind: "npcBehavior" as const, entityKey: `npcs:${npcId}`, phaseIndex: phase.phaseIndex as number, behaviorIndex: behavior.behaviorIndex as number, chance: behavior.chance };
        if (movement.kind === "roaming" && typeof movement.roamDistance === "number" && typeof movement.roamAroundSpawner === "boolean" && typeof movement.usePOIs === "boolean") {
          const poiPathName = typeof movement.poiPathName === "string" && movement.poiPathName.length > 0 ? movement.poiPathName : undefined;
          movements.push({
            owner,
            kind: "roaming",
            distance: movement.roamDistance,
            aroundSpawner: movement.roamAroundSpawner,
            usePois: movement.usePOIs,
            ...(poiPathName ? { poiPathName, poiPath: resolvedPatrolPath(poiPathName, placement, paths, resolver, offset) } : {}),
            ...(typeof movement.poiRoamRadius === "number" ? { poiRoamRadius: movement.poiRoamRadius } : {}),
          });
        } else if (movement.kind === "patrol" && typeof movement.randomPath === "boolean") {
          const names = movement.randomPath
            ? (Array.isArray(movement.patrolPathNames) ? movement.patrolPathNames : []).filter((value): value is string => typeof value === "string" && value.length > 0)
            : typeof movement.patrolPathName === "string" && movement.patrolPathName.length > 0 ? [movement.patrolPathName] : [];
          if (names.length === 0) throw new Error(`NPC ${npcId} has a patrol behavior without a path name.`);
          movements.push({ owner, kind: "patrol", randomPath: movement.randomPath, paths: [...new Set(names)].map((name) => resolvedPatrolPath(name, placement, paths, resolver, offset)) });
        }
      }
    }
  }
  for (const source of sources.filter((candidate) => candidate.placementId === placement.placementId && candidate.family === "npcProducer")) {
    const patrol = record(record(source.data.overrides)?.patrol);
    const path = record(patrol?.path);
    if (patrol?.enabled !== true || !path || typeof path.name !== "string" || path.name.length === 0) continue;
    const rawPoints = Array.isArray(path.points) ? path.points : [];
    const points: Array<[number, number]> = [];
    for (const rawPoint of rawPoints) {
      const world = record(record(rawPoint)?.position);
      if (!world || typeof world.x !== "number" || typeof world.y !== "number" || typeof world.z !== "number") continue;
      const candidates = resolver.resolve(placement.sceneNativeId, placement.scenePath, { x: world.x, y: world.y, z: world.z }).candidates.filter((candidate) => candidate.mapSpaceId === placement.mapSpaceId);
      if (candidates.length === 1) points.push([candidates[0]!.mapPosition.x + offset.worldX, candidates[0]!.mapPosition.y + offset.worldY]);
    }
    const publicPath: PublicPatrolPath = points.length === rawPoints.length && points.length > 0
      ? { name: path.name, status: "resolved", looping: path.looping === true, groupPatrol: path.groupPatrol === true, groupSpacing: typeof path.groupSpacing === "number" ? path.groupSpacing : 0, poiRadius: typeof path.poiRadius === "number" ? path.poiRadius : 0, points }
      : { name: path.name, status: "unresolved", reason: "A spawner patrol path point does not resolve uniquely to the placement map." };
    movements.push({ owner: { kind: "spawnerOverride" }, kind: "patrol", randomPath: false, paths: [publicPath] });
  }
  return movements;
}

type TravelTarget = { sceneNativeId: number; position: { x: number; y: number; z: number } };
type TravelResolution = { target: { sceneNativeId: number; position: TravelTarget["position"] | null } | null; reason?: string };

function discriminator(value: unknown, expectedValue: number, expectedName: string): "match" | "contradictory" | "missing" {
  const candidate = record(value);
  if (!candidate || typeof candidate.value !== "number" || typeof candidate.name !== "string") return "missing";
  if (candidate.value === expectedValue && candidate.name === expectedName) return "match";
  if (candidate.value === expectedValue || candidate.name === expectedName) return "contradictory";
  return "missing";
}

function finitePosition(value: unknown): value is { x: number; y: number; z: number } {
  const candidate = record(value);
  return candidate !== null && typeof candidate.x === "number" && Number.isFinite(candidate.x) && typeof candidate.y === "number" && Number.isFinite(candidate.y) && typeof candidate.z === "number" && Number.isFinite(candidate.z);
}

function nestedTravelResolution(data: Record<string, unknown>, sourceSceneNativeId: number): TravelResolution {
  const actions = Array.isArray(data.actions) ? data.actions : null;
  if (!actions) return { target: null, reason: "Nested GameActions are unavailable." };
  const gameActionLists: unknown[] = [];
  for (const row of actions) {
    const action = record(row);
    if (!action) return { target: null, reason: "A nested action row is unavailable." };
    // A Teleport effect lands exactly at its authored teleportPOS: TeleportToGameScene stores it
    // as the scene entry's LastPosition for gameScene teleports, and position teleports move the
    // player within the scene.
    const effectTeleport = record(action.effectTeleport);
    if (effectTeleport) {
      const gameScene = discriminator(effectTeleport.type, 0, "gameScene");
      const position = discriminator(effectTeleport.type, 1, "position");
      if (gameScene === "contradictory" || position === "contradictory") return { target: null, reason: "A teleport effect type discriminator is contradictory." };
      if (!finitePosition(effectTeleport.position)) return { target: null, reason: "Teleport effect has no verified position." };
      if (position === "match") return { target: { sceneNativeId: sourceSceneNativeId, position: effectTeleport.position } };
      if (gameScene === "match") {
        const destination = record(effectTeleport.destinationScene);
        if (!destination || typeof destination.nativeId !== "number" || !Number.isInteger(destination.nativeId)) return { target: null, reason: "Teleport effect destination scene is unresolved." };
        return { target: { sceneNativeId: destination.nativeId, position: effectTeleport.position } };
      }
      return { target: null, reason: "Teleport effect has an unsupported destination type." };
    }
    const actionDiscriminator = discriminator(action.type, 9, "GameActions");
    if (actionDiscriminator === "contradictory") return { target: null, reason: "A GameActions discriminator is contradictory." };
    if (actionDiscriminator === "match") {
      const gameActions = record(action.gameActions);
      if (!gameActions) return { target: null, reason: "GameActions has no projected payload." };
      const template = record(gameActions.template);
      if (template) gameActionLists.push(template.actions);
      const inline = record(gameActions.inline);
      if (inline) gameActionLists.push(inline.actions);
    }
  }
  let sawTeleport = false;
  for (const listValue of gameActionLists) {
    if (!Array.isArray(listValue)) return { target: null, reason: "A nested GameActions list is unavailable." };
    for (const row of listValue) {
      const action = record(row);
      if (!action) return { target: null, reason: "A nested teleport row is unavailable." };
      // A nested Effect game action carries the same teleport projection as an interactable's
      // Effect action and lands at the effect's authored position.
      const nestedEffectTeleport = record(action.effectTeleport);
      if (nestedEffectTeleport) {
        sawTeleport = true;
        const gameScene = discriminator(nestedEffectTeleport.type, 0, "gameScene");
        const position = discriminator(nestedEffectTeleport.type, 1, "position");
        if (gameScene === "contradictory" || position === "contradictory") return { target: null, reason: "A teleport effect type discriminator is contradictory." };
        if (!finitePosition(nestedEffectTeleport.position)) return { target: null, reason: "Teleport effect has no verified position." };
        if (position === "match") return { target: { sceneNativeId: sourceSceneNativeId, position: nestedEffectTeleport.position } };
        if (gameScene === "match") {
          const destination = record(nestedEffectTeleport.destinationScene);
          if (!destination || typeof destination.nativeId !== "number" || !Number.isInteger(destination.nativeId)) return { target: null, reason: "Teleport effect destination scene is unresolved." };
          return { target: { sceneNativeId: destination.nativeId, position: nestedEffectTeleport.position } };
        }
        return { target: null, reason: "Teleport effect has an unsupported destination type." };
      }
      const actionDiscriminator = discriminator(action.type, 22, "Teleport");
      if (actionDiscriminator === "contradictory") return { target: null, reason: "A Teleport action discriminator is contradictory." };
      if (actionDiscriminator !== "match") continue;
      sawTeleport = true;
      if (action.unsupported === true) return { target: null, reason: "The Teleport action is marked unsupported." };
      const teleport = record(action.teleport);
      if (!teleport) return { target: null, reason: "Teleport has no projected payload." };
      const teleportType = discriminator(teleport.type, 1, "Position");
      const gameSceneType = discriminator(teleport.type, 0, "GameScene");
      const targetType = discriminator(teleport.type, 2, "Target");
      if (teleportType === "contradictory" || gameSceneType === "contradictory" || targetType === "contradictory") return { target: null, reason: "A teleport type discriminator is contradictory." };
      if (targetType === "match") return { target: null, reason: "Target teleport destination is unresolved." };
      if (teleportType === "match") {
        if (!finitePosition(teleport.position)) return { target: null, reason: "Position teleport has no verified position." };
        return { target: { sceneNativeId: sourceSceneNativeId, position: teleport.position } };
      }
      if (gameSceneType === "match") {
        if (typeof teleport.sceneNativeId !== "number" || !Number.isInteger(teleport.sceneNativeId) || teleport.sceneNativeId < 0) return { target: null, reason: "GameScene teleport has no verified destination scene." };
        // GameActionsManager.TriggerGameActions loads the scene by id and never reads the authored
        // position (build 25153357), so the arrival is the destination scene's own rule.
        return { target: { sceneNativeId: teleport.sceneNativeId, position: null } };
      }
      return { target: null, reason: "Teleport has an unsupported destination type." };
    }
  }
  return { target: null, reason: sawTeleport ? "No verified teleport destination exists." : "No nested Teleport action exists." };
}

function mapSourceEnabled(data: Record<string, unknown>): boolean {
  const source = record(data.source);
  return source?.enabled !== false;
}

function worldPointForTarget(
  target: TravelTarget,
  sourcePath: string,
  resolver: ReturnType<typeof compileMapSpaces>,
  sceneCatalog: SceneCatalog,
  offsets: ReadonlyMap<string, { worldX: number; worldY: number }>,
  imageryMapSpaces: ReadonlySet<string>,
): { mapSpaceId: string; position: [number, number] } | null {
  const scene = sceneCatalog.scenes.find((candidate) => candidate.nativeId === target.sceneNativeId && candidate.state === "matched");
  const scenePath = scene?.buildMatches[0]?.path ?? sourcePath;
  const resolution = resolver.resolve(target.sceneNativeId, scenePath, target.position);
  if (resolution.candidates.length !== 1) return null;
  const candidate = resolution.candidates[0]!;
  const offset = offsets.get(candidate.mapSpaceId);
  if (!offset || !imageryMapSpaces.has(candidate.mapSpaceId)) return null;
  return { mapSpaceId: candidate.mapSpaceId, position: [candidate.mapPosition.x + offset.worldX, candidate.mapPosition.y + offset.worldY] };
}

function travelForPlacement(
  placement: NormalizedPlacement,
  sources: readonly NormalizedMapProjection["sources"][number][],
  resolver: ReturnType<typeof compileMapSpaces>,
  sceneCatalog: SceneCatalog,
  offsets: ReadonlyMap<string, { worldX: number; worldY: number }>,
  imageryMapSpaces: ReadonlySet<string>,
  sceneSpawns: ReadonlyMap<number, { x: number; y: number; z: number }>,
): PublicTravel | undefined {
  // The transition role names the sources it was derived from (an InteractableObject whose
  // GameActions teleport); the source rows do not carry the role.
  const roleSourceIds = new Set(placement.roles.filter((role) => role.role === "transition").flatMap((role) => role.sourceIds));
  const candidates = sources.filter((source) => source.placementId === placement.placementId && roleSourceIds.has(source.sourceId));
  if (candidates.length === 0 && roleSourceIds.size === 0) return undefined;
  const source = candidates[0];
  if (!source) return { transitionId: placement.placementId, enabled: true, destination: { status: "unresolved", reason: "No normalized transition source is available." } };
  const data = source.data;
  const transitionId = typeof data.transitionId === "string" ? data.transitionId : source.sourceId;
  const resolution = Array.isArray(data.actions) ? nestedTravelResolution(data, placement.sceneNativeId) : { target: null, reason: "Transition destination is unresolved." };
  if (!resolution.target) return { transitionId, enabled: mapSourceEnabled(data), destination: { status: "unresolved", reason: resolution.reason ?? "Transition destination is unresolved." } };
  // A scene load lands the first entry at the scene's start position; later entries land where
  // the player last left the scene, so the start position is the one authored arrival point.
  const spawn = resolution.target.position === null ? sceneSpawns.get(resolution.target.sceneNativeId) : undefined;
  const target = resolution.target.position !== null
    ? { sceneNativeId: resolution.target.sceneNativeId, position: resolution.target.position }
    : spawn ? { sceneNativeId: resolution.target.sceneNativeId, position: spawn } : null;
  if (!target) return { transitionId, enabled: mapSourceEnabled(data), destination: { status: "unresolved", reason: "Destination scene has no start position record." } };
  const destination = worldPointForTarget(target, placement.scenePath, resolver, sceneCatalog, offsets, imageryMapSpaces);
  if (!destination) return { transitionId, enabled: mapSourceEnabled(data), destination: { status: "unresolved", reason: "Verified destination has no published map position." } };
  return { transitionId, enabled: mapSourceEnabled(data), destination: { status: "resolved", mapSpaceId: destination.mapSpaceId, position: destination.position } };
}

export async function preparePublication(planPath: string, outputRoot: string) {
  const absolutePlan = resolve(planPath), planDirectory = dirname(absolutePlan);
  const planBytes = await readFile(absolutePlan);
  const planValue: unknown = JSON.parse(planBytes.toString("utf8"));
  Assert(PublicationPlanSchema, planValue);
  const plan = planValue as PublicationPlan;
  const reviewedOffsets = await readWorldOffsets(resolve(planDirectory, plan.worldOffsets.path), plan.worldOffsets.sha256, plan.buildId);
  const load = (reference: PublicationPlan["normalized"], command: string) => loadVerifiedRun(resolve(planDirectory, reference.path), reference.sha256, plan.buildId, command);
  const normalized = await load(plan.normalized, "normalize");
  const map = await jsonArtifact<NormalizedMapProjection>(normalized, "projections/map-projections.json", "compendium.map-projections.v5");
  const entities = await jsonArtifact<NormalizedEntityDetails>(normalized, "projections/entity-details.json", "compendium.entity-details.v1");
  const items = await jsonArtifact<NormalizedItemSources>(normalized, "projections/item-sources.json", "compendium.item-sources.v1");
  const coverage = await jsonArtifact<NormalizedCoverageSummary>(normalized, "projections/coverage-summary.json", "compendium.normalized-coverage.v3");
  if (plan.mode === "release" && (!coverage.complete || coverage.blockers.length > 0)) throw new Error("Release publication requires complete source coverage without unresolved blockers.");
  if (!Array.isArray(items.conditions) || !Array.isArray(map.sources)) throw new Error("Normalized publication inputs omit condition records or world-source details.");
  const conditionsById = new Map(items.conditions.map((condition) => [condition.conditionId, condition]));
  const profileRecord = await normalized.readArtifact("inputs/map-space-profile.json");
  const profileValue: unknown = JSON.parse(new TextDecoder().decode(profileRecord.bytes));
  Assert(MapSpaceProfileSchema, profileValue);
  const profile = profileValue as MapSpaceProfile;
  const catalogRecord = await normalized.readArtifact("inputs/scene-catalog.json");
  const catalogValue: unknown = JSON.parse(new TextDecoder().decode(catalogRecord.bytes));
  Assert(SceneCatalogSchema, catalogValue);
  if (profile.buildId !== plan.buildId || (catalogValue as SceneCatalog).buildId !== plan.buildId) throw new Error("Publication calibration build mismatch.");
  const resolver = compileMapSpaces(profile, catalogValue as SceneCatalog);
  const assetBytes = new Map<string, Uint8Array>();
  let tileLayers: PublicTileLayer[] = [];
  let allImageryComplete = true;
  for (const reference of plan.pyramids) {
    const source = await load(reference, "tiles");
    const pyramid = await jsonArtifact<TilePyramid>(source, "tile-index.json", "compendium.tile-pyramid.v3");
    Assert(TilePyramidSchema, pyramid);
    if (pyramid.profile.sha256 !== profileRecord.reference.sha256) throw new Error("Publication pyramid uses different calibration.");
    const layer: PublicTileLayer = { id: pyramid.mapSpaceId, mapSpaceId: pyramid.mapSpaceId, label: "Captured screenshots", kind: "captured", tileSize: 256, minZoom: pyramid.minZoom, maxZoom: pyramid.maxZoom, extent: pyramid.extent, tiles: [] };
    let files = 0, bytes = 0;
    for (const level of pyramid.levels) for (const tile of level.tiles) {
      if (tile.coverage.state === "missing") throw new Error("A missing tile cannot have an image artifact.");
      const image = await source.readArtifact(tile.path);
      if (image.reference.sha256 !== tile.sha256 || image.reference.bytes !== tile.bytes) throw new Error("Publication tile index disagrees with its registered image.");
      const url = `imagery/${tile.sha256}.webp`;
      if (!assetBytes.has(url)) {
        const decoded = await sharp(image.bytes).metadata();
        if (decoded.width !== tile.width || decoded.height !== tile.height) throw new Error("Publication tile dimensions disagree with its decoded image.");
        assetBytes.set(url, image.bytes);
      }
      layer.tiles.push({ z: tile.z, x: tile.x, y: tile.y, width: tile.width, height: tile.height, url, sha256: tile.sha256, bytes: tile.bytes, state: tile.coverage.state });
      files++; bytes += tile.bytes;
    }
    if (files !== pyramid.totals.files || bytes !== pyramid.totals.bytes) throw new Error("Publication pyramid file or byte totals are inconsistent.");
    allImageryComplete &&= pyramid.coverage.complete && !pyramid.coverage.blocker;
    tileLayers.push(layer);
  }
  // Game maps: the texture the game draws for a zone, registered by the zone's own conversion and
  // resampled onto the lattice. Clipped to the map's reviewed box, which is the map's frame whether
  // or not a captured pyramid exists for it.
  const reviewedBox = (mapSpaceId: string): { min: { x: number; y: number }; max: { x: number; y: number } } | null => {
    const boxes = profile.bindings.filter((binding) => binding.mapSpaceId === mapSpaceId).flatMap((binding) => binding.domain.kind === "boxes" ? binding.domain.boxes : []);
    if (boxes.length === 0) return null;
    return { min: { x: Math.min(...boxes.map((box) => box.min.x)), y: Math.min(...boxes.map((box) => box.min.z)) }, max: { x: Math.max(...boxes.map((box) => box.max.x)), y: Math.max(...boxes.map((box) => box.max.z)) } };
  };
  for (const reference of plan.illustrations) {
    const source = await load(reference, "illustration");
    const value = await jsonArtifact<IllustrationOutput>(source, "illustration.json", "compendium.illustration.v1");
    Assert(IllustrationOutputSchema, value);
    if (value.mapSpaceProfile.sha256 !== profileRecord.reference.sha256) throw new Error("Publication illustration uses different calibration.");
    const image = await source.readArtifact(value.image.path);
    if (image.reference.sha256 !== value.image.sha256 || image.reference.bytes !== value.image.bytes) throw new Error("Publication illustration image reference mismatch.");
    if (value.image.width !== (await sharp(image.bytes, { limitInputPixels: false }).metadata()).width) throw new Error("Publication illustration dimensions mismatch.");
    const captured = tileLayers.find((candidate) => candidate.mapSpaceId === value.mapSpaceId && candidate.kind === "captured");
    const box = reviewedBox(value.mapSpaceId);
    const bounds = captured
      ? { min: { x: Math.min(captured.extent[0], box?.min.x ?? captured.extent[0]), y: Math.min(captured.extent[1], box?.min.y ?? captured.extent[1]) }, max: { x: Math.max(captured.extent[2], box?.max.x ?? captured.extent[2]), y: Math.max(captured.extent[3], box?.max.y ?? captured.extent[3]) } }
      : box;
    if (!bounds) throw new Error(`Illustration "${value.layerId}" has neither a captured pyramid nor a reviewed box to frame it.`);
    const layer = await tileIllustration(value.layerId, value.mapSpaceId, image.bytes, value.image, value.registration.mapFromPixelEdge, bounds, captured?.minZoom ?? Number.NEGATIVE_INFINITY, assetBytes);
    tileLayers.push({ ...layer, label: "Game map", kind: "game-map" });
  }
  const localTileLayers = tileLayers;
  const tileBounds = (layer: PublicTileLayer): { min: { x: number; y: number }; max: { x: number; y: number } } => ({
    min: { x: layer.extent[0], y: layer.extent[1] },
    max: { x: layer.extent[2], y: layer.extent[3] },
  });
  const bindingsPerMap = new Map<string, number>();
  for (const binding of profile.bindings) bindingsPerMap.set(binding.mapSpaceId, (bindingsPerMap.get(binding.mapSpaceId) ?? 0) + 1);
  const layout = buildWorldLayout(
    profile.mapSpaces.map((space) => {
      const layers = localTileLayers.filter((candidate) => candidate.mapSpaceId === space.id);
      if (layers.length === 0) return { mapSpaceId: space.id, bounds: null };
      const bounds = layers.map(tileBounds).reduce((union, next) => ({ min: { x: Math.min(union.min.x, next.min.x), y: Math.min(union.min.y, next.min.y) }, max: { x: Math.max(union.max.x, next.max.x), y: Math.max(union.max.y, next.max.y) } }));
      return { mapSpaceId: space.id, bounds, coarsestTileSize: Math.max(...layers.map((layer) => layer.tileSize / 2 ** layer.minZoom)) };
    }),
    reviewedOffsets,
    new Set([...bindingsPerMap].filter(([, count]) => count > 1).map(([mapSpaceId]) => mapSpaceId)),
  );
  const offsetByMap = new Map(layout.offsets.map((offset) => [offset.mapSpaceId, offset]));
  // Pyramids publish in their map's local coordinates; the atlas translates each one by its
  // world offset when drawing, so an offset needs no alignment to the tile lattice.
  tileLayers = localTileLayers;
  const imageryMapSpaces = new Set(tileLayers.map((layer) => layer.mapSpaceId));
  const categoriesByPlacement = new Map(map.placements.map((placement) => [placement.placementId, placementCategories(placement)]));
  const levelRangesByPlacement = new Map(map.placements.map((placement) => [placement.placementId, placementLevelRange(placement, entities.entities, map.sources)]));
  const eligible = map.placements.filter((placement) => (categoriesByPlacement.get(placement.placementId) ?? []).length > 0);
  // A placement publishes when it resolves to a map, whether or not that map's imagery reaches
  // it: a game's map art can be smaller than its level (the Sanctum's entrance hall), and a
  // marker on bare ground is still a true location. Placements outside every reviewed domain
  // remain excluded by normalization.
  const selected = foldMapIcons(eligible.filter((placement) => placement.mapPosition !== null && placement.mapSpaceId !== null && offsetByMap.has(placement.mapSpaceId) && imageryMapSpaces.has(placement.mapSpaceId)));
  const selectedIds = new Set(selected.map(placement => placement.placementId));
  const filterIds = (ids: readonly string[]) => ids.filter(id => selectedIds.has(id));
  const names = new Map(entities.entities.map(entity => [entity.entityKey, plainText(entity.name ?? "") || "Unnamed entry"]));
  const publicEntities: PublicEntity[] = entities.entities.map(entity => ({ entityKey: entity.entityKey, kind: entity.kind, nativeId: entity.nativeId, name: names.get(entity.entityKey)!, description: entity.description === null ? null : plainText(entity.description), placementIds: filterIds(entity.placementIds), sections: sectionsFor(entity, names) }));
  const detailsByPlacement = new Map<string, PublicEntity[]>();
  for (const entity of publicEntities) for (const id of entity.placementIds) {
    const rows = detailsByPlacement.get(id) ?? []; rows.push(entity); detailsByPlacement.set(id, rows);
  }
  const sourceNamesByPlacement = new Map<string, string>();
  const referenceName = (value: unknown): unknown => value && typeof value === "object" && "name" in value ? value.name : null;
  for (const source of map.sources) {
    if (!selectedIds.has(source.placementId)) continue;
    const name = [source.data.interactableName, source.data.chestName, referenceName(source.data.station), referenceName(source.data.property)].find((value) => typeof value === "string" && value.trim());
    if (typeof name === "string") sourceNamesByPlacement.set(source.placementId, plainText(name));
  }
  const localPlacements: Array<{ source: NormalizedPlacement; value: Omit<PublicPlacement, "itemKeys" | "searchText" | "movement"> & { sections: PublicDetailSection[] } }> = selected.map(placement => {
    const resolution = resolver.resolve(placement.sceneNativeId, placement.scenePath, placement.worldPosition);
    const candidates = resolution.candidates.filter(candidate => candidate.mapSpaceId === placement.mapSpaceId);
    if (candidates.length !== 1 || Math.hypot(candidates[0]!.mapPosition.x - placement.mapPosition!.x, candidates[0]!.mapPosition.y - placement.mapPosition!.y) > 1e-6) throw new Error(`Publication placement contradicts reviewed spatial membership: ${placement.placementId}`);
    const linked = detailsByPlacement.get(placement.placementId) ?? [];
    const categories = categoriesByPlacement.get(placement.placementId) ?? [];
    if (!categories.length) throw new Error(`Publication placement has no game category: ${placement.placementId}`);
    const range = levelRangesByPlacement.get(placement.placementId);
    const localAreas = spatialAreas(placement, resolver);
    const authoredLabel = (placement as NormalizedPlacement & { label?: string | null }).label;
    const labelFromPlacement = typeof authoredLabel === "string" && authoredLabel.trim().length > 0 ? authoredLabel.trim() : null;
    return {
      source: placement,
      value: { placementId: placement.placementId, mapSpaceId: placement.mapSpaceId!, position: [placement.mapPosition!.x, placement.mapPosition!.y], height: placement.worldPosition.y, label: labelFromPlacement || linked.filter(entity => entity.kind === "npcs").map(entity => entity.name).join(" / ") || sourceNamesByPlacement.get(placement.placementId) || categories.map(category => categoryLabels[category]).join(" / "), categories, ...(range ? { levelRange: range } : {}), entityKeys: linked.map(entity => entity.entityKey), areas: localAreas, sections: linked.flatMap(entity => entity.sections) },
    };
  });
  const sceneSpawns = new Map(map.sceneSpawns.map((spawn) => [spawn.sceneNativeId, spawn.position]));
  const offsetPlacements = localPlacements.map(({ source, value }) => {
    const offset = offsetByMap.get(value.mapSpaceId);
    if (!offset) throw new Error(`World layout has no offset for map space: ${value.mapSpaceId}`);
    const travel = travelForPlacement(source, map.sources, resolver, catalogValue as SceneCatalog, offsetByMap, imageryMapSpaces, sceneSpawns);
    return {
      ...value,
      position: [value.position[0] + offset.worldX, value.position[1] + offset.worldY],
      areas: value.areas.map((polygon: Array<[number, number]>) => polygon.map(([x, y]: [number, number]) => [x + offset.worldX, y + offset.worldY] as [number, number])),
      movement: movementForPlacement(source, entities.entities, map.sources, map.patrolPaths, resolver, offset),
      ...(travel ? { travel } : {}),
    };
  });
  const normalizedRegions: readonly NormalizedRegionForPublication[] = map.regions;
  const allRegions: PublicRegion[] = normalizedRegions
    .map((region) => {
      if (!region.mapSpaceId) return null;
      const offset = offsetByMap.get(region.mapSpaceId);
      if (!offset) return null;
      return publicRegionFromNormalized(region, offset);
    })
    .filter((region): region is PublicRegion => region !== null)
    .sort((left, right) => left.id.localeCompare(right.id));
  // Regions repeat once per scene that authors them, as the map icons do; one polygon per
  // name and shape on one map is published.
  const regions = foldRegions(allRegions);
  const itemSources: PublicItemSource[] = items.items.map(item => {
    const rawSources = item.sources.map(source => {
      const ownerKeys = source.context.ownerEntityKeys;
      if (ownerKeys !== undefined && (!Array.isArray(ownerKeys) || ownerKeys.some(key => typeof key !== "string" || !names.has(key)))) throw new Error("Item source references an unknown owner.");
      const owners = (ownerKeys as string[] | undefined)?.map(key => names.get(key)!) ?? [];
      const sourceLabel = typeof source.context.sourceLabel === "string" && plainText(source.context.sourceLabel)
        ? plainText(source.context.sourceLabel)
        : [sourceKindLabel(source.sourceKind), owners.join(" / ")].filter(Boolean).join(" — ");
      const rows: PublicDetailRow[] = [];
      if (source.sourceKind === "merchant" && typeof source.context.cost === "number") {
        const currency = typeof source.context.currencyId === "number" ? names.get(`currencies:${source.context.currencyId}`) : undefined;
        rows.push({ label: "Price", value: `${source.context.cost}${currency ? ` ${currency}` : ""}` });
      }
      if ((source.sourceKind === "npc-loot" || source.sourceKind === "world-loot" || source.sourceKind === "container") && (typeof source.context.min === "number" || typeof source.context.max === "number")) {
        const minimum = typeof source.context.min === "number" ? source.context.min : source.context.max;
        const maximum = typeof source.context.max === "number" ? source.context.max : source.context.min;
        rows.push({ label: "Quantity", value: minimum === maximum ? String(minimum) : `${minimum}–${maximum}` });
      }
      if (source.sourceKind === "resource" && typeof source.context.rank === "number") rows.push({ label: "Gathering rank", value: String(source.context.rank) });
      const sections: PublicDetailSection[] = rows.length ? [{ title: `${sourceKindLabel(source.sourceKind)} details`, rows }] : [];
      for (const conditionId of source.conditionIds) {
        const condition = conditionsById.get(conditionId);
        if (!condition) throw new Error(`Item source references missing condition ${conditionId}.`);
        const conditionRows = scalarRows(condition.payload);
        if (conditionRows.length) sections.push({ title: "Requirements", rows: conditionRows });
      }
      return { label: sourceLabel, kind: sourceKindLabel(source.sourceKind), placementIds: filterIds(source.placementIds), sections };
    });
    const sharedByTitle = new Map<string, PublicDetailSection>();
    for (const source of rawSources) for (const section of source.sections.filter((candidate) => candidate.title === "Requirements")) {
      const shared = sharedByTitle.get(section.title) ?? { title: section.title, rows: [] };
      const existing = new Set(shared.rows.map((row) => JSON.stringify(row)));
      for (const row of section.rows) if (!existing.has(JSON.stringify(row))) { shared.rows.push(row); existing.add(JSON.stringify(row)); }
      sharedByTitle.set(section.title, shared);
    }
    const sections = [...sharedByTitle.values()];
    const sources = rawSources.map((source) => ({ ...source, sections: source.sections.filter((section) => section.title !== "Requirements") }));
    return { itemKey: item.itemKey, sections, sources };
  });
  const placementsById = new Map(offsetPlacements.map((value) => [value.placementId, value]));
  const outputSectionsByPlacement = new Map<string, Map<string, PublicDetailSection>>();
  for (const item of itemSources) for (const source of item.sources) for (const id of source.placementIds) {
    let sections = outputSectionsByPlacement.get(id);
    if (!sections) { sections = new Map(); outputSectionsByPlacement.set(id, sections); }
    let section = sections.get(source.kind);
    if (!section) {
      section = { title: `${label(source.kind)} outputs`, rows: [] };
      sections.set(source.kind, section);
      placementsById.get(id)!.sections.push(section);
    }
    section.rows.push({ label: names.get(item.itemKey) ?? item.itemKey, value: source.label, entityKey: item.itemKey });
  }
  const detailPath = (kind: "entities" | "items", index: number): string => `details/${kind}-${String(index).padStart(4, "0")}.json`;
  const entityIndex: PublicEntitySummary[] = publicEntities.map((entity, index) => ({
    entityKey: entity.entityKey, kind: entity.kind, nativeId: entity.nativeId, name: entity.name,
    description: entity.description, detailPath: detailPath("entities", index),
  }));
  const itemIndex: PublicItemSummary[] = itemSources.map((item, index) => ({
    itemKey: item.itemKey, name: names.get(item.itemKey) ?? item.itemKey,
    sourceNames: [...new Set(item.sources.map((source) => source.label))].sort(),
    sourceKinds: [...new Set(item.sources.map((source) => source.kind))].sort(),
    detailPath: detailPath("items", index),
  }));
  const itemKeysByPlacement = new Map<string, Set<string>>();
  for (const item of itemSources) for (const source of item.sources) for (const placementId of source.placementIds) {
    const keys = itemKeysByPlacement.get(placementId) ?? new Set<string>();
    keys.add(item.itemKey);
    itemKeysByPlacement.set(placementId, keys);
  }
  const unfoldedPlacements: PublicPlacement[] = offsetPlacements.map((value) => {
    const { sections, ...placement } = value;
    const itemKeys = [...(itemKeysByPlacement.get(placement.placementId) ?? [])].sort();
    // Spreading widens the fixed-length position to number[], so it is restated as the pair
    // the published contract declares.
    const [positionX, positionY] = placement.position;
    if (positionX === undefined || positionY === undefined) throw new Error(`Placement ${placement.placementId} has no map position.`);
    const position: [number, number] = [positionX, positionY];
    return { ...placement, position, itemKeys, searchText: [placement.label, ...placement.categories.map((category) => categoryLabels[category])].join(" ") };
  });
  const foldedDungeonTravel = foldTravelPlacements(unfoldedPlacements);
  const placements = foldedDungeonTravel.placements;
  const replacePlacementIds = (ids: readonly string[]): string[] => [...new Set(ids.map((id) => {
    let replacement = id;
    for (;;) {
      const next = foldedDungeonTravel.replacementIds.get(replacement);
      if (next === undefined) return replacement;
      replacement = next;
    }
  }))];
  for (const entity of publicEntities) entity.placementIds = replacePlacementIds(entity.placementIds);
  for (const item of itemSources) for (const source of item.sources) source.placementIds = replacePlacementIds(source.placementIds);
  const sceneRanges = new Map(entities.entities.filter((entity) => entity.kind === "scenes").map((entity) => [entity.nativeId, sceneLevelRange(entity)]));
  const mapLevelRanges = new Map(map.mapSpaces.map((space) => [space.mapSpaceId, consistentLevelRange(map.placements.filter((placement) => placement.mapSpaceId === space.mapSpaceId).map((placement) => sceneRanges.get(placement.sceneNativeId)))]));
  const publicMaps: PublicationData["maps"] = map.mapSpaces.filter(space => tileLayers.some(layer => layer.mapSpaceId === space.mapSpaceId)).map(space => {
    const points: Array<[number, number]> = [];
    for (const layer of tileLayers.filter(layer => layer.mapSpaceId === space.mapSpaceId)) {
      const offset = offsetByMap.get(layer.mapSpaceId)!;
      points.push([layer.extent[0] + offset.worldX, layer.extent[1] + offset.worldY], [layer.extent[2] + offset.worldX, layer.extent[3] + offset.worldY]);
    }
    for (const placement of placements.filter(placement => placement.mapSpaceId === space.mapSpaceId)) points.push(placement.position, ...placement.areas.flat());
    for (const region of regions.filter((candidate) => candidate.mapSpaceId === space.mapSpaceId)) points.push(...region.polygon);
    const range = mapLevelRanges.get(space.mapSpaceId);
    return { mapSpaceId: space.mapSpaceId, label: space.label, ...(range ? { levelRange: range } : {}), bounds: { min: { x: Math.min(...points.map(point => point[0])), y: Math.min(...points.map(point => point[1])) }, max: { x: Math.max(...points.map(point => point[0])), y: Math.max(...points.map(point => point[1])) } } };
  });
  const worldPoints = publicMaps.flatMap((map) => [[map.bounds.min.x, map.bounds.min.y], [map.bounds.max.x, map.bounds.max.y]] as Array<[number, number]>);
  if (worldPoints.length === 0) throw new Error("Publication has no renderable world map bounds.");
  const worldBounds = { min: { x: Math.min(...worldPoints.map((point) => point[0])), y: Math.min(...worldPoints.map((point) => point[1])) }, max: { x: Math.max(...worldPoints.map((point) => point[0])), y: Math.max(...worldPoints.map((point) => point[1])) } };
  // A reviewer's domain box decides that a placement is not part of any map. Those decisions are
  // reported with their reasons and evidence; they are not omitted coverage.
  const deliberateExclusions = coverage.exclusions.filter((exclusion) => map.placements.some((placement) => placement.placementId === exclusion.key));
  const excludedPlacements = map.placements.length - placements.length - deliberateExclusions.length;
  const exclusionReport = { schemaVersion: "compendium.publication-exclusions.v1", buildId: plan.buildId, exclusions: deliberateExclusions };
  const guide = projectAdventureGuide({ entities: entities.entities, placements: selected, sources: map.sources, publishedPlacementIds: selectedIds });
  const guideSlug = (key: string): string => key.replaceAll(/[^A-Za-z0-9]+/g, "-");
  const guideItemKeys = new Set(guide.bosses.flatMap((boss) => boss.loot.map((loot) => loot.itemKey)));
  const guideEntities = publicEntities.filter((entity) => guideItemKeys.has(entity.entityKey));
  const dungeonSummaries = guide.dungeons.map(({ dungeonKey, label, description, levelRange, placementIds, bosses }) => ({ dungeonKey, label, ...(description ? { description } : {}), ...(levelRange ? { levelRange } : {}), placementIds, bosses: bosses.map(({ bossKey, label, level, levelRange, placementIds, dungeonKeys, loot }) => ({ bossKey, label, ...(level === undefined ? {} : { level }), ...(levelRange ? { levelRange } : {}), placementIds, ...(dungeonKeys ? { dungeonKeys } : {}), lootCount: loot.length })) }));
  const bossSummaries = guide.bosses.map(({ bossKey, label, level, levelRange, placementIds, dungeonKeys, loot }) => ({ bossKey, label, ...(level === undefined ? {} : { level }), ...(levelRange ? { levelRange } : {}), placementIds, ...(dungeonKeys ? { dungeonKeys } : {}), lootCount: loot.length }));
  const guideCounts = { dungeons: guide.dungeons.length, bosses: guide.bosses.length, regions: guide.regions.length, properties: guide.properties.length };
  const guideDocuments: Record<string, unknown> = {
    overview: { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: dungeonSummaries, bosses: bossSummaries, regions: guide.regions, properties: guide.properties }, entities: [] },
    dungeons: { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: dungeonSummaries, bosses: [], regions: [], properties: [] }, entities: [] },
    bosses: { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: dungeonSummaries, bosses: bossSummaries, regions: [], properties: [] }, entities: [] },
    regions: { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: [], bosses: [], regions: guide.regions, properties: [] }, entities: [] },
    properties: { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: [], bosses: [], regions: [], properties: guide.properties }, entities: [] },
  };
  for (const dungeon of guide.dungeons) {
    const itemKeys = new Set(dungeon.bosses.flatMap((boss) => boss.loot.map((loot) => loot.itemKey)));
    guideDocuments[`dungeon-${guideSlug(dungeon.dungeonKey)}`] = { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: [dungeon], bosses: [], regions: [], properties: [] }, entities: publicEntities.filter((entity) => itemKeys.has(entity.entityKey)) };
  }
  for (const boss of guide.bosses) {
    const dungeonKeys = new Set(boss.dungeonKeys ?? []);
    guideDocuments[`boss-${guideSlug(boss.bossKey)}`] = { schemaVersion: "compendium.adventure-guide.v1", buildId: plan.buildId, counts: guideCounts, guide: { dungeons: dungeonSummaries.filter((dungeon) => dungeonKeys.has(dungeon.dungeonKey)), bosses: [boss], regions: [], properties: [] }, entities: publicEntities.filter((entity) => boss.loot.some((loot) => loot.itemKey === entity.entityKey)) };
  }
  const complete = Boolean(coverage.complete) && allImageryComplete && coverage.blockers.length === 0 && excludedPlacements === 0 && layout.unplacedMapSpaceIds.length === 0;
  const coverageMessages = plan.mode === "preview" ? ["Incomplete research preview. It does not represent full-world extraction or imagery coverage."] : [];
  if (layout.unplacedMapSpaceIds.length > 0) coverageMessages.push(`Unplaced map spaces: ${layout.unplacedMapSpaceIds.join(", ")}.`);
  const data: PublicationData = { schemaVersion: PUBLICATION_SCHEMA_VERSION, buildId: plan.buildId, mode: plan.mode, coverage: { complete: plan.mode === "release" && complete, excludedPlacements, messages: coverageMessages }, world: { mapSpaceId: "world", label: "Afallon", bounds: worldBounds, offsets: layout.offsets, unplacedMapSpaceIds: layout.unplacedMapSpaceIds }, maps: publicMaps, placements, regions, entityIndex, itemIndex, tileLayers };
  validatePublication(data);
  const entityDocuments: Array<[string, unknown]> = [];
  for (const [index, entity] of publicEntities.entries()) {
    const document = { schemaVersion: "compendium.publication-entity-details.v1", buildId: plan.buildId, entities: [entity] };
    validateEntityDetails(document, data);
    entityDocuments.push([detailPath("entities", index), document]);
  }
  const itemDocuments: Array<[string, unknown]> = [];
  for (const [index, item] of itemSources.entries()) {
    const document = { schemaVersion: "compendium.publication-item-sources.v1", buildId: plan.buildId, itemSources: [item] };
    validateItemSources(document, data);
    itemDocuments.push([detailPath("items", index), document]);
  }
  const inputHashes: Record<string, string> = { plan: createHash("sha256").update(planBytes).digest("hex"), normalized: plan.normalized.sha256, worldOffsets: plan.worldOffsets.sha256 };
  for (const [index, reference] of plan.pyramids.entries()) inputHashes[`pyramid:${index}`] = reference.sha256;
  for (const [index, reference] of plan.illustrations.entries()) inputHashes[`illustration:${index}`] = reference.sha256;
  for (const file of ["publication.ts", "public-contracts.ts", "publication-validation.ts", "../tools/runs.ts", "../tools/cli.ts", "../package.json", "../bun.lock"]) inputHashes[`tool:${file}`] = createHash("sha256").update(await readFile(resolve(import.meta.dir, file))).digest("hex");
  const run = await beginRun(outputRoot, { buildId: plan.buildId, command: "publication", toolRevision: await toolRevision(), settings: { mode: plan.mode }, inputHashes });
  try {
    await mkdir(resolve(run.directory, "public/imagery"), { recursive: true });
    await mkdir(resolve(run.directory, "public/details"), { recursive: true });
    await Bun.write(resolve(run.directory, "plan.json"), planBytes); await run.addArtifact("plan.json");
    await Bun.write(resolve(run.directory, "exclusions.json"), `${JSON.stringify(exclusionReport, null, 2)}\n`); await run.addArtifact("exclusions.json");
    for (const [url, bytes] of assetBytes) { await Bun.write(resolve(run.directory, "public", url), bytes); await run.addArtifact(`public/${url}`); }
    await Bun.write(resolve(run.directory, "public/publication.json"), `${JSON.stringify(data)}\n`); await run.addArtifact("public/publication.json");
    for (const [relativePath, document] of [...entityDocuments, ...itemDocuments]) {
      await Bun.write(resolve(run.directory, "public", relativePath), `${JSON.stringify(document)}\n`);
      await run.addArtifact(`public/${relativePath}`);
    }
    for (const [section, document] of Object.entries(guideDocuments)) {
      Assert(GuideDocumentSchema, document);
      const relativePath = `public/guide-${section}.json`;
      await Bun.write(resolve(run.directory, relativePath), `${JSON.stringify(document)}\n`);
      await run.addArtifact(relativePath);
    }
    await run.succeed();
    return { manifest: run.manifestPath, publicDirectory: resolve(run.directory, "public"), mode: plan.mode, buildId: plan.buildId, placements: placements.length, entities: publicEntities.length, imageFiles: assetBytes.size, imageBytes: [...assetBytes.values()].reduce((total, bytes) => total + bytes.byteLength, 0), coverage: data.coverage };
  } catch (error) { await run.fail(error); throw error; }
}
