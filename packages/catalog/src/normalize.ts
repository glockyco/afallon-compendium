import { CoverageLedgerSchema, ScanCoverageSchema, ScanTargetEnvelopeSchema, decodeContract, type Canonical } from "@afallon/contracts";
import { compileMapSpaces } from "@afallon/contracts/spatial";
import { entityKey, publicEntityDetails, stableJson, type ArtifactReference, type NormalizedDatabaseInput, type NormalizedEntity, type ItemSource, type NormalizedSceneSpawn, type ProvenanceReference, type CatalogDerivation, type NormalizedReference } from "@afallon/contracts/catalog";
import { collectPlacements, collectRegions, attachShapes } from "./placements";
import { collectPatrolPaths, collectWorldConditions, conditionRowsFor, conditionSemanticPayload, producerRows } from "./conditions";
import { addSourceIndex, relationRows } from "./relations";
import { sourceDetails, worldRelations } from "./world";
import { entityDetails } from "./projections";
import { decodeCraftingStationGameplay, decodedPrice, decodeItemGameplay, decodeNpcGameplay, decodePropertyGameplay, decodeQuestGameplay, decodeRecipeGameplay, decodeRegionGameplay, decodeSceneGameplay, decodeTaskGameplay, validateSupportedSemantics, type GameplayCoverageIssue } from "./decoders";
import { assertEvidencePointer, evidenceReference, type AdmittedCatalog } from "./evidence";
import { pointer, type Blocker, type Exclusion } from "./context";
import { hashRelation } from "./database";

function canonicalEntities(canonical: Canonical, buildId: string, reference: ArtifactReference): NormalizedEntity[] {
  const entities: NormalizedEntity[] = [];
  for (const kind of ["items", "npcs", "quests", "lootTables", "scenes", "resources", "stats", "regions", "properties"] as const) for (const [index, row] of canonical[kind].entries()) entities.push({ entityKey: entityKey(kind, row.nativeId), buildId, kind, nativeId: row.nativeId, ...publicEntityDetails(row), sourceKey: row.sourceKey, publicData: { localization: row.localization, gameplay: row.gameplay, icon: row.icon }, provenance: [pointer(reference, `/${kind}/${index}`)] });
  const seen = new Set<string>();
  for (const entity of entities) { if (seen.has(entity.entityKey)) throw new Error(`Duplicate canonical identity ${entity.entityKey}.`); seen.add(entity.entityKey); }
  return entities;
}

function mergeEvidence<T extends { provenance: ProvenanceReference[] }>(rows: readonly T[], key: (row: T) => string, fact: (row: T) => unknown = (row) => ({ ...row, provenance: [] })): T[] {
  const merged = new Map<string, T>();
  for (const row of rows) {
    const id = key(row), previous = merged.get(id);
    if (!previous) { merged.set(id, { ...row, provenance: [...row.provenance] }); continue; }
    if (stableJson(fact(previous)) !== stableJson(fact(row))) throw new Error(`Conflicting authored fact ${id}.`);
    previous.provenance = [...new Map([...previous.provenance, ...row.provenance].map((ref) => [`${ref.sha256}:${ref.pointer ?? ""}`, ref])).values()];
  }
  return [...merged.values()].sort((a, b) => key(a).localeCompare(key(b)));
}

type FactRows = {
  itemFacts: NonNullable<NormalizedDatabaseInput["itemFacts"]>; itemStats: NonNullable<NormalizedDatabaseInput["itemStats"]>; itemRandomStats: NonNullable<NormalizedDatabaseInput["itemRandomStats"]>; itemGemStats: NonNullable<NormalizedDatabaseInput["itemGemStats"]>; itemSockets: NonNullable<NormalizedDatabaseInput["itemSockets"]>;
  npcFacts: NonNullable<NormalizedDatabaseInput["npcFacts"]>; npcStats: NonNullable<NormalizedDatabaseInput["npcStats"]>; npcAbilityPhases: NonNullable<NormalizedDatabaseInput["npcAbilityPhases"]>; npcPhaseAbilities: NonNullable<NormalizedDatabaseInput["npcPhaseAbilities"]>; npcFactionRewards: NonNullable<NormalizedDatabaseInput["npcFactionRewards"]>;
  questFacts: NonNullable<NormalizedDatabaseInput["questFacts"]>; questObjectives: NonNullable<NormalizedDatabaseInput["questObjectives"]>; questRewards: NonNullable<NormalizedDatabaseInput["questRewards"]>;
  placeFacts: NonNullable<NormalizedDatabaseInput["placeFacts"]>; propertyFacts: NonNullable<NormalizedDatabaseInput["propertyFacts"]>; taskFacts: NonNullable<NormalizedDatabaseInput["taskFacts"]>; abilityFacts: NonNullable<NormalizedDatabaseInput["abilityFacts"]>;
  recipeFacts: NonNullable<NormalizedDatabaseInput["recipeFacts"]>; recipeRanks: NonNullable<NormalizedDatabaseInput["recipeRanks"]>; recipeProducts: NonNullable<NormalizedDatabaseInput["recipeProducts"]>; recipeMaterials: NonNullable<NormalizedDatabaseInput["recipeMaterials"]>; craftingStationFacts: NonNullable<NormalizedDatabaseInput["craftingStationFacts"]>;
  artworkAssets: NonNullable<NormalizedDatabaseInput["artworkAssets"]>; artworkBindings: NonNullable<NormalizedDatabaseInput["artworkBindings"]>;
};

