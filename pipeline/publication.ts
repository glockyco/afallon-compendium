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
import type { EntityDetail, NormalizedEntityDetails, NormalizedItemSources, NormalizedMapProjection, NormalizedCoverageSummary, NormalizedPlacement } from "./normalized-contracts";
import { PUBLIC_MARKER_CATEGORY_VALUES, type PublicAffine, type PublicDetailSection, type PublicDetailRow, type PublicEntity, type PublicIllustration, type PublicItemSource, type PublicLevelRange, type PublicMarkerCategory, type PublicPlacement, type PublicTileLayer, type PublicTravel, type PublicationData } from "./public-contracts";
import { WorldOffsetsSchema, type WorldOffsets, buildWorldLayout } from "./world-layout";
import { affinePoint, inversePoint, validatePublication } from "./publication-validation";

const reference = Type.Object({ path: Type.String({ minLength: 1 }), sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }) }, { additionalProperties: false });
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

const categoryLabels: Record<PublicMarkerCategory, string> = {
  enemy: "Enemy",
  boss: "Boss",
  neutral: "Neutral",
  ally: "Ally",
  npc: "NPC",
  merchant: "Merchant",
  questGiver: "Quest Giver",
  interactiveObject: "Interactive Object",
  craftingStation: "Crafting Station",
  resource: "Resource",
  container: "Container",
  travelPoint: "Travel Point",
};
const roleCategory: Readonly<Record<string, PublicMarkerCategory | null>> = {
  enemy: "enemy",
  boss: "boss",
  elite: "enemy",
  neutral: "neutral",
  friendly: "ally",
  npc: "npc",
  merchant: "merchant",
  questGiver: "questGiver",
  resourceProducer: "resource",
  container: "container",
  transition: "travelPoint",
  respawnDestination: "travelPoint",
  usefulInteraction: "interactiveObject",
  questLocation: "interactiveObject",
  craftingService: "craftingStation",
  propertyPurchaseService: "interactiveObject",
  combatant: null,
  dialogue: "npc",
  inspect: "npc",
  trade: "npc",
  adventurerProducer: null,
  adventurerPopulationManager: null,
};

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
function placementCategories(placement: NormalizedPlacement): PublicMarkerCategory[] {
  const categories = new Set<PublicMarkerCategory>();
  for (const role of placement.roles) {
    const category = roleCategory[role.role];
    if (category) categories.add(category);
  }
  return PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => categories.has(category));
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
  const add = (title: string, rows: PublicDetailRow[]) => { if (rows.length) sections.push({ title, rows }); };
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

