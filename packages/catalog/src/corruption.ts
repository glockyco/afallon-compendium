import type { Canonical, CorruptionCapture } from "@afallon/contracts";
import { entityKey, stableJson, type NormalizedCorruptionFacts, type NormalizedEntity, type NormalizedReference, type ProvenanceReference } from "@afallon/contracts/catalog";
import { pointer, type SceneContext, type SourceRecord } from "./context";

const captureKind = "compendium.corruption-capture.v1";

type Capture = { value: CorruptionCapture; reference: ProvenanceReference; targetIdentity: string };

// Distinguish an observed empty list from a missing asset/list. Compare facts, not artifact hashes or paths.
function unique<T>(rows: readonly T[], label: string, identity: (row: T) => unknown): T | null {
  const first = rows[0];
  if (!first) return null;
  const expected = stableJson(identity(first));
  if (rows.some(row => stableJson(identity(row)) !== expected)) throw new Error(`Conflicting corruption ${label} across admitted scan targets.`);
  return first;
}

function checked(value: number | null, label: string, integer = false): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) throw new Error(`Malformed corruption ${label}: ${String(value)}.`);
  return value;
}

export function normalizeCorruption(sources: readonly SourceRecord[], contexts: readonly SceneContext[], canonical: Canonical, entities: readonly NormalizedEntity[]): NormalizedCorruptionFacts | null {
  const captures: Capture[] = sources.filter(source => source.kind === captureKind).map(source => ({ value: source.value as CorruptionCapture, reference: source.reference, targetIdentity: source.targetIdentity }));
  if (!captures.length) return null;
  const entityByKey = new Map(entities.map(entity => [entity.entityKey, entity]));
  const ref = (kind: string, id: number, label: string): NormalizedReference => {
    if (!Number.isSafeInteger(id) || id < 0) throw new Error(`Malformed corruption ${label} ID ${String(id)}.`);
    const key = entityKey(kind, id), entity = entityByKey.get(key);
    if (!entity) throw new Error(`Corruption ${label} references missing ${key}.`);
    return { entityKey: key, label: entity.name ?? label };
  };
  const settings = unique(captures, "combat settings", capture => capture.value.combat)!;
  const affixSettings = unique(captures, "affix settings", capture => capture.value.affixSettings)!;
  const affixNames = unique(captures, "affix descriptions", capture => capture.value.affixes)!;
  const combat = settings.value.combat;
  const maxLevel = checked(combat.maxLevel, "maximum level", true);
  const gearAllStatsPercentPerLevel = checked(combat.gearAllStatsPercentPerLevel, "all-gear percent");
  const bonuses = (rows: typeof combat.gearStatBonuses, label: string) => rows === null ? null : rows.map((row, index) => ({
    stat: ref("stats", row.statId, `Stat ${row.statId}`), amountPerLevel: checked(row.amountPerLevel, `${label}[${index}] amount`)!,
    isPercent: row.isPercent, sourceFieldPath: row.sourceFieldPath,
  }));
  const gearStatBonuses = bonuses(combat.gearStatBonuses, "gear bonus");
  const mobStatBonuses = bonuses(combat.mobStatBonuses, "mob bonus");
  const affixesPerToken = checked(affixSettings.value.affixSettings.affixesPerToken, "affixes per token", true);
  const disabled = affixSettings.value.affixSettings.disabledAffixes;
  const npcRequirements = affixSettings.value.affixSettings.npcRequirements;
  const affixes = affixNames.value.affixes === null || disabled === null || npcRequirements === null ? null : affixNames.value.affixes.map((affix) => {
    if (!affix.name.trim() || !affix.description.trim()) throw new Error(`Malformed corruption affix ${affix.id}.`);
    return { id: affix.id, name: affix.name, description: affix.description,
      available: !disabled.includes(affix.id) && npcRequirements.every(row => row.id !== affix.id || row.npcId >= 0) };
  });
  if (affixes !== null && disabled !== null && npcRequirements !== null && (
    new Set(affixes.map(row => row.id)).size !== affixes.length
    || disabled.some(id => !affixes.some(row => row.id === id))
    || npcRequirements.some(row => !affixes.some(affix => affix.id === row.id))
  )) throw new Error("Malformed corruption affix IDs.");

  const tokenItems = canonical.items.filter(item => item.gameplay.isCorruptionToken === true);
  if (tokenItems.length > 1) throw new Error("Conflicting Corruption Token templates.");
  const token = tokenItems[0] ? ref("items", tokenItems[0].nativeId, "Corruption Token") : null;
  const heartItems = canonical.items.filter(item => [item.name, item.internalName].some(name => name?.toLowerCase() === "heart of corruption"));
  if (heartItems.length > 1) throw new Error("Conflicting Heart of Corruption templates.");
  const heart = heartItems[0] ? ref("items", heartItems[0].nativeId, "Heart of Corruption") : null;
  if (heart !== null && heart.entityKey === token?.entityKey) throw new Error("Heart of Corruption cannot be the Corruption Token.");

  const sceneByPath = new Map(contexts.map(context => [context.scenePath, context.sceneNativeId]));
  const dungeonByScene = new Map<string, NormalizedCorruptionFacts["dungeons"][number]>();
  for (const capture of captures) {
    const timer = capture.value.timer;
    if (timer === null) continue;
    const sceneId = sceneByPath.get(timer.scenePath);
    if (sceneId === undefined) throw new Error(`Corruption timer's source scene ${timer.scenePath} is not admitted.`);
    const scene = ref("scenes", sceneId, `Scene ${sceneId}`);
    const bosses = timer.bosses, tables = timer.lootTables;
    const totalSeconds = checked(timer.totalSeconds, `${timer.scenePath} total seconds`);
    const firstRemainingSeconds = checked(timer.firstRemainingSeconds, `${timer.scenePath} first remaining threshold`);
    const secondRemainingSeconds = checked(timer.secondRemainingSeconds, `${timer.scenePath} second remaining threshold`);
    const maxLootItems = checked(timer.maxLootItems, `${timer.scenePath} max loot items`, true);
    if (totalSeconds !== null && firstRemainingSeconds !== null && secondRemainingSeconds !== null && (firstRemainingSeconds > totalSeconds || secondRemainingSeconds > firstRemainingSeconds)) throw new Error(`Corruption timer ${timer.scenePath} has invalid remaining-time thresholds.`);
    const timerToken = timer.token === null ? null : ref("items", timer.token.id, "Corruption Token");
    if (timerToken !== null && timerToken.entityKey !== token?.entityKey) throw new Error(`Corruption timer ${timer.scenePath} names a non-token reward item.`);
    const dungeon = { scene, totalSeconds, firstRemainingSeconds, secondRemainingSeconds, maxLootItems,
      bosses: bosses === null ? null : bosses.map(boss => ref("npcs", boss.id, "Dungeon boss")),
      lootTables: tables === null ? null : tables.map(table => ref("lootTables", table.id, "Dungeon loot table")),
      token: timerToken, provenance: [pointer(capture.reference, "/timer")] };
    const previous = dungeonByScene.get(scene.entityKey!);
    if (previous && stableJson({ ...previous, provenance: [] }) !== stableJson({ ...dungeon, provenance: [] })) throw new Error(`Conflicting corruption timer for ${scene.entityKey}.`);
    if (previous) previous.provenance.push(...dungeon.provenance);
    else dungeonByScene.set(scene.entityKey!, dungeon);
  }

  const heartRequirements: NonNullable<NormalizedCorruptionFacts["heartRequirements"]> = [];
  let challengeStonesObserved = false;
  for (const context of contexts) for (const [index, source] of context.world.interactions.entries()) {
    if (source.family !== "interactableObject" || !("requirementsTemplate" in source) || source.requirementsTemplate === null || heart === null) continue;
    const hierarchy = source.source.source.hierarchyPath ?? "";
    if (!/challenge stone/i.test(hierarchy)) continue;
    challengeStonesObserved = true;
    for (const group of source.requirementsTemplate.groups) for (const row of group?.requirements ?? []) {
      if (!row || row.requirementType !== "Item" || row.itemID !== heartItems[0]!.nativeId) continue;
      if (row.conditionRule !== "Mandatory" || row.amount1 <= 0 || !Number.isSafeInteger(row.amount1) || !row.consume) throw new Error(`Malformed Heart challenge-stone requirement at ${row.sourceFieldPath}.`);
      const sourceId = source.source.componentInstanceId === null ? null : context.sourceByComponent.get(source.source.componentInstanceId)?.sourceId;
      if (!sourceId) throw new Error(`Unresolved Heart challenge-stone source at ${row.sourceFieldPath}.`);
      const requirement = { sourceId, place: ref("scenes", context.sceneNativeId, "Challenge-stone scene"), count: row.amount1, consume: row.consume,
        sourceFieldPath: row.sourceFieldPath, provenance: [pointer(context.worldReference, `/interactions/${index}/requirementsTemplate`)] };
      const previous = heartRequirements.find(value => value.sourceId === sourceId);
      // Runtime list indices in sourceFieldPath can change between scans of the same placed stone.
      if (previous && (previous.place?.entityKey !== requirement.place.entityKey || previous.count !== requirement.count || previous.consume !== requirement.consume)) throw new Error(`Conflicting Heart requirement at ${sourceId}.`);
      if (previous) previous.provenance.push(...requirement.provenance); else heartRequirements.push(requirement);
    }
  }
  return { maxLevel, gearAllStatsPercentPerLevel, gearStatBonuses, mobStatBonuses, affixesPerToken, affixes,
    token, heart, dungeons: [...dungeonByScene.values()].sort((a, b) => a.scene.entityKey!.localeCompare(b.scene.entityKey!)),
    heartRequirements: challengeStonesObserved ? heartRequirements.sort((a, b) => a.sourceId.localeCompare(b.sourceId)) : null,
    provenance: captures.flatMap(capture => [pointer(capture.reference, "/combat"), pointer(capture.reference, "/affixSettings"), pointer(capture.reference, "/affixes")]) };
}
