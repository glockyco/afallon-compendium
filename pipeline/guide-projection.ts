import type { EntityDetail,
NormalizedMapProjection,
NormalizedPlacement, } from "@afallon/contracts/catalog"
import type { PublicAdventureGuide,
PublicGuideAbilityPhase,
PublicGuideBoss,
PublicGuideDungeon,
PublicGuideLoot,
PublicGuideProperty,
PublicGuideRegion,
PublicGuideStat,
PublicLevelRange, } from "@afallon/contracts/public"

export interface GuideProjectionInput {
  entities: readonly EntityDetail[];
  placements: readonly NormalizedPlacement[];
  sources?: readonly NormalizedMapProjection["sources"][number][];
  publishedPlacementIds?: ReadonlySet<string>;
}

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function integer(value: unknown, minimum = 0): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result.length > 0 && result.toLowerCase() !== "null" && result.toLowerCase() !== "undefined" ? result : undefined;
}

function entityDisplayName(entity: EntityDetail): string | undefined {
  const direct = text(entity.name);
  if (direct) return direct;
  const localization = record(entity.publicData.localization);
  return text(localization?.displayName) ?? text(localization?.entryDisplayName);
}

function guideRange(gameplay: unknown): PublicLevelRange | undefined {
  const value = record(gameplay);
  if (!value) return undefined;
  const minimum = integer(value.dungeonLevelMin, 1);
  const maximum = integer(value.dungeonLevelMax, 1);
  if (minimum === null || maximum === null || maximum < minimum) return undefined;
  return { min: minimum, max: maximum };
}

function regionRange(gameplay: unknown): PublicLevelRange | undefined {
  const value = record(gameplay);
  if (!value) return undefined;
  const minimum = integer(value.levelRangeMin, 1);
  const maximum = integer(value.levelRangeMax, 1);
  if (minimum === null || maximum === null || maximum < minimum) return undefined;
  return { min: minimum, max: maximum };
}

function publishedIds(input: GuideProjectionInput): ReadonlySet<string> {
  return input.publishedPlacementIds ?? new Set(input.placements.map((placement) => placement.placementId));
}

function locationIds(ids: readonly string[], available: ReadonlySet<string>): string[] {
  return ids.filter((id, index) => available.has(id) && ids.indexOf(id) === index);
}

function sourceReferenceId(source: NormalizedMapProjection["sources"][number], kind: "region" | "property"): number | null {
  const data = source.data;
  const directKeys = kind === "property" ? ["propertyID", "propertyId"] : ["regionID", "regionId"];
  for (const key of directKeys) {
    const id = integer(data[key]);
    if (id !== null) return id;
  }
  const nested = record(data[kind]);
  return nested ? integer(nested.nativeId) : null;
}

function relatedSourceLocations(
  entity: EntityDetail,
  kind: "region" | "property",
  sources: readonly NormalizedMapProjection["sources"][number][],
  available: ReadonlySet<string>,
): string[] {
  const nativeIds = new Set<string>(entity.placementIds);
  for (const source of sources) {
    if (sourceReferenceId(source, kind) === entity.nativeId && available.has(source.placementId)) nativeIds.add(source.placementId);
  }
  return [...nativeIds].filter((id) => available.has(id));
}

function bossLevel(gameplay: unknown): Pick<PublicGuideBoss, "level" | "levelRange"> {
  const value = record(gameplay);
  if (!value) return {};
  const minimum = integer(value.minLevel, 1);
  const maximum = integer(value.maxLevel, 1);
  if (minimum === null || maximum === null || maximum < minimum) return {};
  return minimum === maximum ? { level: minimum } : { levelRange: { min: minimum, max: maximum } };
}

function guidePhases(gameplay: unknown): PublicGuideAbilityPhase[] | undefined {
  const value = record(gameplay);
  if (!value || !Array.isArray(value.aiPhases)) return undefined;
  const phases: PublicGuideAbilityPhase[] = [];
  for (const raw of value.aiPhases) {
    const phase = record(raw);
    if (!phase) continue;
    const phaseIndex = integer(phase.phaseIndex);
    const name = text(phase.name);
    if (phaseIndex === null || name === undefined || !Array.isArray(phase.abilityIds)) continue;
    const abilityIds = phase.abilityIds.flatMap((id) => {
      const value = integer(id);
      return value === null ? [] : [value];
    });
    const requirement = text(phase.requirement);
    phases.push({ phaseIndex, label: name, ...(requirement ? { requirement } : {}), abilityIds: [...new Set(abilityIds)] });
  }
  return phases.length > 0 ? phases : undefined;
}