type TravelTarget = { sceneNativeId: number; position: { x: number; y: number; z: number } };
type TravelResolution = { target: TravelTarget | null; reason?: string };

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
        if (!finitePosition(teleport.position)) return { target: null, reason: "GameScene teleport has no verified arrival position." };
        return { target: { sceneNativeId: teleport.sceneNativeId, position: teleport.position } };
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
): PublicTravel | undefined {
  const candidates = sources.filter((source) => source.placementId === placement.placementId && (source.data.role === "transition" || source.data.transitionKind !== undefined || (Array.isArray(source.data.roles) && source.data.roles.includes("transition"))));
  if (candidates.length === 0 && !placement.roles.some((role) => role.role === "transition" || role.role === "respawnDestination")) return undefined;
  const source = candidates[0];
  if (!source) return { transitionId: placement.placementId, enabled: true, destination: { status: "unresolved", reason: "No normalized transition source is available." } };
  const data = source.data;
  const transitionId = typeof data.transitionId === "string" ? data.transitionId : source.sourceId;
  let resolution: TravelResolution;
  const destinationScene = record(data.destinationScene);
  if (destinationScene && data.destinationResolved === true && typeof destinationScene.nativeId === "number" && Number.isInteger(destinationScene.nativeId)) {
    resolution = { target: null, reason: "Destination scene is known, but its verified arrival position is not published." };
  } else if (Array.isArray(data.actions)) {
    resolution = nestedTravelResolution(data, placement.sceneNativeId);
  } else {
    resolution = { target: null, reason: "Transition destination is unresolved." };
  }
  if (!resolution.target) return { transitionId, enabled: mapSourceEnabled(data), destination: { status: "unresolved", reason: resolution.reason ?? "Transition destination is unresolved." } };
  const destination = worldPointForTarget(resolution.target, placement.scenePath, resolver, sceneCatalog, offsets, imageryMapSpaces);
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
  const map = await jsonArtifact<NormalizedMapProjection>(normalized, "projections/map-projections.json", "compendium.map-projections.v2");
  const entities = await jsonArtifact<NormalizedEntityDetails>(normalized, "projections/entity-details.json", "compendium.entity-details.v1");
  const items = await jsonArtifact<NormalizedItemSources>(normalized, "projections/item-sources.json", "compendium.item-sources.v1");
  const coverage = await jsonArtifact<NormalizedCoverageSummary>(normalized, "projections/coverage-summary.json", "compendium.normalized-coverage.v2");
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
  const alphaMasks = new Map<string, { bytes: Uint8Array; width: number; height: number }>();
  let tileLayers: PublicTileLayer[] = [];
  let allImageryComplete = true;
  for (const reference of plan.pyramids) {
    const source = await load(reference, "tiles");
    const pyramid = await jsonArtifact<TilePyramid>(source, "tile-index.json", "compendium.tile-pyramid.v2");
    Assert(TilePyramidSchema, pyramid);
    if (pyramid.profile.sha256 !== profileRecord.reference.sha256) throw new Error("Publication pyramid uses different calibration.");
    const finest = pyramid.levels.find(level => level.z === pyramid.finestLevel);
    if (!finest) throw new Error("Publication pyramid has no finest level.");
    const layer: PublicTileLayer = { id: pyramid.mapSpaceId, mapSpaceId: pyramid.mapSpaceId, tileSize: pyramid.tileSize, finestLevel: pyramid.finestLevel, width: finest.width, height: finest.height, mapFromPixelEdge: pyramid.mapFromPixelEdge, tiles: [] };
    let files = 0, bytes = 0;
    for (const level of pyramid.levels) for (const tile of level.tiles) {
      if (tile.coverage.state === "missing") throw new Error("A missing tile cannot have an image artifact.");
      const image = await source.readArtifact(tile.path);
      if (image.reference.sha256 !== tile.sha256 || image.reference.bytes !== tile.bytes) throw new Error("Publication tile index disagrees with its registered image.");
      const url = `imagery/${tile.sha256}.webp`;
      if (!assetBytes.has(url)) {
        const decoded = await sharp(image.bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        if (decoded.info.width !== tile.width || decoded.info.height !== tile.height || decoded.info.channels !== 4) throw new Error("Publication tile dimensions disagree with its decoded image.");
        assetBytes.set(url, image.bytes);
        alphaMasks.set(url, { bytes: decoded.data, width: tile.width, height: tile.height });
      } else {
        const decoded = alphaMasks.get(url)!;
        if (decoded.width !== tile.width || decoded.height !== tile.height) throw new Error("One tile image has contradictory dimensions.");
      }
      layer.tiles.push({ z: tile.z, x: tile.x, y: tile.y, width: tile.width, height: tile.height, url, sha256: tile.sha256, bytes: tile.bytes, mapFromPixelEdge: tile.mapFromPixelEdge, state: tile.coverage.state });
      files++; bytes += tile.bytes;
    }
    if (files !== pyramid.totals.files || bytes !== pyramid.totals.bytes) throw new Error("Publication pyramid file or byte totals are inconsistent.");
    allImageryComplete &&= pyramid.coverage.complete && !pyramid.coverage.blocker;
    tileLayers.push(layer);
  }
  const localTileLayers = tileLayers;
  const tileBounds = (layer: PublicTileLayer): { min: { x: number; y: number }; max: { x: number; y: number } } => {
    const corners = [[0, 0], [layer.width, 0], [0, layer.height], [layer.width, layer.height]] as const;
    const points = corners.map(([x, y]) => affinePoint(layer.mapFromPixelEdge, x, y));
    return { min: { x: Math.min(...points.map(point => point[0])), y: Math.min(...points.map(point => point[1])) }, max: { x: Math.max(...points.map(point => point[0])), y: Math.max(...points.map(point => point[1])) } };
  };
  const bindingsPerMap = new Map<string, number>();
  for (const binding of profile.bindings) bindingsPerMap.set(binding.mapSpaceId, (bindingsPerMap.get(binding.mapSpaceId) ?? 0) + 1);
  const layout = buildWorldLayout(
    profile.mapSpaces.map((space) => ({ mapSpaceId: space.id, bounds: localTileLayers.find((layer) => layer.mapSpaceId === space.id) ? tileBounds(localTileLayers.find((layer) => layer.mapSpaceId === space.id)!) : null })),
    reviewedOffsets,
    new Set([...bindingsPerMap].filter(([, count]) => count > 1).map(([mapSpaceId]) => mapSpaceId)),
  );
  const offsetByMap = new Map(layout.offsets.map((offset) => [offset.mapSpaceId, offset]));
  tileLayers = localTileLayers.map((layer) => {
    const offset = offsetByMap.get(layer.mapSpaceId);
    if (!offset) throw new Error(`World layout has no offset for map space: ${layer.mapSpaceId}`);
    const translate = (affine: PublicAffine): PublicAffine => ({ ...affine, origin: { x: affine.origin.x + offset.worldX, y: affine.origin.y + offset.worldY } });
    return { ...layer, mapFromPixelEdge: translate(layer.mapFromPixelEdge), tiles: layer.tiles.map((tile) => ({ ...tile, mapFromPixelEdge: translate(tile.mapFromPixelEdge) })) };
  });
  const covered = (placement: NormalizedPlacement): boolean => {
    if (!placement.mapPosition || !placement.mapSpaceId) return false;
    const layer = localTileLayers.find(layer => layer.mapSpaceId === placement.mapSpaceId);
    if (!layer) return false;
    return layer.tiles.some(tile => {
      if (tile.z !== layer.finestLevel || tile.state === "empty") return false;
      const [x, y] = inversePoint(tile.mapFromPixelEdge, [placement.mapPosition!.x, placement.mapPosition!.y]);
      if (x < 0 || y < 0 || x >= tile.width || y >= tile.height) return false;
      const mask = alphaMasks.get(tile.url)!;
      return mask.bytes[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3]! > 0;
    });
  };
  const categoriesByPlacement = new Map(map.placements.map((placement) => [placement.placementId, placementCategories(placement)]));
  const levelRangesByPlacement = new Map(map.placements.map((placement) => [placement.placementId, placementLevelRange(placement, entities.entities, map.sources)]));
  const eligible = map.placements.filter((placement) => (categoriesByPlacement.get(placement.placementId) ?? []).length > 0);
  const selected = eligible.filter(covered);
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
  const localPlacements: Array<{ source: NormalizedPlacement; value: PublicPlacement }> = selected.map(placement => {
    const resolution = resolver.resolve(placement.sceneNativeId, placement.scenePath, placement.worldPosition);
    const candidates = resolution.candidates.filter(candidate => candidate.mapSpaceId === placement.mapSpaceId);
    if (candidates.length !== 1 || Math.hypot(candidates[0]!.mapPosition.x - placement.mapPosition!.x, candidates[0]!.mapPosition.y - placement.mapPosition!.y) > 1e-6) throw new Error(`Publication placement contradicts reviewed spatial membership: ${placement.placementId}`);
    const linked = detailsByPlacement.get(placement.placementId) ?? [];
    const categories = categoriesByPlacement.get(placement.placementId) ?? [];
    if (!categories.length) throw new Error(`Publication placement has no game category: ${placement.placementId}`);
    const range = levelRangesByPlacement.get(placement.placementId);
    const localAreas = spatialAreas(placement, resolver);
    return {
      source: placement,
      value: { placementId: placement.placementId, mapSpaceId: placement.mapSpaceId!, position: [placement.mapPosition!.x, placement.mapPosition!.y], label: linked.filter(entity => entity.kind === "npcs").map(entity => entity.name).join(" / ") || sourceNamesByPlacement.get(placement.placementId) || categories.map(category => categoryLabels[category]).join(" / "), categories, ...(range ? { levelRange: range } : {}), entityKeys: linked.map(entity => entity.entityKey), areas: localAreas, sections: linked.flatMap(entity => entity.sections) },
    };
  });
  const imageryMapSpaces = new Set(tileLayers.map((layer) => layer.mapSpaceId));
  const placements: PublicPlacement[] = localPlacements.map(({ source, value }) => {
    const offset = offsetByMap.get(value.mapSpaceId);
    if (!offset) throw new Error(`World layout has no offset for map space: ${value.mapSpaceId}`);
    const travel = travelForPlacement(source, map.sources, resolver, catalogValue as SceneCatalog, offsetByMap, imageryMapSpaces);
    return {
      ...value,
      position: [value.position[0] + offset.worldX, value.position[1] + offset.worldY],
      areas: value.areas.map((polygon: Array<[number, number]>) => polygon.map(([x, y]: [number, number]) => [x + offset.worldX, y + offset.worldY] as [number, number])),
      ...(travel ? { travel } : {}),
    };
  });
  const itemSources: PublicationData["itemSources"] = items.items.map(item => ({ itemKey: item.itemKey, sources: item.sources.map(source => {
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
  }) }));
  const placementsById = new Map(placements.map(placement => [placement.placementId, placement]));
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
  const sceneRanges = new Map(entities.entities.filter((entity) => entity.kind === "scenes").map((entity) => [entity.nativeId, sceneLevelRange(entity)]));
  const mapLevelRanges = new Map(map.mapSpaces.map((space) => [space.mapSpaceId, consistentLevelRange(map.placements.filter((placement) => placement.mapSpaceId === space.mapSpaceId).map((placement) => sceneRanges.get(placement.sceneNativeId)))]));
  const publicMaps: PublicationData["maps"] = map.mapSpaces.filter(space => tileLayers.some(layer => layer.mapSpaceId === space.mapSpaceId)).map(space => {
    const points: Array<[number, number]> = [];
    for (const layer of tileLayers.filter(layer => layer.mapSpaceId === space.mapSpaceId)) for (const [x, y] of [[0, 0], [layer.width, 0], [0, layer.height], [layer.width, layer.height]] as const) points.push(affinePoint(layer.mapFromPixelEdge, x, y));
    for (const placement of placements.filter(placement => placement.mapSpaceId === space.mapSpaceId)) points.push(...placement.areas.flat());
    const range = mapLevelRanges.get(space.mapSpaceId);
    return { mapSpaceId: space.mapSpaceId, label: space.label, ...(range ? { levelRange: range } : {}), bounds: { min: { x: Math.min(...points.map(point => point[0])), y: Math.min(...points.map(point => point[1])) }, max: { x: Math.max(...points.map(point => point[0])), y: Math.max(...points.map(point => point[1])) } } };
  });
  const worldPoints = publicMaps.flatMap((map) => [[map.bounds.min.x, map.bounds.min.y], [map.bounds.max.x, map.bounds.max.y]] as Array<[number, number]>);
  if (worldPoints.length === 0) throw new Error("Publication has no renderable world map bounds.");
  const worldBounds = { min: { x: Math.min(...worldPoints.map((point) => point[0])), y: Math.min(...worldPoints.map((point) => point[1])) }, max: { x: Math.max(...worldPoints.map((point) => point[0])), y: Math.max(...worldPoints.map((point) => point[1])) } };
  const illustrations: PublicIllustration[] = [];
  for (const reference of plan.illustrations) {
    const source = await load(reference, "illustration");
    const value = await jsonArtifact<IllustrationOutput>(source, "illustration.json", "compendium.illustration.v1");
    Assert(IllustrationOutputSchema, value);
    if (value.mapSpaceProfile.sha256 !== profileRecord.reference.sha256) throw new Error("Publication illustration uses different calibration.");
    const image = await source.readArtifact(value.image.path);
    if (image.reference.sha256 !== value.image.sha256 || image.reference.bytes !== value.image.bytes) throw new Error("Publication illustration image reference mismatch.");
    const converted = await sharp(image.bytes).webp({ lossless: true }).toBuffer({ resolveWithObject: true });
    if (converted.info.width !== value.image.width || converted.info.height !== value.image.height) throw new Error("Publication illustration dimensions mismatch.");
    const hash = createHash("sha256").update(converted.data).digest("hex"), url = `imagery/${hash}.webp`;
    assetBytes.set(url, converted.data);
    illustrations.push({ id: value.layerId, label: label(value.layerId), mapSpaceId: value.mapSpaceId, registration: value.registration.kind, url, width: value.image.width, height: value.image.height, mapFromPixelEdge: value.registration.kind === "calibrated" ? value.registration.mapFromPixelEdge : null });
  }
  const excludedPlacements = map.placements.length - placements.length;
  const complete = Boolean(coverage.complete) && allImageryComplete && coverage.blockers.length === 0 && excludedPlacements === 0 && layout.unplacedMapSpaceIds.length === 0;
  const coverageMessages = plan.mode === "preview" ? ["Incomplete research preview. It does not represent full-world extraction or imagery coverage."] : [];
  if (layout.unplacedMapSpaceIds.length > 0) coverageMessages.push(`Unplaced map spaces: ${layout.unplacedMapSpaceIds.join(", ")}.`);
  const data: PublicationData = { schemaVersion: "compendium.publication.v4", buildId: plan.buildId, mode: plan.mode, coverage: { complete: plan.mode === "release" && complete, excludedPlacements, messages: coverageMessages }, world: { mapSpaceId: "world", label: "Afallon", bounds: worldBounds, offsets: layout.offsets, unplacedMapSpaceIds: layout.unplacedMapSpaceIds }, maps: publicMaps, placements, entities: publicEntities, itemSources, tileLayers, illustrations };
  validatePublication(data);
  const inputHashes: Record<string, string> = { plan: createHash("sha256").update(planBytes).digest("hex"), normalized: plan.normalized.sha256, worldOffsets: plan.worldOffsets.sha256 };
  for (const [index, reference] of plan.pyramids.entries()) inputHashes[`pyramid:${index}`] = reference.sha256;
  for (const [index, reference] of plan.illustrations.entries()) inputHashes[`illustration:${index}`] = reference.sha256;
  for (const file of ["publication.ts", "public-contracts.ts", "publication-validation.ts", "../tools/runs.ts", "../tools/cli.ts", "../package.json", "../bun.lock"]) inputHashes[`tool:${file}`] = createHash("sha256").update(await readFile(resolve(import.meta.dir, file))).digest("hex");
  const run = await beginRun(outputRoot, { buildId: plan.buildId, command: "publication", toolRevision: await toolRevision(), settings: { mode: plan.mode }, inputHashes });
  try {
    await mkdir(resolve(run.directory, "public/imagery"), { recursive: true });
    await Bun.write(resolve(run.directory, "plan.json"), planBytes); await run.addArtifact("plan.json");
    for (const [url, bytes] of assetBytes) { await Bun.write(resolve(run.directory, "public", url), bytes); await run.addArtifact(`public/${url}`); }
    await Bun.write(resolve(run.directory, "public/publication.json"), `${JSON.stringify(data)}\n`); await run.addArtifact("public/publication.json");
    await run.succeed();
    return { manifest: run.manifestPath, publicDirectory: resolve(run.directory, "public"), mode: plan.mode, buildId: plan.buildId, placements: placements.length, entities: publicEntities.length, imageFiles: assetBytes.size, imageBytes: [...assetBytes.values()].reduce((total, bytes) => total + bytes.byteLength, 0), coverage: data.coverage };
  } catch (error) { await run.fail(error); throw error; }
}
