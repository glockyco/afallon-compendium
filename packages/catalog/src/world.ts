import type { WorldSources } from "@afallon/contracts";
import type { ArtifactReference, NormalizedCondition, NormalizedRandomChoice, NormalizedSourceDetail, NormalizedWorldQuestFact, ProvenanceReference } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
import { pointer, type SceneContext, type SourceIdentityRow, type Blocker } from "./context";
import { addSourceIndex, type ItemSourceAccumulator, type RelationData } from "./relations";

export interface WorldRelationData {
  resourceYields: Array<Record<string, unknown> & { yieldId: string; itemID: number; sourceId: string; provenance: ProvenanceReference[] }>;
  transitions: Array<Record<string, unknown> & { transitionId: string; sourceId: string | null; sourceSceneNativeId: number; destinationSceneNativeId: number | null; destinationMapSpaceId: string | null; transitionKind: string; provenance: ProvenanceReference[] }>;
  questAssociations: Array<Record<string, unknown> & { associationId: string; associationKind: string; provenance: ProvenanceReference[] }>;
  /** One row per offering zone and context; normalization merges rows of the same quest and rejects conflicting timing. */
  worldQuestFacts: NormalizedWorldQuestFact[];
}

export function containerTypeFromHierarchyPath(path: string | null): string | null {
  if (path === null) return null;
  const segments = path.split("/").slice(0, -1).reverse();
  for (const segment of segments) {
    const name = segment.replace(/\[\d+\]$/, "").replace(/\s*\(\d+\)$/, "").replace(/\s+(?:loot|interactable|open)$/i, "").trim().toLowerCase();
    if (/backpack|supply pack/.test(name)) return "Backpack";
    if (/chest|coffer/.test(name)) return "Chest";
    if (/barrel/.test(name)) return "Barrel";
    if (/crate/.test(name)) return "Crate";
    if (/\b(?:bag|sack)\b/.test(name)) return "Bag";
    if (/\b(?:urn|cache|box)\b/.test(name)) return name[0]!.toUpperCase() + name.slice(1);
  }
  return null;
}

// The authored display name of an interactive object, which can carry rich-text markup; publication removes the
// markup with every other published name.
function objectNameOf(interaction: WorldSources["interactions"][number]): string | null {
  return "interactableName" in interaction && interaction.interactableName ? interaction.interactableName : null;
}

type WorldSource = WorldSources["transitions"][number]["source"];
type LootEntry = RelationData["lootEntries"][number];