function guideStats(gameplay: unknown, statLabels: ReadonlyMap<number, { label: string; isPercent?: boolean }>): PublicGuideStat[] | undefined {
  const value = record(gameplay);
  if (!value || !Array.isArray(value.guideStats)) return undefined;
  const stats: PublicGuideStat[] = [];
  for (const raw of value.guideStats) {
    const stat = record(raw);
    if (!stat) continue;
    const statId = integer(stat.statId);
    const statValue = number(stat.value);
    const statLabel = statId === null ? undefined : statLabels.get(statId);
    if (statId !== null && statValue !== null && statLabel) stats.push({ statId, label: statLabel.label, value: statValue, ...(statLabel.isPercent === undefined ? {} : { isPercent: statLabel.isPercent }) });
  }
  return stats.length > 0 ? stats : undefined;
}

function displayedChance(value: unknown): number | undefined {
  const rate = number(value);
  if (rate === null || rate < 0 || rate > 100) return undefined;
  return Math.round((rate + Number.EPSILON) * 10) / 10;
}

function guideLoot(entity: EntityDetail, items: ReadonlyMap<string, EntityDetail>): PublicGuideLoot[] {
  const entries = new Map<string, PublicGuideLoot>();
  for (const row of entity.relationships.lootEntries) {
    if (row.itemId === null || row.lootTableId === null || row.entryIndex === null) continue;
    const itemKey = `items:${row.itemId}`;
    const item = items.get(itemKey);
    if (!item) continue;
    const minimum = row.min !== null && Number.isSafeInteger(row.min) && row.min >= 0 ? row.min : null;
    const maximum = row.max !== null && Number.isSafeInteger(row.max) && row.max >= 0 ? row.max : null;
    if (minimum === null && maximum === null) continue;
    if (minimum !== null && maximum !== null && maximum < minimum) continue;
    const key = `${row.lootTableId}:${row.entryIndex}:${itemKey}`;
    if (entries.has(key)) continue;
    const chance = displayedChance(row.rawRate);
    const name = entityDisplayName(item);
    entries.set(key, {
      itemKey,
      ...(name ? { label: name } : {}),
      ...(minimum === null ? {} : { minimum }),
      ...(maximum === null ? {} : { maximum }),
      ...(chance === undefined ? {} : { chance }),
    });
  }
  return [...entries.values()];
}

function guideBoss(entity: EntityDetail, available: ReadonlySet<string>, items: ReadonlyMap<string, EntityDetail>, statLabels: ReadonlyMap<number, { label: string; isPercent?: boolean }>, dungeonKeys: readonly string[]): PublicGuideBoss | null {
  const name = entityDisplayName(entity);
  if (!name) return null;
  const abilities = guidePhases(entity.publicData.gameplay);
  const stats = guideStats(entity.publicData.gameplay, statLabels);
  return {
    bossKey: entity.entityKey,
    label: name,
    ...bossLevel(entity.publicData.gameplay),
    placementIds: locationIds(entity.placementIds, available),
    ...(abilities ? { abilities } : {}),
    ...(stats ? { stats } : {}),
    loot: guideLoot(entity, items),
    ...(dungeonKeys.length > 0 ? { dungeonKeys: [...dungeonKeys] } : {}),
  };
}

function guideDungeon(
  entity: EntityDetail,
  allEntities: readonly EntityDetail[],
  placements: readonly NormalizedPlacement[],
  available: ReadonlySet<string>,
  items: ReadonlyMap<string, EntityDetail>,
  statLabels: ReadonlyMap<number, { label: string; isPercent?: boolean }>,
): PublicGuideDungeon | null {
  const gameplay = record(entity.publicData.gameplay);
  const name = entityDisplayName(entity);
  if (gameplay?.includedInAdventureGuide !== true || !name) return null;
  const dungeonKey = entity.entityKey;
  const bossKeys: string[] = [];
  const bosses: PublicGuideBoss[] = [];
  for (const raw of Array.isArray(gameplay.adventureGuideBosses) ? gameplay.adventureGuideBosses : []) {
    const row = record(raw);
    const npcId = integer(row?.npcId, 0);
    if (npcId === null) continue;
    const boss = allEntities.find((candidate) => candidate.kind === "npcs" && candidate.nativeId === npcId);
    if (!boss || bossKeys.includes(boss.entityKey)) continue;
    const projectedBoss = guideBoss(boss, available, items, statLabels, [dungeonKey]);
    if (!projectedBoss) continue;
    bossKeys.push(boss.entityKey);
    bosses.push(projectedBoss);
  }
  const description = text(record(entity.publicData.localization)?.adventureGuideDescription);
  const scenePlacementIds = placements.filter((placement) => placement.sceneNativeId === entity.nativeId && available.has(placement.placementId)).map((placement) => placement.placementId);
  return {
    dungeonKey,
    label: name,
    ...(description ? { description } : {}),
    ...(guideRange(entity.publicData.gameplay) ? { levelRange: guideRange(entity.publicData.gameplay) } : {}),
    placementIds: locationIds(scenePlacementIds, available),
    bosses,
  };
}