function collectTypedFacts(admitted: AdmittedCatalog, entities: NormalizedEntity[], bindings: NormalizedDatabaseInput["bindings"], conditions: NormalizedDatabaseInput["conditions"], blockers: Blocker[]): FactRows {
  const rows: FactRows = { itemFacts: [], itemStats: [], itemRandomStats: [], itemGemStats: [], itemSockets: [], npcFacts: [], npcStats: [], npcAbilityPhases: [], npcPhaseAbilities: [], npcFactionRewards: [], questFacts: [], questObjectives: [], questRewards: [], placeFacts: [], propertyFacts: [], taskFacts: [], abilityFacts: [], recipeFacts: [], recipeRanks: [], recipeProducts: [], recipeMaterials: [], craftingStationFacts: [], artworkAssets: [], artworkBindings: [] };
  const entityByKey = new Map(entities.map((row) => [row.entityKey, row]));
  const reference = (kind: string, nativeId: number | null | undefined, label: string, path: string, provenance: ProvenanceReference[]): NormalizedReference | null => {
    if (nativeId === undefined || nativeId === null) return null;
    if (nativeId < 0) return null;
    const key = entityKey(kind, nativeId), target = entityByKey.get(key);
    if (!target) { blockers.push({ kind: "missing-reference", key: `${path}:${key}`, detail: `Typed fact references missing ${key}.`, provenance }); return { entityKey: null, label }; }
    return { entityKey: key, label: target.name ?? label };
  };
  const issueRows = (subject: string, issues: GameplayCoverageIssue[], provenance: ArtifactReference) => { for (const issue of issues) blockers.push({ kind: "unsupported-enum", key: `${subject}:${issue.path}`, detail: issue.detail, provenance: [pointer(provenance, issue.path)] }); };
  const conditionIds = new Map<string, string[]>();
  for (const condition of conditions) { const values = conditionIds.get(condition.ownerKey) ?? []; values.push(condition.conditionId); conditionIds.set(condition.ownerKey, values); }
  const statPercent = new Map(admitted.canonical.value.stats.map((stat) => [stat.nativeId, stat.gameplay.isPercentStat === true]));
  const itemLevels = new Map(admitted.lootRules.value.itemLevels.map((row) => [row.itemId, row.requiredLevel]));

  for (const [index, item] of admitted.canonical.value.items.entries()) {
    const path = `/items/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/items/${index}`)], decoded = decodeItemGameplay(item.gameplay, admitted.canonical.reference, path);
    issueRows(entityKey("items", item.nativeId), decoded.issues, admitted.canonical.reference);
    const value = decoded.value, enumName = (field: typeof value.itemType): string | null => field?.available === true && typeof field.name === "string" ? field.name : null;
    const enchantment = reference("enchantments", value.enchantmentId, `Enchantment ${String(value.enchantmentId ?? "unknown")}`, `${path}/enchantmentId`, provenance);
    const sell = decodedPrice(value.sellPrice, value.sellCurrencyId), buy = decodedPrice(value.buyPrice, value.buyCurrencyId);
    const sellCurrency = reference("currencies", sell?.currencyId, `Currency ${String(sell?.currencyId ?? "unknown")}`, `${path}/sellCurrencyId`, provenance);
    const buyCurrency = reference("currencies", buy?.currencyId, `Currency ${String(buy?.currencyId ?? "unknown")}`, `${path}/buyCurrencyId`, provenance);
    const sellPrice = sell?.amount ?? null, buyPrice = buy?.amount ?? null;
    const actions = (value.actionAbilities ?? []).map((row, actionIndex) => reference("abilities", row.abilityId ?? row.abilityID, `Ability ${String(row.abilityId ?? row.abilityID ?? "unknown")}`, `${path}/actionAbilities/${actionIndex}`, provenance)).filter((row): row is NonNullable<typeof row> => row !== null);
    const gemType = value.gemData?.gemSocketType?.available === true ? value.gemData.gemSocketType.name ?? null : value.gemData?.socketType || null;
    rows.itemFacts.push({ entityKey: entityKey("items", item.nativeId), rarity: enumName(value.rarity), itemType: enumName(value.itemType), armorSlot: enumName(value.armorSlot), weaponSlot: enumName(value.weaponSlot), weaponType: enumName(value.weaponType), armorType: enumName(value.armorType), attackSpeed: value.attackSpeed ?? null, minDamage: value.minDamage ?? null, maxDamage: value.maxDamage ?? null, randomStatsMax: value.randomStatsMax ?? 0, gemType, enchantment, sellPrice, sellCurrency, buyPrice, buyCurrency, stackLimit: value.stackLimit ?? 1, questDropOnly: value.questDropOnly ?? false, corruptionToken: value.isCorruptionToken ?? false, levelRequirement: itemLevels.get(item.nativeId) ?? null, actionAbilities: actions, conditionIds: conditionIds.get(entityKey("items", item.nativeId)) ?? [], provenance });
    for (const [statIndex, stat] of (value.stats ?? []).entries()) { const statRef = reference("stats", stat.statId, `Stat ${stat.statId}`, `${path}/stats/${statIndex}`, provenance); if (statRef) rows.itemStats.push({ entityKey: entityKey("items", item.nativeId), statIndex, stat: statRef, amount: stat.amount, isPercent: stat.isPercent, provenance }); }
    for (const [statIndex, stat] of (value.randomStats ?? []).entries()) { const statRef = reference("stats", stat.statId, `Stat ${stat.statId}`, `${path}/randomStats/${statIndex}`, provenance); if (statRef) rows.itemRandomStats.push({ entityKey: entityKey("items", item.nativeId), statIndex, stat: statRef, min: stat.minValue, max: stat.maxValue, isPercent: stat.isPercent, whole: stat.isInt ?? false, chance: stat.chance ?? null, provenance }); }
    for (const [statIndex, stat] of (value.gemData?.stats ?? []).entries()) { const statRef = reference("stats", stat.statId, `Stat ${stat.statId}`, `${path}/gemData/stats/${statIndex}`, provenance); if (statRef) rows.itemGemStats.push({ entityKey: entityKey("items", item.nativeId), statIndex, stat: statRef, amount: stat.amount, isPercent: stat.isPercent, provenance }); }
    for (const [socketIndex, socket] of (value.sockets ?? []).entries()) rows.itemSockets.push({ entityKey: entityKey("items", item.nativeId), socketIndex, socketType: socket.socketType || null, gemType: socket.gemSocketType?.available === true ? socket.gemSocketType.name ?? null : null, provenance });
  }

  for (const [index, npc] of admitted.canonical.value.npcs.entries()) {
    const path = `/npcs/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/npcs/${index}`)], decoded = decodeNpcGameplay(npc.gameplay, admitted.canonical.reference, path), value = decoded.value;
    issueRows(entityKey("npcs", npc.nativeId), decoded.issues, admitted.canonical.reference);
    const faction = reference("factions", value.factionId, `Faction ${String(value.factionId ?? "unknown")}`, `${path}/factionId`, provenance), species = reference("species", value.speciesId, `Species ${String(value.speciesId ?? "unknown")}`, `${path}/speciesId`, provenance), linkedNpc = reference("npcs", value.linkedNpcId, `NPC ${String(value.linkedNpcId ?? "unknown")}`, `${path}/linkedNpcId`, provenance);
    const weaponTypes = [value.lootSpecializationWeaponType, value.lootSpecializationWeaponType2, value.lootSpecializationWeaponType3].flatMap((entry) => entry?.available === true && entry.name ? [entry.name] : []);
    const specializationStat = reference("stats", value.lootSpecializationStatId, `Stat ${String(value.lootSpecializationStatId ?? "unknown")}`, `${path}/lootSpecializationStatId`, provenance);
    rows.npcFacts.push({ entityKey: entityKey("npcs", npc.nativeId), minLevel: value.minLevel ?? null, maxLevel: value.maxLevel ?? null, scalesWithPlayer: value.isScalingWithPlayer ?? false, npcType: value.npcType?.name ?? null, creatureType: value.creatureType?.name ?? null, family: value.npcFamily?.available === true ? value.npcFamily.name ?? null : null, faction, species, isMerchant: value.isMerchant ?? false, isQuestGiver: value.isQuestGiver ?? false, isCombatEnabled: value.isCombatEnabled ?? false, minRespawn: value.minRespawn ?? null, maxRespawn: value.maxRespawn ?? null, minExperience: value.minExperience ?? null, maxExperience: value.maxExperience ?? null, immuneToStun: value.immuneToStun ?? false, immuneToSlow: value.immuneToSlow ?? false, aggroRange: value.useAggroRange === false ? null : value.aggroRange ?? null, linkedNpc, lootSpecialization: value.hasLootSpecialization === true ? { armorType: value.lootSpecializationArmorType?.available === true ? value.lootSpecializationArmorType.name ?? null : null, weaponTypes, stat: specializationStat } : null, provenance });
    const stats = value.guideStats ?? value.stats?.map((stat) => ({ statId: stat.statId, value: stat.baseValue ?? stat.minValue ?? stat.maxValue ?? 0 })) ?? [];
    for (const [statIndex, stat] of stats.entries()) { const statRef = reference("stats", stat.statId, `Stat ${stat.statId}`, `${path}/guideStats/${statIndex}`, provenance); if (statRef) rows.npcStats.push({ entityKey: entityKey("npcs", npc.nativeId), statIndex, stat: statRef, amount: stat.value, isPercent: statPercent.get(stat.statId) ?? false, provenance }); }
    for (const [phaseIndex, phase] of (value.aiPhases ?? []).entries()) { rows.npcAbilityPhases.push({ entityKey: entityKey("npcs", npc.nativeId), phaseIndex: phase.phaseIndex, name: phase.name || null, requirement: phase.requirement || null, provenance }); for (const [abilityIndex, abilityId] of phase.abilityIds.entries()) { const ability = reference("abilities", abilityId, `Ability ${abilityId}`, `${path}/aiPhases/${phaseIndex}/abilityIds/${abilityIndex}`, provenance); if (ability) rows.npcPhaseAbilities.push({ entityKey: entityKey("npcs", npc.nativeId), phaseIndex: phase.phaseIndex, abilityIndex, ability, provenance }); } }
    for (const [rewardIndex, reward] of (value.factionRewards ?? []).entries()) { const faction = reference("factions", reward.factionId, `Faction ${reward.factionId}`, `${path}/factionRewards/${rewardIndex}`, provenance); if (faction) rows.npcFactionRewards.push({ entityKey: entityKey("npcs", npc.nativeId), rewardIndex, faction, amount: reward.amount, provenance }); }
  }

  const taskById = new Map<number, NonNullable<NormalizedDatabaseInput["taskFacts"]>[number]>();
  for (const [index, task] of admitted.relationships.value.tasks.entries()) {
    const path = `/tasks/${index}`, provenance = [pointer(admitted.relationships.reference, path)], decoded = decodeTaskGameplay(task, admitted.relationships.reference, path), value = decoded.value;
    issueRows(entityKey("tasks", task.nativeId), decoded.issues, admitted.relationships.reference);
    let target: NormalizedReference | null = null;
    if (value.taskType === "learnAbility") target = reference("abilities", value.abilityToLearnID, `Ability ${String(value.abilityToLearnID ?? "unknown")}`, `${path}/abilityToLearnID`, provenance);
    else if (value.taskType === "killNPC") target = reference("npcs", value.npcToKillID, value.npcToKillName ?? `NPC ${String(value.npcToKillID ?? "unknown")}`, `${path}/npcToKillID`, provenance);
    else if (value.taskType === "getItem") target = reference("items", value.itemToGetID, value.itemToGetName ?? `Item ${String(value.itemToGetID ?? "unknown")}`, `${path}/itemToGetID`, provenance);
    else if (value.taskType === "useItem") target = reference("items", value.itemToUseID, value.itemToUseName ?? `Item ${String(value.itemToUseID ?? "unknown")}`, `${path}/itemToUseID`, provenance);
    else if (value.taskType === "talkToNPC") target = reference("npcs", value.npcToTalkToID, value.npcToTalkToName ?? `NPC ${String(value.npcToTalkToID ?? "unknown")}`, `${path}/npcToTalkToID`, provenance);
    else if (value.taskType === "reachSkillLevel") target = reference("skills", value.skillRequiredID, value.skillRequiredName ?? `Skill ${String(value.skillRequiredID ?? "unknown")}`, `${path}/skillRequiredID`, provenance);
    else if (value.taskType === "enterScene" && value.sceneName) { const scene = entities.find((row) => row.kind === "scenes" && (row.name === value.sceneName || row.internalName === value.sceneName)); target = scene ? { entityKey: scene.entityKey, label: scene.name ?? value.sceneName } : { entityKey: null, label: value.sceneName }; }
    const fact = { entityKey: entityKey("tasks", task.nativeId), taskType: value.taskType, target, count: value.taskValue ?? null, keepItems: value.taskType === "getItem" ? value.keepItems ?? false : null, sceneName: value.sceneName || null, provenance };
    rows.taskFacts.push(fact); taskById.set(task.nativeId, fact);
  }

  for (const [index, quest] of admitted.canonical.value.quests.entries()) {
    const path = `/quests/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/quests/${index}`)], decoded = decodeQuestGameplay(quest.gameplay, admitted.canonical.reference, path), value = decoded.value, key = entityKey("quests", quest.nativeId);
    issueRows(key, decoded.issues, admitted.canonical.reference);
    const experience = (value.rewardsGiven ?? []).filter((reward) => reward.rewardType.name === "Experience").reduce((sum, reward) => sum + reward.experience, 0) || null;
    rows.questFacts.push({ entityKey: key, chainName: value.questChainName ?? null, chainOrder: value.questChainOrder ?? null, repeatable: value.repeatable ?? false, turnInWithoutNpc: value.canBeTurnedInWithoutNpc ?? false, completedDescription: value.completedDescription ?? null, objectiveText: value.objectiveText ?? null, levelRequirement: null, experience, conditionIds: conditionIds.get(key) ?? [], provenance });
    for (const [objectiveIndex, objective] of (value.objectives ?? []).entries()) { const task = taskById.get(objective.taskId), taskRef = reference("tasks", objective.taskId, `Task ${objective.taskId}`, `${path}/objectives/${objectiveIndex}/taskId`, provenance); if (taskRef) rows.questObjectives.push({ questEntityKey: key, objectiveIndex, taskType: task?.taskType ?? "unsupported", task: taskRef, target: task?.target ?? null, count: task?.count ?? null, keepItems: task?.keepItems ?? null, sceneName: task?.sceneName ?? null, provenance }); }
    const rewards = (set: "given" | "pick", values: typeof value.rewardsGiven) => { for (const [rewardIndex, reward] of (values ?? []).entries()) { const type = reward.rewardType.name; let target: NormalizedReference | null = null; if (type === "item") target = reference("items", reward.itemId, `Item ${reward.itemId}`, `${path}/${set}/${rewardIndex}/itemId`, provenance); else if (type === "currency") target = reference("currencies", reward.currencyId, `Currency ${reward.currencyId}`, `${path}/${set}/${rewardIndex}/currencyId`, provenance); else if (type === "FactionPoint") target = reference("factions", reward.factionId, `Faction ${reward.factionId}`, `${path}/${set}/${rewardIndex}/factionId`, provenance); else if (type === "treePoint") target = reference("treePoints", reward.treePointId, `Tree point ${reward.treePointId}`, `${path}/${set}/${rewardIndex}/treePointId`, provenance); if (type === "Experience" || target) rows.questRewards.push({ questEntityKey: key, rewardSet: set, rewardIndex, rewardType: type, target, count: reward.count, experience: type === "Experience" ? reward.experience : null, provenance }); } };
    rewards("given", value.rewardsGiven); rewards("pick", value.rewardsToPick);
    for (const [rewardIndex, given] of (value.itemsGiven ?? []).entries()) { const target = reference("items", given.itemId, `Item ${given.itemId}`, `${path}/itemsGiven/${rewardIndex}/itemId`, provenance); if (target) rows.questRewards.push({ questEntityKey: key, rewardSet: "itemGiven", rewardIndex, rewardType: "item", target, count: given.count, experience: null, provenance }); }
  }

  const mapsByScene = new Map<number, string[]>();
  for (const binding of bindings) { const values = mapsByScene.get(binding.sceneNativeId) ?? []; values.push(binding.mapSpaceId); mapsByScene.set(binding.sceneNativeId, values); }
  for (const [index, scene] of admitted.canonical.value.scenes.entries()) { const path = `/scenes/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/scenes/${index}`)], decoded = decodeSceneGameplay(scene.gameplay, admitted.canonical.reference, path), value = decoded.value, guideIncluded = value.includedInAdventureGuide ?? false, hasDungeonLevels = (value.dungeonLevelMin ?? 0) > 0 || (value.dungeonLevelMax ?? 0) > 0; rows.placeFacts.push({ entityKey: entityKey("scenes", scene.nativeId), placeType: guideIncluded && hasDungeonLevels ? "dungeon" : "zone", guideIncluded, guideDescription: value.adventureGuideDescription ?? scene.description, levelMin: hasDungeonLevels ? value.dungeonLevelMin ?? null : value.zoneScalingMinLevel ?? null, levelMax: hasDungeonLevels ? value.dungeonLevelMax ?? null : value.zoneScalingMaxLevel ?? null, mapSpaceIds: [...new Set(mapsByScene.get(scene.nativeId) ?? [])].sort(), bosses: (value.adventureGuideBosses ?? []).map((boss, bossIndex) => reference("npcs", boss.npcId, `NPC ${boss.npcId}`, `${path}/adventureGuideBosses/${bossIndex}`, provenance)).filter((boss): boss is NormalizedReference => boss !== null), parentSceneKey: null, provenance }); }
  for (const [index, region] of admitted.canonical.value.regions.entries()) { const path = `/regions/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/regions/${index}`)], value = decodeRegionGameplay(region.gameplay, admitted.canonical.reference, path).value, parent = reference("scenes", value.parentSceneId, `Scene ${String(value.parentSceneId ?? "unknown")}`, `${path}/parentSceneId`, provenance); rows.placeFacts.push({ entityKey: entityKey("regions", region.nativeId), placeType: "region", guideIncluded: value.includedInAdventureGuide ?? false, guideDescription: value.adventureGuideDescription ?? region.description, levelMin: value.levelRangeMin ?? null, levelMax: value.levelRangeMax ?? null, mapSpaceIds: [], bosses: [], parentSceneKey: parent?.entityKey ?? null, provenance }); }
  for (const [index, property] of admitted.canonical.value.properties.entries()) { const path = `/properties/${index}/gameplay`, provenance = [pointer(admitted.canonical.reference, `/properties/${index}`)], decoded = decodePropertyGameplay(property.gameplay, admitted.canonical.reference, path), value = decoded.value; issueRows(entityKey("properties", property.nativeId), decoded.issues, admitted.canonical.reference); rows.propertyFacts.push({ entityKey: entityKey("properties", property.nativeId), income: value.income ?? value.incomeAmount ?? null, purchasePrice: value.purchasePrice ?? null, sellPrice: value.sellPrice ?? null, currency: reference("currencies", value.currencyId, `Currency ${String(value.currencyId ?? "unknown")}`, `${path}/currencyId`, provenance), propertyType: value.propertyType?.name ?? null, provenance }); }

  const supportFamilies = ["abilities", "recipes", "craftingStations"] as const;
  for (const family of supportFamilies) for (const [index, support] of (admitted.support.value.tables[family] ?? []).entries()) {
    const key = entityKey(family, support.entry.nativeId), path = `/tables/${family}/${index}`, provenance = [pointer(admitted.support.reference, path)];
    if (family === "abilities") rows.abilityFacts.push({ entityKey: key, provenance });
    else if (family === "recipes" && support.gameplay !== undefined) { const value = decodeRecipeGameplay(support.gameplay, admitted.support.reference, `${path}/gameplay`).value; rows.recipeFacts.push({ entityKey: key, skill: reference("skills", value.craftingSkillId, `Skill ${value.craftingSkillId}`, `${path}/gameplay/craftingSkillId`, provenance), station: reference("craftingStations", value.craftingStationId, `Crafting station ${value.craftingStationId}`, `${path}/gameplay/craftingStationId`, provenance), learnedByDefault: value.learnedByDefault, provenance }); for (const rank of value.ranks) { rows.recipeRanks.push({ entityKey: key, rank: rank.rankIndex, unlockCost: rank.unlockCost, experience: rank.experience, craftTime: rank.craftTime, provenance }); for (const [productIndex, product] of rank.craftedItems.entries()) { const item = reference("items", product.itemId, `Item ${product.itemId}`, `${path}/gameplay/ranks/${rank.rankIndex}/craftedItems/${productIndex}`, provenance); if (item) rows.recipeProducts.push({ entityKey: key, rank: rank.rankIndex, productIndex, item, count: product.count, chance: product.chance, provenance }); } for (const [materialIndex, material] of rank.components.entries()) { const item = reference("items", material.itemId, `Item ${material.itemId}`, `${path}/gameplay/ranks/${rank.rankIndex}/components/${materialIndex}`, provenance); if (item) rows.recipeMaterials.push({ entityKey: key, rank: rank.rankIndex, materialIndex, item, count: material.count, provenance }); } } }
    else if (family === "craftingStations" && support.gameplay !== undefined) { const value = decodeCraftingStationGameplay(support.gameplay, admitted.support.reference, `${path}/gameplay`).value; rows.craftingStationFacts.push({ entityKey: key, maxDistance: value.maxDistance, skillRefs: value.craftSkillIds.map((id, skillIndex) => reference("skills", id, `Skill ${id}`, `${path}/gameplay/craftSkillIds/${skillIndex}`, provenance)).filter((skill): skill is NormalizedReference => skill !== null), provenance }); }
  }

  if (admitted.artwork) {
    const assets = new Map<string, NonNullable<NormalizedDatabaseInput["artworkAssets"]>[number]>(), bindingsByRole = new Map<string, string>();
    for (const [index, record] of admitted.artwork.value.records.entries()) {
      const provenance = [pointer(admitted.artwork.reference, `/records/${index}`)], key = entityKey(record.family, record.nativeId);
      if (record.status !== "extracted" || record.image === null) { blockers.push({ kind: "artwork-unavailable", key: `${key}:${record.role}`, detail: record.reason ?? `Artwork status is ${record.status}.`, provenance }); continue; }
      if (!entityByKey.has(key)) { blockers.push({ kind: "missing-reference", key: `artwork:${key}:${record.role}`, detail: `Artwork references missing ${key}.`, provenance }); continue; }
      const previous = assets.get(record.image.sha256), asset = { assetId: record.image.sha256, sha256: record.image.sha256, bytes: record.image.bytes, width: record.image.width, height: record.image.height, sourceName: record.sourceName, provenance };
      if (previous && (previous.bytes !== asset.bytes || previous.width !== asset.width || previous.height !== asset.height)) throw new Error(`Artwork asset ${asset.sha256} has conflicting metadata.`);
      if (previous) { previous.provenance.push(...provenance); if (asset.sourceName.localeCompare(previous.sourceName) < 0) previous.sourceName = asset.sourceName; }
      else assets.set(asset.sha256, asset);
      const roleKey = `${key}:${record.role}`, bound = bindingsByRole.get(roleKey); if (bound && bound !== asset.assetId) throw new Error(`Artwork binding ${roleKey} names multiple assets.`); bindingsByRole.set(roleKey, asset.assetId);
      rows.artworkBindings.push({ entityKey: key, role: record.role, assetId: asset.assetId, provenance });
    }
    rows.artworkAssets.push(...[...assets.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)));
    rows.artworkBindings = mergeEvidence(rows.artworkBindings, (row) => `${row.entityKey}:${row.role}`);
  }
  return rows;
}