export function worldRelations(contexts: readonly SceneContext[], sourcePlacement: ReadonlyMap<string, string>, lootEntries: readonly LootEntry[], conditions: readonly NormalizedCondition[], itemIndex: Map<number, Map<string, ItemSourceAccumulator>>, blockers: Blocker[]): WorldRelationData {
  const resourceYields: WorldRelationData["resourceYields"] = [], transitions: WorldRelationData["transitions"] = [], questAssociations: WorldRelationData["questAssociations"] = [];
  const worldQuestFacts: NormalizedWorldQuestFact[] = [];
  const entriesByTable = new Map<number, LootEntry[]>();
  for (const entry of lootEntries) { const rows = entriesByTable.get(entry.lootTableID) ?? []; rows.push(entry); entriesByTable.set(entry.lootTableID, rows); }
  const sourceConditions = new Map<string, string[]>();
  for (const condition of conditions) { const ids = sourceConditions.get(condition.ownerKey) ?? []; ids.push(condition.conditionId); sourceConditions.set(condition.ownerKey, ids); }
  for (const context of contexts) {
    const identityFor = (source: WorldSource) => source.componentInstanceId === null ? undefined : context.sourceByComponent.get(source.componentInstanceId);
    const conditionIds = (identity: SourceIdentityRow) => sourceConditions.get(`source:${identity.sourceId}`) ?? [];
    const placementIds = (identity: SourceIdentityRow) => { const placement = sourcePlacement.get(identity.sourceId); return placement ? [placement] : []; };
    function tableOutputs(identity: SourceIdentityRow, tableId: number, sourceKey: string, reference: ArtifactReference, sourceKind: "resource" | "container" | "interaction", details: Record<string, unknown>) {
      const entries = entriesByTable.get(tableId);
      if (!entries) { blockers.push({ kind: "missing-reference", key: `${identity.sourceId}:lootTables:${tableId}`, detail: `World output references an unavailable loot table ${tableId}.`, provenance: [reference] }); return; }
      for (const entry of entries) {
        const provenance = [reference, ...entry.provenance, pointer(context.identityReference, `/identities/${identity.identityIndex}`)];
        const yieldId = hashRelation(`${sourceKind}-output`, [identity.sourceId, sourceKey, tableId, entry.entryIndex]);
        if (sourceKind === "resource") resourceYields.push({ yieldId, sourceId: identity.sourceId, itemID: entry.itemID, resourceID: null, rank: null, min: entry.min, max: entry.max, lootTableID: tableId, rawRate: entry.dropRate, provenance, ...details });
        addSourceIndex(itemIndex, entry.itemID, sourceKind, yieldId, placementIds(identity), conditionIds(identity), { sourceId: identity.sourceId, lootTableId: tableId, min: entry.min, max: entry.max, rawRate: entry.dropRate, probability: null, provenance, ...details });
      }
    }
    for (const [index, producer] of context.world.resourceProducers.entries()) {
      const reference = pointer(context.worldReference, `/resourceProducers/${index}`);
      if ("unavailable" in producer) { blockers.push({ kind: "unavailable-resource", key: `${context.snapshotId}:${index}`, detail: producer.unavailable, provenance: [reference] }); continue; }
      const identity = identityFor(producer.source);
      if (!identity) { blockers.push({ kind: "unplaced-source", key: `${context.snapshotId}:resource:${index}`, detail: "Gathering producer has no verified source identity.", provenance: [reference] }); continue; }
      if ("options" in producer) {
        const options = new Map(producer.options.flatMap((row) => "unavailable" in row ? [] : [[row.optionIndex, row] as const]));
        if (!producer.possibleOutputsAvailable) blockers.push({ kind: "unavailable-resource-outputs", key: identity.sourceId, detail: "The authored gathering outputs are unavailable.", provenance: [reference] });
        for (const [outputIndex, wrapper] of producer.possibleOutputs.entries()) {
          const output = wrapper.output, option = options.get(wrapper.optionIndex);
          const outputReference = pointer(reference, `/possibleOutputs/${outputIndex}`);
          if (output.outputKind !== "lootTable" || output.lootTableID === undefined || output.lootTableID === null) { blockers.push({ kind: "unsupported-resource-output", key: `${identity.sourceId}:${outputIndex}`, detail: `Gathering output kind ${output.outputKind} has no supported loot-table relation.`, provenance: [outputReference] }); continue; }
          tableOutputs(identity, output.lootTableID, `${wrapper.optionIndex}:${output.sourceFieldPath}`, outputReference, "resource", { optionIndex: wrapper.optionIndex, gatheringSkillId: producer.gatheringSkillID, requiredSkill: option?.requiredSkill ?? null, weightAtLowSkill: option?.weightAtLowSkill ?? null, weightAtHighSkill: option?.weightAtHighSkill ?? null, teaserWeight: option?.teaserWeight ?? null, skillCap: producer.skillCap, respawnTime: producer.respawnTime, respawnJitter: producer.respawnJitter, authoredActionChance: output.authoredActionChance ?? null });
        }
      } else {
        for (const [tableIndex, row] of producer.projection.containerTablesData.entries()) if (!("unavailable" in row) && row.lootTableID !== null) tableOutputs(identity, row.lootTableID, `node:${tableIndex}`, pointer(reference, `/projection/containerTablesData/${tableIndex}`), "resource", { gatheringSkillId: producer.gatheringSkillID, authoredActionChance: row.chance });
      }
    }
    for (const [index, container] of context.world.containers.entries()) {
      if (!("projection" in container)) continue;
      const reference = pointer(context.worldReference, `/containers/${index}`), identity = identityFor(container.source);
      if (!identity) { blockers.push({ kind: "unplaced-source", key: `${context.snapshotId}:container:${index}`, detail: "Container has no verified source identity.", provenance: [reference] }); continue; }
      const containerType = containerTypeFromHierarchyPath(container.source.source.hierarchyPath);
      if (containerType === null) blockers.push({ kind: "unresolved-container-label", key: identity.sourceId, detail: "Container hierarchy has no readable prefab segment.", provenance: [reference] });
      const containerDetails = { sourceId: identity.sourceId, containerType };
      if ("lootInstances" in container.projection) for (const [entryIndex, entry] of container.projection.lootInstances.entries()) {
        if ("unavailable" in entry) { blockers.push({ kind: "unavailable-container-entry", key: `${identity.sourceId}:${entryIndex}`, detail: entry.unavailable, provenance: [pointer(reference, `/projection/lootInstances/${entryIndex}`)] }); continue; }
        const sourceKey = hashRelation("container-output", [identity.sourceId, entryIndex, entry.itemID]);
        addSourceIndex(itemIndex, entry.itemID, "container", sourceKey, placementIds(identity), conditionIds(identity), { ...containerDetails, min: entry.minCount, max: entry.maxCount, rawRate: entry.dropChance, maxDrops: container.projection.maxDrops, provenance: [pointer(reference, `/projection/lootInstances/${entryIndex}`), pointer(context.identityReference, `/identities/${identity.identityIndex}`)] });
      } else for (const [tableIndex, row] of container.projection.containerTablesData.entries()) if (!("unavailable" in row) && row.lootTableID !== null) tableOutputs(identity, row.lootTableID, `node:${tableIndex}`, pointer(reference, `/projection/containerTablesData/${tableIndex}`), "container", { ...containerDetails, authoredActionChance: row.chance });
    }
    for (const [index, zone] of context.world.questZones.entries()) {
      const identity = identityFor(zone.source), reference = pointer(context.worldReference, `/questZones/${index}`);
      if (!identity) continue;
      const pool = zone.possibleQuests.flatMap((row) => "unavailable" in row ? [] : [row.worldQuest]);
      const selected = pool.length ? pool : zone.worldQuest ? [zone.worldQuest] : [];
      const poolQuestIDs = [...new Set(selected.flatMap((row) => row.quest && row.quest.nativeId >= 0 ? [row.quest.nativeId] : []))].sort((a, b) => a - b);
      for (const worldQuest of selected) {
        const questID = worldQuest.quest?.nativeId;
        if (questID === undefined || questID < 0) continue;
        const key = `quests:${questID}`;
        questAssociations.push({ associationId: hashRelation("world-quest-offer", [identity.sourceId, worldQuest.nativeId]), associationKind: "world-quest-offer", questID, sourceId: identity.sourceId, payload: { worldQuest, zoneRespawnCooldown: zone.zoneRespawnCooldown, selection: pool.length ? "pool" : "single", poolQuestIDs }, provenance: [reference] });
        const { availableDuration, cooldownAfterCompletion, cooldownAfterExpiry, cooldownRandomJitter, initialRollWindow } = worldQuest;
        if ([availableDuration, cooldownAfterCompletion, cooldownAfterExpiry, cooldownRandomJitter, initialRollWindow].some((value) => value === undefined)) throw new Error(`Incomplete world quest timing for ${key}.`);
        worldQuestFacts.push({ entityKey: key, worldQuestNativeId: worldQuest.nativeId, availableSeconds: availableDuration!, cooldownAfterCompletionSeconds: cooldownAfterCompletion!, cooldownAfterExpirySeconds: cooldownAfterExpiry!, cooldownJitterSeconds: cooldownRandomJitter!, initialRollSeconds: initialRollWindow!, provenance: [reference] });
      }
    }
    for (const [index, row] of context.world.transitions.entries()) {
      const identity = identityFor(row.source);
      const { source, ...authored } = row;
      transitions.push({ ...authored, transitionId: hashRelation("transition", [identity?.sourceId ?? context.snapshotId, row.transitionKind]), sourceId: identity?.sourceId ?? null, sourceSceneNativeId: context.sceneNativeId, destinationSceneNativeId: row.destinationScene?.nativeId ?? null, destinationMapSpaceId: null, transitionKind: row.transitionKind, provenance: [pointer(context.worldReference, `/transitions/${index}`)] });
    }
    for (const [index, interaction] of context.world.interactions.entries()) {
      if (!("actions" in interaction)) continue;
      const identity = identityFor(interaction.source);
      const objectName = objectNameOf(interaction);
      for (const [actionIndex, action] of interaction.actions.entries()) {
        if ("unavailable" in action) continue;
        const reference = pointer(context.worldReference, `/interactions/${index}/actions/${actionIndex}`);
        // Quest starts, task completions, and loot need a placed source; teleports keep an unplaced source as coverage evidence.
        if (identity) {
          const payload = { objectName, activationType: action.activationType.name, chance: action.chance };
          if (action.type.name === "Quest" && action.quest?.nativeId !== undefined && action.quest.nativeId >= 0) questAssociations.push({ associationId: hashRelation("interaction-quest", [identity.sourceId, action.sourceFieldPath, action.quest.nativeId]), associationKind: "interaction-quest", questID: action.quest.nativeId, sourceId: identity.sourceId, payload, provenance: [reference] });
          if (action.type.name === "CompleteTask" && action.task?.nativeId !== undefined && action.task.nativeId >= 0) questAssociations.push({ associationId: hashRelation("interaction-task", [identity.sourceId, action.sourceFieldPath, action.task.nativeId]), associationKind: "interaction-task", taskID: action.task.nativeId, sourceId: identity.sourceId, payload, provenance: [reference] });
          if (action.type.name === "Chest" && action.lootTable?.nativeId !== undefined && action.lootTable.nativeId >= 0 && entriesByTable.has(action.lootTable.nativeId)) tableOutputs(identity, action.lootTable.nativeId, action.sourceFieldPath, reference, "interaction", { objectName, activationType: action.activationType.name, authoredActionChance: action.chance });
        }
        const addTeleport = (destination: { sceneNativeId: number; position: { x: number; y: number; z: number } }, kind: string, pointerReference: ArtifactReference) => transitions.push({ transitionId: hashRelation("action-teleport", [identity?.sourceId ?? context.snapshotId, destination, kind, action.sourceFieldPath]), sourceId: identity?.sourceId ?? null, sourceSceneNativeId: context.sceneNativeId, destinationSceneNativeId: destination.sceneNativeId < 0 ? context.sceneNativeId : destination.sceneNativeId, destinationMapSpaceId: null, transitionKind: kind, destinationPosition: destination.position, payload: { destination, authoredActionChance: action.chance, activationType: action.activationType }, provenance: [pointerReference] });
        if (action.effectTeleport) addTeleport(action.effectTeleport, "effect-teleport", pointer(reference, "/effectTeleport"));
        for (const [family, actions] of [["template", action.gameActions.template?.actions], ["inline", action.gameActions.inline.actions]] as const) {
          if (!actions) continue;
          for (const [nestedIndex, nested] of actions.entries()) {
            if ("unavailable" in nested) continue;
            if (nested.teleport) addTeleport(nested.teleport, "game-action-teleport", pointer(reference, `/gameActions/${family}/actions/${nestedIndex}/teleport`));
            if (nested.effectTeleport) addTeleport(nested.effectTeleport, "game-action-effect-teleport", pointer(reference, `/gameActions/${family}/actions/${nestedIndex}/effectTeleport`));
          }
        }
      }
    }
  }
  return { resourceYields, transitions, questAssociations, worldQuestFacts };
}

