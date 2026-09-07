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
import type { PublicationData, PublicDetailSection, PublicDetailRow, PublicEntity, PublicPlacement, PublicTileLayer, PublicIllustration } from "./public-contracts";
import { affinePoint, inversePoint, validatePublication } from "./publication-validation";

const reference = Type.Object({ path: Type.String({ minLength: 1 }), sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }) }, { additionalProperties: false });
export const PublicationPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-plan.v1"),
  buildId: Type.String({ minLength: 1 }),
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  normalized: reference,
  pyramids: Type.Array(reference, { minItems: 1 }),
  illustrations: Type.Array(reference),
}, { additionalProperties: false });
export type PublicationPlan = Static<typeof PublicationPlanSchema>;

async function jsonArtifact<T extends { schemaVersion: string; buildId: string }>(run: VerifiedRun, path: string, schemaVersion: T["schemaVersion"]): Promise<T> {
  const { bytes } = await run.readArtifact(path);
  const value = JSON.parse(new TextDecoder().decode(bytes)) as T;
  if (value.schemaVersion !== schemaVersion || value.buildId !== run.manifest.input.buildId) throw new Error(`Publication input schema or build mismatch: ${path}`);
  return value;
}

function label(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
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
  const itemRow = (id: number | null, value: string): PublicDetailRow => {
    const key = `items:${id}`;
    if (id === null || !names.has(key)) throw new Error(`Publication relationship references missing item ${id}.`);
    return { label: names.get(key)!, value, entityKey: key };
  };
  const relationships = entity.relationships;
  add("Vendor stock", relationships.merchantStock.map(row => itemRow(row.itemId, `${row.cost ?? "Unknown cost"} ${row.currencyId === null ? "(currency unknown)" : names.get(`currencies:${row.currencyId}`) ?? `currency ${row.currencyId}`} · stock group ${row.merchantTableId}`)));
  add("Loot entries — raw authored rates, not effective chances", relationships.lootEntries.map(row => itemRow(row.itemId, `Quantity ${row.min ?? "?"}–${row.max ?? "?"}; raw rate ${row.rawRate ?? "unknown"}; table ${row.lootTableId}`)));
  add("Gathering outputs", relationships.resourceYields.map(row => itemRow(row.itemId, `Rank ${row.rank ?? "unknown"}; quantity ${row.min ?? "?"}–${row.max ?? "?"}`)));
  add("Quest associations", relationships.questAssociations.map(row => {
    const key = `quests:${row.questId}`;
    return { label: label(row.associationKind), value: row.questId === null ? "Quest unresolved" : names.get(key) ?? `Quest ${row.questId}`, ...(names.has(key) ? { entityKey: key } : {}) };
  }));
  for (const association of relationships.questAssociations) add(`Quest mechanics — ${label(association.associationKind)}`, scalarRows(association.context));
  for (const condition of relationships.conditions) add(`Authored condition — ${label(condition.semantics)}`, scalarRows(condition.payload));
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

export async function preparePublication(planPath: string, outputRoot: string) {
  const absolutePlan = resolve(planPath), planDirectory = dirname(absolutePlan);
  const planBytes = await readFile(absolutePlan);
  const planValue: unknown = JSON.parse(planBytes.toString("utf8"));
  Assert(PublicationPlanSchema, planValue);
  const plan = planValue as PublicationPlan;
  const load = (reference: PublicationPlan["normalized"], command: string) => loadVerifiedRun(resolve(planDirectory, reference.path), reference.sha256, plan.buildId, command);
  const normalized = await load(plan.normalized, "normalize");
  const map = await jsonArtifact<NormalizedMapProjection>(normalized, "projections/map-projections.json", "compendium.map-projections.v1");
  const entities = await jsonArtifact<NormalizedEntityDetails>(normalized, "projections/entity-details.json", "compendium.entity-details.v1");
  const items = await jsonArtifact<NormalizedItemSources>(normalized, "projections/item-sources.json", "compendium.item-sources.v1");
  const coverage = await jsonArtifact<NormalizedCoverageSummary>(normalized, "projections/coverage-summary.json", "compendium.normalized-coverage.v1");
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
  const tileLayers: PublicTileLayer[] = [];
  let allImageryComplete = true;
  for (const reference of plan.pyramids) {
    const source = await load(reference, "tiles");
    const pyramid = await jsonArtifact<TilePyramid>(source, "tile-index.json", "compendium.tile-pyramid.v1");
    Assert(TilePyramidSchema, pyramid);
    if (pyramid.profile.sha256 !== profileRecord.reference.sha256) throw new Error("Publication pyramid uses different calibration.");
    const finest = pyramid.levels.find(level => level.z === pyramid.finestLevel);
    if (!finest) throw new Error("Publication pyramid has no finest level.");
    const layer: PublicTileLayer = { id: `${pyramid.mapSpaceId}-${pyramid.floorId ?? "outdoor"}`, mapSpaceId: pyramid.mapSpaceId, floorId: pyramid.floorId, tileSize: pyramid.tileSize, finestLevel: pyramid.finestLevel, width: finest.width, height: finest.height, mapFromPixelEdge: pyramid.mapFromPixelEdge, tiles: [] };
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
  const covered = (placement: NormalizedPlacement): boolean => {
    if (!placement.mapPosition || !placement.mapSpaceId || !["resolved", "not-applicable"].includes(placement.floorState)) return false;
    const layer = tileLayers.find(layer => layer.mapSpaceId === placement.mapSpaceId && layer.floorId === placement.floorId);
    if (!layer) return false;
    return layer.tiles.some(tile => {
      if (tile.z !== layer.finestLevel || tile.state === "empty") return false;
      const [x, y] = inversePoint(tile.mapFromPixelEdge, [placement.mapPosition!.x, placement.mapPosition!.y]);
      if (x < 0 || y < 0 || x >= tile.width || y >= tile.height) return false;
      const mask = alphaMasks.get(tile.url)!;
      return mask.bytes[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3]! > 0;
    });
  };
  const eligible = map.placements.filter(placement => placement.roles.length > 0);
  const selected = eligible.filter(covered);
  const selectedIds = new Set(selected.map(placement => placement.placementId));
  const filterIds = (ids: readonly string[]) => ids.filter(id => selectedIds.has(id));
  const names = new Map(entities.entities.map(entity => [entity.entityKey, plainText(entity.name ?? "") || plainText(entity.internalName ?? "") || `${entity.kind} ${entity.nativeId}`]));
  const publicEntities: PublicEntity[] = entities.entities.map(entity => ({ entityKey: entity.entityKey, kind: entity.kind, nativeId: entity.nativeId, name: names.get(entity.entityKey)!, description: entity.description === null ? null : plainText(entity.description), placementIds: filterIds(entity.placementIds), sections: sectionsFor(entity, names) }));
  const detailsByPlacement = new Map<string, PublicEntity[]>();
  for (const entity of publicEntities) for (const id of entity.placementIds) {
    const rows = detailsByPlacement.get(id) ?? []; rows.push(entity); detailsByPlacement.set(id, rows);
  }
  const sourceDetailsByPlacement = new Map<string, PublicDetailSection[]>();
  const sourceNamesByPlacement = new Map<string, string>();
  const referenceName = (value: unknown): unknown => value && typeof value === "object" && "name" in value ? value.name : null;
  for (const source of map.sources) {
    if (!selectedIds.has(source.placementId)) continue;
    const { state, ...authored } = source.data;
    const rows = scalarRows(authored);
    const sections = sourceDetailsByPlacement.get(source.placementId) ?? [];
    if (rows.length) sections.push({ title: `Source configuration — ${label(source.family)}`, rows });
    sourceDetailsByPlacement.set(source.placementId, sections);
    const name = [source.data.interactableName, source.data.chestName, referenceName(source.data.station), referenceName(source.data.property)].find((value) => typeof value === "string" && value.trim());
    if (typeof name === "string") sourceNamesByPlacement.set(source.placementId, plainText(name));
  }
  const placements: PublicPlacement[] = selected.map(placement => {
    const resolution = resolver.resolve(placement.sceneNativeId, placement.scenePath, placement.worldPosition);
    const candidates = resolution.candidates.filter(candidate => candidate.mapSpaceId === placement.mapSpaceId && candidate.floorState === placement.floorState && (placement.floorId === null ? candidate.floorIds.length === 0 : candidate.floorIds.length === 1 && candidate.floorIds[0] === placement.floorId));
    if (candidates.length !== 1 || Math.hypot(candidates[0]!.mapPosition.x - placement.mapPosition!.x, candidates[0]!.mapPosition.y - placement.mapPosition!.y) > 1e-6) throw new Error(`Publication placement contradicts reviewed spatial membership: ${placement.placementId}`);
    const linked = detailsByPlacement.get(placement.placementId) ?? [];
    const roles = [...new Set(placement.roles.map(role => role.role))];
    if (!roles.length) throw new Error(`Publication placement has no classified role: ${placement.placementId}`);
    return { placementId: placement.placementId, mapSpaceId: placement.mapSpaceId!, floorId: placement.floorId, position: [placement.mapPosition!.x, placement.mapPosition!.y], label: linked.filter(entity => entity.kind === "npcs").map(entity => entity.name).join(" / ") || sourceNamesByPlacement.get(placement.placementId) || roles.map(label).join(" / "), roles, entityKeys: linked.map(entity => entity.entityKey), areas: spatialAreas(placement, resolver), sections: [...linked.flatMap(entity => entity.sections), ...(sourceDetailsByPlacement.get(placement.placementId) ?? [])] };
  });
  const itemSources: PublicationData["itemSources"] = items.items.map(item => ({ itemKey: item.itemKey, sources: item.sources.map(source => {
    const ownerKeys = source.context.ownerEntityKeys;
    if (ownerKeys !== undefined && (!Array.isArray(ownerKeys) || ownerKeys.some(key => typeof key !== "string" || !names.has(key)))) throw new Error("Item source references an unknown owner.");
    const owners = (ownerKeys as string[] | undefined)?.map(key => names.get(key)!) ?? [];
    const sourceLabel = typeof source.context.sourceLabel === "string" ? plainText(source.context.sourceLabel) : [label(source.sourceKind), owners.join(" / ")].filter(Boolean).join(" — ");
    const rows = scalarRows(source.context);
    if (source.sourceKind === "merchant") rows.unshift({ label: "Price", value: `${source.context.cost ?? "Unknown cost"} ${typeof source.context.currencyId === "number" ? names.get(`currencies:${source.context.currencyId}`) ?? `currency ${source.context.currencyId}` : "(currency unknown)"} (authored base cost)` });
    if (source.placementIds.length === 0) rows.push({ label: "Locations", value: "No precise source placements are established in this extraction." });
    else if (source.placementIds.some(id => !selectedIds.has(id))) rows.push({ label: "Map coverage", value: "Some known source locations are outside this preview." });
    if (source.sourceKind !== "merchant" && source.sourceKind !== "quest") rows.push({ label: "Effective chance", value: "Not established; authored rates and eligibility rules are not effective probabilities." });
    const sections: PublicDetailSection[] = [{ title: "Source details", rows }];
    for (const conditionId of source.conditionIds) {
      const condition = conditionsById.get(conditionId);
      if (!condition) throw new Error(`Item source references missing condition ${conditionId}.`);
      const conditionRows = scalarRows(condition.payload);
      if (conditionRows.length) sections.push({ title: `Authored condition — ${label(condition.semantics)}`, rows: conditionRows });
    }
    return { label: sourceLabel, kind: source.sourceKind, placementIds: filterIds(source.placementIds), sections };
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
  const publicMaps: PublicationData["maps"] = map.mapSpaces.filter(space => tileLayers.some(layer => layer.mapSpaceId === space.mapSpaceId)).map(space => {
    const points: Array<[number, number]> = [];
    for (const layer of tileLayers.filter(layer => layer.mapSpaceId === space.mapSpaceId)) for (const [x, y] of [[0, 0], [layer.width, 0], [0, layer.height], [layer.width, layer.height]] as const) points.push(affinePoint(layer.mapFromPixelEdge, x, y));
    for (const placement of placements.filter(placement => placement.mapSpaceId === space.mapSpaceId)) points.push(...placement.areas.flat());
    return { mapSpaceId: space.mapSpaceId, label: space.label, floors: space.floors.filter(floor => tileLayers.some(layer => layer.mapSpaceId === space.mapSpaceId && layer.floorId === floor.floorId)), bounds: { min: { x: Math.min(...points.map(point => point[0])), y: Math.min(...points.map(point => point[1])) }, max: { x: Math.max(...points.map(point => point[0])), y: Math.max(...points.map(point => point[1])) } } };
  });
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
    illustrations.push({ id: value.layerId, label: label(value.layerId), mapSpaceId: value.mapSpaceId, floorId: value.floorId, registration: value.registration.kind, url, width: value.image.width, height: value.image.height, mapFromPixelEdge: value.registration.kind === "calibrated" ? value.registration.mapFromPixelEdge : null });
  }
  const placementsWithoutRoles = map.placements.length - eligible.length;
  const excludedPlacements = eligible.length - placements.length;
  const complete = Boolean(coverage.complete) && allImageryComplete && coverage.blockers.length === 0 && excludedPlacements === 0;
  const data: PublicationData = { schemaVersion: "compendium.publication.v1", buildId: plan.buildId, mode: plan.mode, coverage: { complete: plan.mode === "release" && complete, excludedPlacements, messages: plan.mode === "preview" ? ["Incomplete research preview. It does not represent full-world extraction or imagery coverage.", `${excludedPlacements} classified placements are outside the included verified imagery.`, `${placementsWithoutRoles} source identities have no classified map role and are not shown as markers.`, `${coverage.blockers.length} coverage issues remain in the source run.`] : [] }, maps: publicMaps, placements, entities: publicEntities, itemSources, tileLayers, illustrations };
  validatePublication(data);
  const inputHashes: Record<string, string> = { plan: createHash("sha256").update(planBytes).digest("hex"), normalized: plan.normalized.sha256 };
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