export function normalizeCatalog(admitted: AdmittedCatalog, planReference: ArtifactReference): NormalizedDatabaseInput {
  const { plan, profile, contexts, canonical, relationships, lootRules } = admitted;
  const profileReference = evidenceReference(plan.spatialProfile);
  const gameplay = validateSupportedSemantics(canonical.value, relationships.value, canonical.reference, relationships.reference);
  const resolver = compileMapSpaces(profile, admitted.sceneCatalog.value);
  const bindings = profile.bindings.map((binding) => ({ id: binding.id, mapSpaceId: binding.mapSpaceId, sceneNativeId: binding.sceneNativeId, scenePath: binding.scenePath, frame: binding.frame, domain: binding.domain }));
  const blockers: Blocker[] = [], exclusions: Exclusion[] = [];
  const placements = collectPlacements(contexts, bindings, resolver, profileReference, blockers, exclusions);
  attachShapes(contexts, placements.sourceForComponent, placements.placements, blockers);
  const regions = collectRegions(contexts, plan.buildId, resolver, blockers);
  for (const placement of placements.placements) placement.buildId = plan.buildId;
  for (const source of placements.sources) source.buildId = plan.buildId;
  const entities = canonicalEntities(canonical.value, plan.buildId, canonical.reference);
  const supportKinds = ["abilities", "effects", "recipes", "craftingStations", "factions", "currencies", "skills", "classes", "races", "enchantments", "gearSets", "species", "stats"] as const;
  const admittedKeys = new Set(entities.map((row) => row.entityKey));
  for (const kind of supportKinds) {
    const table = admitted.support.value.tables[kind] ?? [], expected = admitted.support.value.sourceTotals[kind];
    if (expected !== undefined && table.length !== expected) throw new Error(`Support ${kind} count ${table.length} differs from source total ${expected}.`);
    if (kind === "stats") continue;
    for (const [index, row] of table.entries()) {
      const key = entityKey(kind, row.entry.nativeId); if (admittedKeys.has(key)) continue;
      const definition = row.entry as typeof row.entry & { description?: unknown; localization?: unknown; icon?: unknown };
      entities.push({ entityKey: key, buildId: plan.buildId, kind, nativeId: row.entry.nativeId, ...publicEntityDetails(definition), sourceKey: row.sourceKey, publicData: { localization: definition.localization ?? null, gameplay: row.gameplay ?? null, icon: definition.icon ?? null }, provenance: [pointer(admitted.support.reference, `/tables/${kind}/${index}`)] }); admittedKeys.add(key);
    }
  }
  for (const [index, row] of relationships.value.currencies.entries()) { const key = entityKey("currencies", row.nativeId); if (!admittedKeys.has(key)) { entities.push({ entityKey: key, buildId: plan.buildId, kind: "currencies", nativeId: row.nativeId, ...publicEntityDetails(row), sourceKey: null, publicData: { localization: null, gameplay: null, icon: null }, provenance: [pointer(relationships.reference, `/currencies/${index}`)] }); admittedKeys.add(key); } }
  for (const [index, row] of relationships.value.tasks.entries()) { const key = entityKey("tasks", row.nativeId); if (!admittedKeys.has(key)) { entities.push({ entityKey: key, buildId: plan.buildId, kind: "tasks", nativeId: row.nativeId, ...publicEntityDetails(row), sourceKey: null, publicData: { localization: null, gameplay: row, icon: null }, provenance: [pointer(relationships.reference, `/tasks/${index}`)] }); admittedKeys.add(key); } }
  entities.sort((a, b) => a.entityKey.localeCompare(b.entityKey));
  const knownEntities = new Set(entities.map((row) => row.entityKey));
  const roles = placements.roles.filter((role) => {
    if (role.npcId !== null && role.npcId < 0) { role.npcId = null; return true; }
    if (role.npcId === null || knownEntities.has(entityKey("npcs", role.npcId))) return true;
    blockers.push({ kind: "missing-reference", key: `role:${role.placementId}:${role.role}:${role.npcId}`, detail: `Role references missing NPC ${role.npcId}.`, provenance: [] });
    return false;
  });
  const spawn = producerRows(contexts, blockers);
  for (const row of spawn.candidates) if (row.npcId !== null) { if (row.npcId < 0) row.npcId = null; else if (!knownEntities.has(entityKey("npcs", row.npcId))) { blockers.push({ kind: "missing-reference", key: `spawn:${row.sourceId}:${row.candidateIndex}:${row.npcId}`, detail: `Spawn candidate references missing NPC ${row.npcId}.`, provenance: row.provenance }); row.npcId = null; } }
  const relations = relationRows(relationships.value, canonical.value, lootRules.value, roles, knownEntities, gameplay, relationships.reference, lootRules.reference, blockers);
  relations.linkedNpcRules = relations.linkedNpcRules.flatMap((row, index) => {
    const provenance = [pointer(lootRules.reference, `/linkedNpcs/${index}`)];
    if (row.npcId < 0) return [];
    if (!knownEntities.has(entityKey("npcs", row.npcId))) { blockers.push({ kind: "missing-reference", key: `linked-npc:${row.npcId}`, detail: `Linked NPC rule references missing NPC ${row.npcId}.`, provenance }); return []; }
    const linked = (nativeId: number | null, field: string): number | null => { if (nativeId === null || nativeId < 0) return null; if (knownEntities.has(entityKey("npcs", nativeId))) return nativeId; blockers.push({ kind: "missing-reference", key: `linked-npc:${row.npcId}:${field}:${nativeId}`, detail: `Linked NPC rule references missing NPC ${nativeId}.`, provenance }); return null; };
    return [{ ...row, authoredLinkedNpcId: linked(row.authoredLinkedNpcId, "authored") ?? -1, resolvedLinkedNpcId: linked(row.resolvedLinkedNpcId, "resolved"), resolvedLootSpecNpcId: linked(row.resolvedLootSpecNpcId, "loot-specialization") }];
  });
  const conditions = [...spawn.conditions, ...collectWorldConditions(contexts, blockers), ...relations.conditions];
  for (const kind of ["lootTables", "quests", "tasks", "resources"] as const) for (const [index, row] of relationships.value[kind].entries()) if ("nativeId" in row && typeof row.nativeId === "number") conditions.push(...conditionRowsFor("entity", entityKey(kind, row.nativeId), row, pointer(relationships.reference, `/${kind}/${index}`)));
  for (const [index, row] of (relationships.value.items ?? []).entries()) conditions.push(...conditionRowsFor("entity", entityKey("items", row.nativeId), row, pointer(relationships.reference, `/items/${index}`)));
  const meaningfulConditions = conditions.filter((row) => { const payload = conditionSemanticPayload(row.payload); return row.semantics !== "inline-requirements" || payload === null || typeof payload !== "object" || !("groups" in payload) || !Array.isArray(payload.groups) || payload.groups.length > 0; });
  const meaningfulConditionIds = new Set(meaningfulConditions.map((row) => row.conditionId));
  const omittedConditionIds = new Set(conditions.filter((row) => !meaningfulConditionIds.has(row.conditionId)).map((row) => row.conditionId));
  for (const binding of [...relations.merchantBindings, ...relations.lootBindings]) if (binding.conditionId !== null && omittedConditionIds.has(binding.conditionId)) binding.conditionId = null;
  const worlds = worldRelations(contexts, placements.sourcePlacement, relations.lootEntries, meaningfulConditions, relations.itemIndex, blockers);
  const bindingsByScene = new Map<number, Set<string>>();
  for (const binding of bindings) { const maps = bindingsByScene.get(binding.sceneNativeId) ?? new Set<string>(); maps.add(binding.mapSpaceId); bindingsByScene.set(binding.sceneNativeId, maps); }
  for (const transition of worlds.transitions) if (transition.destinationSceneNativeId !== null) {
    const destinations = bindingsByScene.get(transition.destinationSceneNativeId);
    if (destinations?.size === 1) transition.destinationMapSpaceId = [...destinations][0]!;
    if (!knownEntities.has(entityKey("scenes", transition.destinationSceneNativeId))) blockers.push({ kind: "missing-reference", key: `transition:${transition.transitionId}`, detail: `Transition references missing scene ${transition.destinationSceneNativeId}.`, provenance: transition.provenance });
  }
  const conditionsByOwner = new Map<string, string[]>();
  for (const condition of meaningfulConditions) { const rows = conditionsByOwner.get(condition.ownerKey) ?? []; rows.push(condition.conditionId); conditionsByOwner.set(condition.ownerKey, rows); }
  for (const sources of relations.itemIndex.values()) for (const source of sources.values()) {
    const owners: string[] = [];
    if (Array.isArray(source.context.ownerEntityKeys)) for (const owner of source.context.ownerEntityKeys) if (typeof owner === "string") owners.push(owner);
    if (typeof source.context.lootTableId === "number") owners.push(entityKey("lootTables", source.context.lootTableId));
    if (typeof source.context.resourceId === "number") owners.push(entityKey("resources", source.context.resourceId));
    source.conditionIds = [...new Set([...source.conditionIds, ...owners.flatMap((owner) => conditionsByOwner.get(owner) ?? [])])].sort();
  }
  const npcPlacements = new Map<number, Set<string>>();
  for (const role of roles) if (role.npcId !== null) { const rows = npcPlacements.get(role.npcId) ?? new Set<string>(); rows.add(role.placementId); npcPlacements.set(role.npcId, rows); }
  for (const [npcIndex, npc] of canonical.value.npcs.entries()) for (const [startIndex, startItem] of (decodeNpcGameplay(npc.gameplay, canonical.reference, `/npcs/${npcIndex}/gameplay`).value.startItems ?? []).entries()) {
    if (startItem.itemId < 0) continue;
    const provenance = [pointer(canonical.reference, `/npcs/${npcIndex}/gameplay/startItems/${startIndex}`)];
    if (!knownEntities.has(entityKey("items", startItem.itemId))) { blockers.push({ kind: "missing-reference", key: `npc-start-item:${npc.nativeId}:${startIndex}:items:${startItem.itemId}`, detail: `NPC starter inventory references missing item ${startItem.itemId}.`, provenance }); continue; }
    addSourceIndex(relations.itemIndex, startItem.itemId, "npc-start-item", `${npc.nativeId}:${startItem.sourceIndex ?? startIndex}`, npcPlacements.get(npc.nativeId) ?? [], [], { ownerEntityKey: entityKey("npcs", npc.nativeId), ownerLabel: npc.name, count: startItem.count, equipped: startItem.equipped, provenance });
  }
  const itemSources: ItemSource[] = canonical.value.items.map((row) => ({ itemKey: entityKey("items", row.nativeId), itemId: row.nativeId, sources: [...relations.itemIndex.get(row.nativeId)?.values() ?? []].sort((a, b) => `${a.sourceKind}:${a.sourceKey}`.localeCompare(`${b.sourceKind}:${b.sourceKey}`)).map((source) => ({ ...source, probability: null })) }));
  const rolesByPlacement = new Map<string, typeof roles>();
  for (const role of roles) { const rows = rolesByPlacement.get(role.placementId) ?? []; rows.push(role); rolesByPlacement.set(role.placementId, rows); }
  for (const placement of placements.placements) placement.roles = (rolesByPlacement.get(placement.placementId) ?? []).map((row) => ({ role: row.role, npcId: row.npcId, scope: row.scope, sourceIds: [row.sourceId] }));
  const patrolPaths = collectPatrolPaths(contexts, blockers);
  const coverageOccurrences: NormalizedDatabaseInput["coverageOccurrences"] = [];
  for (const source of admitted.sources) {
    if (source.kind === "target-envelope") {
      const envelope = decodeContract(ScanTargetEnvelopeSchema, source.value, { objectId: source.reference.sha256, target: source.key });
      const issues = envelope.diagnostics.map((diagnostic, index) => ({ code: diagnostic.code, detail: diagnostic.message, recordPath: `/diagnostics/${index}` }));
      if (envelope.outcome !== "succeeded") issues.push({ code: `target-${envelope.outcome}`, detail: `Target ${envelope.targetIdentity} has outcome ${envelope.outcome}; native proof is incomplete.`, recordPath: "/outcome" });
      for (const issue of issues) {
        const kind = `source-target-${issue.code}`, subjectKey = envelope.targetIdentity;
        blockers.push({ kind, key: subjectKey, detail: issue.detail, provenance: [pointer(source.reference, issue.recordPath)] });
        for (const origin of source.origins) coverageOccurrences.push({ runId: origin.runId, kind, subjectKey, semanticDiscriminator: "", artifactHash: source.reference.sha256, sourceKey: origin.targetIdentity, recordPath: issue.recordPath, evidence: issue });
      }
    } else if (source.kind === "compendium.coverage.v2") {
      const ledger = decodeContract(CoverageLedgerSchema, source.value, { objectId: source.reference.sha256, target: source.key });
      if (ledger.buildId !== plan.buildId || ledger.runId !== source.runId) throw new Error("Coverage ledger source lineage differs from its admitted target.");
      for (const [index, diagnostic] of ledger.diagnostics.entries()) {
        if (diagnostic.category === "unset") continue;
        const kind = `source-coverage-${diagnostic.category}`, subjectKey = `${diagnostic.sourceKey}:${diagnostic.issueType}`;
        blockers.push({ kind, key: subjectKey, detail: diagnostic.details.map((row) => row.detail).join("; "), provenance: [pointer(source.reference, `/diagnostics/${index}`)] });
        for (const recordPath of diagnostic.sourceEntryIds.length ? diagnostic.sourceEntryIds : [`/diagnostics/${index}`]) coverageOccurrences.push({ runId: source.runId, kind, subjectKey, semanticDiscriminator: "", artifactHash: source.reference.sha256, sourceKey: diagnostic.sourceKey, recordPath, evidence: diagnostic });
      }
    } else if (source.kind === "compendium.scan-coverage.v1") {
      const coverage = decodeContract(ScanCoverageSchema, source.value, { objectId: source.reference.sha256, target: source.key });
      for (const [index, issue] of coverage.issues.entries()) {
        const kind = `source-coverage-${issue.collector}`, subjectKey = `${source.targetIdentity}:${issue.recordPath}`;
        blockers.push({ kind, key: subjectKey, detail: issue.detail, provenance: [pointer(source.reference, `/issues/${index}`)] });
        for (const origin of source.origins) coverageOccurrences.push({ runId: origin.runId, kind, subjectKey, semanticDiscriminator: "", artifactHash: source.reference.sha256, sourceKey: origin.targetIdentity, recordPath: `/issues/${index}`, evidence: issue });
      }
    }
  }
  const sceneSpawns: NormalizedSceneSpawn[] = [];
  const positions = new Map(canonical.value.worldPositions.map((row, index) => [row.nativeId, { row, index }]));
  for (const scene of canonical.value.scenes) {
    const startPositionId = gameplay.get(entityKey("scenes", scene.nativeId))?.startPositionId;
    if (startPositionId === undefined || startPositionId < 0) continue;
    const position = positions.get(startPositionId);
    if (!position) { blockers.push({ kind: "missing-reference", key: `scene-spawn:${scene.nativeId}:${startPositionId}`, detail: `Scene arrival references missing world position ${startPositionId}.`, provenance: [pointer(canonical.reference, `/scenes/${canonical.value.scenes.indexOf(scene)}/gameplay/startPositionId`)] }); continue; }
    sceneSpawns.push({ sceneNativeId: scene.nativeId, startPositionId, position: position.row.position });
  }
  const uniqueConditions = mergeEvidence(meaningfulConditions, (row) => row.conditionId, (row) => ({ ...row, sourceFieldPath: null, payload: conditionSemanticPayload(row.payload), provenance: [] }));
  const factRows = collectTypedFacts(admitted, entities, bindings, uniqueConditions, blockers);
  const recipeProductKeys = new Set(factRows.recipeProducts.flatMap((row) => row.item.entityKey === null ? [] : [row.item.entityKey]));
  const entitiesByKey = new Map(entities.map((row) => [row.entityKey, row]));
  for (const item of itemSources) if (item.sources.length === 0 && !recipeProductKeys.has(item.itemKey)) {
    const entity = entitiesByKey.get(item.itemKey)!;
    blockers.push({ kind: "unmodeled-item-source", key: item.itemKey, detail: `No admitted merchant, loot, container, resource, quest, NPC starter-inventory, or recipe-product relation exists for ${entity.name ?? item.itemKey}. Class and race starting gear and other acquisition paths are not projected by the admitted evidence.`, provenance: entity.provenance });
  }
  const resourceYields = [...relations.resourceYields, ...mergeEvidence(worlds.resourceYields, (row) => row.yieldId)];
  const questAssociations = mergeEvidence([...relations.questAssociations, ...worlds.questAssociations], (row) => row.associationId);
  worlds.transitions = mergeEvidence(worlds.transitions, (row) => row.transitionId);
  const details = entityDetails(entities, roles, itemSources, uniqueConditions, { ...relations, resourceYields, questAssociations, transitions: worlds.transitions });
  const sceneRows = new Map<number, { nativeId: number; path: string; name: string | null }>();
  for (const scene of canonical.value.scenes) if (scene.internalName || scene.name) sceneRows.set(scene.nativeId, { nativeId: scene.nativeId, path: scene.internalName || scene.name!, name: scene.name });
  for (const binding of bindings) sceneRows.set(binding.sceneNativeId, { nativeId: binding.sceneNativeId, path: binding.scenePath, name: canonical.value.scenes.find((row) => row.nativeId === binding.sceneNativeId)?.name ?? null });
  for (const context of contexts) sceneRows.set(context.sceneNativeId, { nativeId: context.sceneNativeId, path: context.scenePath, name: sceneRows.get(context.sceneNativeId)?.name ?? null });
  const derivations: CatalogDerivation[] = [];
  const add = (factKind: string, factKey: string, inputs: ProvenanceReference[]) => derivations.push({ factKind, factKey, rule: `afallon.${factKind}`, version: 1, inputs: [...new Map(inputs.map((row) => [`${row.sha256}:${row.pointer ?? ""}`, row])).values()] });
  for (const entity of entities) add("canonical-entity", entity.entityKey, entity.provenance);
  for (const placement of placements.placements) add("placement", placement.placementId, placement.provenance);
  for (const row of regions) add("region", row.regionId, row.provenance);
  for (const row of uniqueConditions) add("condition", row.conditionId, row.provenance);
  for (const row of spawn.candidates) add("spawn-candidate", `${row.sourceId}:${row.candidateIndex}`, row.provenance);
  for (const item of itemSources) for (const row of item.sources) add("item-source", `${item.itemKey}:${row.sourceKind}:${row.sourceKey}`, [canonical.reference, relationships.reference, lootRules.reference, ...contexts.flatMap((context) => [context.identityReference, context.roleReference, context.npcReference, context.worldReference])]);
  for (const row of details) add("entity-detail", row.entityKey, [canonical.reference, relationships.reference, lootRules.reference, ...contexts.map((context) => context.roleReference)]);
  for (const row of worlds.transitions) add("transition", row.transitionId, row.provenance);
  for (const row of questAssociations) add("quest-association", row.associationId, row.provenance);
  for (const row of resourceYields) add("resource-yield", row.yieldId, row.provenance);
  for (const row of patrolPaths) add("patrol-path", hashRelation("patrol", [row.sceneNativeId, row.name, row.worldPoints]), row.provenance);
  for (const row of sceneSpawns) add("scene-arrival", String(row.sceneNativeId), [pointer(canonical.reference, `/scenes/${canonical.value.scenes.findIndex((scene) => scene.nativeId === row.sceneNativeId)}`), pointer(canonical.reference, `/worldPositions/${positions.get(row.startPositionId)!.index}`)]);
  const derivationIndex = new Map<string, CatalogDerivation>();
  for (const derivation of derivations) {
    const key = `${derivation.factKind}:${derivation.factKey}`;
    const previous = derivationIndex.get(key);
    if (previous) previous.inputs = [...new Map([...previous.inputs, ...derivation.inputs].map((reference) => [`${reference.sha256}:${reference.pointer ?? ""}`, reference])).values()];
    else derivationIndex.set(key, derivation);
  }
  const documents = new Map(admitted.sources.filter((source) => source.value !== null).map((source) => [source.reference.sha256, source.value]));
  const checkedPointers = new Set<string>();
  for (const derivation of derivationIndex.values()) for (const reference of derivation.inputs) {
    const key = `${reference.sha256}:${reference.pointer ?? ""}`;
    if (checkedPointers.has(key)) continue;
    if (!documents.has(reference.sha256)) throw new Error(`Derivation ${derivation.factKind}:${derivation.factKey} references unadmitted evidence ${reference.sha256}.`);
    assertEvidencePointer(documents.get(reference.sha256), reference.pointer ?? "", key);
    checkedPointers.add(key);
  }
  const fallbackEvidence = [canonical.reference, relationships.reference, profileReference, ...contexts.map((context) => context.roleReference)];
  for (const blocker of blockers) if (blocker.provenance.length === 0) blocker.provenance = fallbackEvidence;
  const sourceRunIds = Object.fromEntries(admitted.sources.map((source) => [source.reference.sha256, [...new Set(source.origins.map((origin) => origin.runId))]]));
  const sourceRunId = contexts[0]?.snapshotRunId;
  if (!sourceRunId) throw new Error("Catalog has no admitted observation context.");
  return { buildId: plan.buildId, sourceRunId, sourceRunIds, derivations: [...derivationIndex.values()], imagery: admitted.imagery.map(({ reference, document }) => ({ assetId: `${document.layer.mapSpaceId}:${document.layer.id}`, mapSpaceId: document.layer.mapSpaceId, kind: document.layer.kind, sha256: reference.sha256, bytes: reference.bytes, metadata: document.layer, provenance: [evidenceReference(reference)] })), ...factRows, identityResults: contexts.map((context) => ({ runId: context.snapshotRunId, snapshotId: context.snapshotId, snapshotPrefix: context.snapshotPrefix, snapshotSha256: context.snapshotReference.sha256, character: context.character, sceneHandle: context.sceneHandle, result: context.identityResult })), entities, scenes: [...sceneRows.values()], mapSpaces: profile.mapSpaces, bindings, placements: placements.placements, sources: placements.sources, roles, regions, conditions: uniqueConditions, spawnCandidates: mergeEvidence(spawn.candidates, (row) => `${row.sourceId}:${row.candidateIndex}`), merchantTables: relations.merchantTables, merchantBindings: relations.merchantBindings, merchantStock: relations.merchantStock, lootTables: relations.lootTables, lootBindings: relations.lootBindings, lootEntries: relations.lootEntries, linkedNpcRules: relations.linkedNpcRules, resourceYields, questAssociations, transitions: worlds.transitions, itemSources, entityDetails: details, sourceDetails: sourceDetails(contexts), patrolPaths, sceneSpawns, blockers: [...new Map(blockers.map((row) => [`${row.kind}:${row.key}`, row])).values()], coverageOccurrences, exclusions: [...new Map(exclusions.map((row) => [row.key, row])).values()], inputCoverage: null, provenance: { plan: planReference, profile: profileReference, sources: admitted.sources.map((source) => source.reference) } };
}