/** The authored RPGProperty fields that a for-sale sign reads from the property it sells. */
export interface SignPropertyFacts {
  propertyType: string | null;
  currencyId: number | null;
  purchasePrice: number | null;
  sellPrice: number | null;
  income: number | null;
  provenance: ProvenanceReference[];
}

// A PropertyForSaleSign holds a typed RPGProperty reference, and the scan reads the property's authored type, currency,
// prices, and income through it. Every sign of one property must agree, because they read one record.
export function signPropertyFacts(contexts: readonly SceneContext[]): Map<number, SignPropertyFacts> {
  const facts = new Map<number, SignPropertyFacts>();
  for (const context of contexts) for (const [index, row] of context.world.services.entries()) {
    if (row.family !== "propertyForSaleSign" || row.propertyReferenceStatus !== "resolved" || row.propertyID === null) continue;
    const value = { propertyType: row.propertyType.name, currencyId: row.currencyID, purchasePrice: row.purchasePrice, sellPrice: row.sellPrice, income: row.incomeAmount };
    const provenance = pointer(context.worldReference, `/services/${index}`), previous = facts.get(row.propertyID);
    if (previous) {
      const { provenance: known, ...fields } = previous;
      if (JSON.stringify(fields) !== JSON.stringify(value)) throw new Error(`For-sale signs of property ${row.propertyID} disagree on its authored fields.`);
      known.push(provenance);
    } else facts.set(row.propertyID, { ...value, provenance: [provenance] });
  }
  return facts;
}