function guideRegion(entity: EntityDetail, sources: readonly NormalizedMapProjection["sources"][number][], available: ReadonlySet<string>): PublicGuideRegion | null {
  const gameplay = record(entity.publicData.gameplay);
  const name = entityDisplayName(entity);
  if (gameplay?.includedInAdventureGuide !== true || !name) return null;
  const description = text(gameplay.adventureGuideDescription);
  const level = regionRange(gameplay);
  return {
    regionKey: entity.entityKey,
    label: name,
    ...(description ? { description } : {}),
    ...(level ? { levelRange: level } : {}),
    placementIds: relatedSourceLocations(entity, "region", sources, available),
  };
}

function guideProperty(entity: EntityDetail, sources: readonly NormalizedMapProjection["sources"][number][], available: ReadonlySet<string>): PublicGuideProperty | null {
  const name = entityDisplayName(entity);
  if (!name) return null;
  const gameplay = record(entity.publicData.gameplay);
  if (!gameplay) return null;
  const description = text(gameplay.adventureGuideDescription);
  const income = number(gameplay.income);
  return {
    propertyKey: entity.entityKey,
    label: name,
    ...(description ? { description } : {}),
    ...(income === null ? {} : { income }),
    placementIds: relatedSourceLocations(entity, "property", sources, available),
  };
}

export function projectAdventureGuide(input: GuideProjectionInput): PublicAdventureGuide {
  const available = publishedIds(input);
  const items = new Map(input.entities.filter((entity) => entity.kind === "items").map((entity) => [entity.entityKey, entity]));
  const statLabels = new Map(input.entities.filter((entity) => entity.kind === "stats").flatMap((entity) => {
    const name = entityDisplayName(entity) ?? text(entity.internalName) ?? String(entity.nativeId);
    const gameplay = record(entity.publicData.gameplay);
    const isPercent = typeof gameplay?.isPercentStat === "boolean" ? gameplay.isPercentStat : undefined;
    return [[entity.nativeId, { label: name, ...(isPercent === undefined ? {} : { isPercent }) }] as const];
  }));
  const dungeons = input.entities
    .filter((entity) => entity.kind === "scenes")
    .map((entity) => guideDungeon(entity, input.entities, input.placements, available, items, statLabels))
    .filter((entity): entity is PublicGuideDungeon => entity !== null);
  const bossMap = new Map<string, PublicGuideBoss>();
  for (const dungeon of dungeons) for (const boss of dungeon.bosses) {
    const previous = bossMap.get(boss.bossKey);
    if (!previous) {
      bossMap.set(boss.bossKey, boss);
      continue;
    }
    bossMap.set(boss.bossKey, {
      ...previous,
      placementIds: [...new Set([...previous.placementIds, ...boss.placementIds])],
      ...(previous.dungeonKeys || boss.dungeonKeys ? { dungeonKeys: [...new Set([...(previous.dungeonKeys ?? []), ...(boss.dungeonKeys ?? [])])] } : {}),
    });
  }
  const regions = input.entities
    .filter((entity) => entity.kind === "regions")
    .map((entity) => guideRegion(entity, input.sources ?? [], available))
    .filter((entity): entity is PublicGuideRegion => entity !== null);
  const properties = input.entities
    .filter((entity) => entity.kind === "properties")
    .map((entity) => guideProperty(entity, input.sources ?? [], available))
    .filter((entity): entity is PublicGuideProperty => entity !== null);
  return { dungeons, bosses: [...bossMap.values()], regions, properties };
}