// The RandomActivator choices of the scanned scenes. Each entry of a choice names the sources inside its target, so a
// placement can find the choices that can disable it. A repeated target keeps its own entry, which weights the pick.
export function randomChoices(contexts: readonly SceneContext[], blockers: Blocker[]): NormalizedRandomChoice[] {
  const choices = new Map<string, NormalizedRandomChoice>();
  for (const context of contexts) {
    const sources: Array<{ path: string; sourceId: string }> = [];
    for (const collection of ["resourceProducers", "interactions", "containers", "questZones", "transitions", "mapZones", "regions", "mapIcons", "services", "conditionSources", "unsupportedSources", "randomActivators"] as const) for (const row of context.world[collection]) {
      if (!("source" in row) || !row.source || row.source.componentInstanceId === null) continue;
      const identity = context.sourceByComponent.get(row.source.componentInstanceId), path = row.source.source.hierarchyPath;
      if (identity && path) sources.push({ path, sourceId: identity.sourceId });
    }
    for (const collection of ["producers", "adventurerProducers", "adventurerPopulationManagers"] as const) for (const row of context.npc[collection]) {
      if ("unavailable" in row) continue;
      const identity = context.sourceByComponent.get(row.componentInstanceId);
      if (identity && row.source.hierarchyPath) sources.push({ path: row.source.hierarchyPath, sourceId: identity.sourceId });
    }
    for (const [index, activator] of context.world.randomActivators.entries()) {
      if (activator.targetCount === -1) continue;
      const reference = pointer(context.worldReference, `/randomActivators/${index}`), component = activator.source.componentInstanceId;
      const identity = component === null ? undefined : context.sourceByComponent.get(component);
      if (!identity) {
        blockers.push({ kind: "unplaced-random-activator", key: `${context.snapshotId}:${index}`, detail: "Random activator has no verified source identity.", provenance: [reference] });
        continue;
      }
      // RandomActivator.Start removes the null entries of its list before it picks (build 25653798), so a scan sees them
      // only while Start has not run. The collector reports a null entry as unavailable, and the choice is made among the
      // other targets, each keeping its position in the authored list as provenance.
      const targets = activator.targets.flatMap((target, rawIndex) => "unavailable" in target ? [] : [{ target, rawIndex }]);
      const choiceId = identity.sourceId, previous = choices.get(choiceId);
      if (previous && (previous.numberToEnable !== activator.numberToEnable || previous.entries.length !== targets.length)) throw new Error(`Conflicting repeated random choice ${choiceId}.`);
      const choice = previous ?? { choiceId, numberToEnable: activator.numberToEnable, entries: [], provenance: [] };
      choice.provenance.push(reference);
      for (const [entryIndex, { target, rawIndex }] of targets.entries()) {
        const provenance = pointer(reference, `/targets/${rawIndex}`);
        const targetPath = target.source.source.hierarchyPath;
        if (!targetPath) blockers.push({ kind: "unresolved-random-target", key: `${choiceId}:${entryIndex}`, detail: "Random target has no hierarchy path.", provenance: [provenance] });
        const entry = choice.entries[entryIndex];
        if (entry && entry.targetPath !== targetPath) throw new Error(`Conflicting repeated random target ${choiceId}:${entryIndex}.`);
        const sourceIds = !targetPath ? [] : sources.filter((source) => source.path === targetPath || source.path.startsWith(`${targetPath}/`)).map((source) => source.sourceId);
        if (entry) {
          entry.sourceIds = [...new Set([...entry.sourceIds, ...sourceIds])].sort();
          entry.provenance.push(provenance);
        } else choice.entries.push({ entryIndex, targetPath, sourceIds: [...new Set(sourceIds)].sort(), provenance: [provenance] });
      }
      choices.set(choiceId, choice);
    }
  }
  return [...choices.values()].sort((a, b) => a.choiceId.localeCompare(b.choiceId));
}

export function sourceDetails(contexts: readonly SceneContext[], sourcePlacement: ReadonlyMap<string, string>): NormalizedSourceDetail[] {
  const details: NormalizedSourceDetail[] = [];
  for (const context of contexts) {
    for (const collection of ["resourceProducers", "interactions", "containers", "services", "questZones", "transitions", "conditionSources", "mapIcons", "mapZones", "unsupportedSources", "randomActivators"] as const) for (const row of context.world[collection]) {
      if (!("source" in row) || !row.source || row.source.componentInstanceId === null) continue;
      const identity = context.sourceByComponent.get(row.source.componentInstanceId);
      if (!identity) continue;
      const family = "family" in row ? row.family : "producerFamily" in row ? row.producerFamily : "transitionKind" in row ? row.transitionKind : collection === "mapIcons" ? "mapIcon" : collection;
      details.push({ sourceId: identity.sourceId, placementId: sourcePlacement.get(identity.sourceId) ?? identity.placementId, family, data: row });
    }
    for (const [collection, family] of [["producers", "npcProducer"], ["adventurerProducers", "adventurerSpawnZone"], ["adventurerPopulationManagers", "adventurerPopulationManager"]] as const) for (const row of context.npc[collection]) {
      if ("unavailable" in row) continue;
      const identity = context.sourceByComponent.get(row.componentInstanceId);
      if (identity) details.push({ sourceId: identity.sourceId, placementId: sourcePlacement.get(identity.sourceId) ?? identity.placementId, family, data: row });
    }
  }
  return details;
}
