import type { WorldSources } from "@afallon/contracts";
import type { ArtifactReference, NormalizedCondition, NormalizedSourceDetail, ProvenanceReference } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
import { pointer, type SceneContext, type SourceIdentityRow, type Blocker } from "./context";
import { addSourceIndex, type ItemSourceAccumulator, type RelationData } from "./relations";

export interface WorldRelationData {
  resourceYields: Array<Record<string, unknown> & { yieldId: string; itemID: number; sourceId: string; provenance: ProvenanceReference[] }>;
  transitions: Array<Record<string, unknown> & { transitionId: string; sourceId: string | null; sourceSceneNativeId: number; destinationSceneNativeId: number | null; destinationMapSpaceId: string | null; transitionKind: string; provenance: ProvenanceReference[] }>;
  questAssociations: Array<Record<string, unknown> & { associationId: string; associationKind: string; provenance: ProvenanceReference[] }>;
}
type WorldSource = WorldSources["transitions"][number]["source"];
type LootEntry = RelationData["lootEntries"][number];

export function worldRelations(contexts: readonly SceneContext[], sourcePlacement: ReadonlyMap<string, string>, lootEntries: readonly LootEntry[], conditions: readonly NormalizedCondition[], itemIndex: Map<number, Map<string, ItemSourceAccumulator>>, blockers: Blocker[]): WorldRelationData {
  const resourceYields: WorldRelationData["resourceYields"] = [], transitions: WorldRelationData["transitions"] = [], questAssociations: WorldRelationData["questAssociations"] = [];
  const entriesByTable = new Map<number, LootEntry[]>();
  for (const entry of lootEntries) { const rows = entriesByTable.get(entry.lootTableID) ?? []; rows.push(entry); entriesByTable.set(entry.lootTableID, rows); }
  const sourceConditions = new Map<string, string[]>();
  for (const condition of conditions) { const ids = sourceConditions.get(condition.ownerKey) ?? []; ids.push(condition.conditionId); sourceConditions.set(condition.ownerKey, ids); }
  for (const context of contexts) {
    const identityFor = (source: WorldSource) => source.componentInstanceId === null ? undefined : context.sourceByComponent.get(source.componentInstanceId);
    const conditionIds = (identity: SourceIdentityRow) => sourceConditions.get(`source:${identity.sourceId}`) ?? [];
    const placementIds = (identity: SourceIdentityRow) => { const placement = sourcePlacement.get(identity.sourceId); return placement ? [placement] : []; };
    function tableOutputs(identity: SourceIdentityRow, tableId: number, sourceKey: string, reference: ArtifactReference, sourceKind: "resource" | "container", details: Record<string, unknown>) {
      const entries = entriesByTable.get(tableId);
      if (!entries) { blockers.push({ kind: "missing-reference", key: `${identity.sourceId}:lootTables:${tableId}`, detail: `World output references an unavailable loot table ${tableId}.`, provenance: [reference] }); return; }
      for (const entry of entries) {
        const provenance = [reference, ...entry.provenance, pointer(context.identityReference, `/identities/${identity.identityIndex}`)];
        const yieldId = hashRelation(`${sourceKind}-output`, [identity.sourceId, sourceKey, tableId, entry.entryIndex]);
        if (sourceKind === "resource") resourceYields.push({ yieldId, sourceId: identity.sourceId, itemID: entry.itemID, resourceID: null, rank: null, min: entry.min, max: entry.max, lootTableID: tableId, rawRate: entry.dropRate, provenance, ...details });
        addSourceIndex(itemIndex, entry.itemID, sourceKind, yieldId, placementIds(identity), conditionIds(identity), { lootTableId: tableId, min: entry.min, max: entry.max, rawRate: entry.dropRate, probability: null, provenance, ...details });
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
      if ("lootInstances" in container.projection) for (const [entryIndex, entry] of container.projection.lootInstances.entries()) {
        if ("unavailable" in entry) { blockers.push({ kind: "unavailable-container-entry", key: `${identity.sourceId}:${entryIndex}`, detail: entry.unavailable, provenance: [pointer(reference, `/projection/lootInstances/${entryIndex}`)] }); continue; }
        const sourceKey = hashRelation("container-output", [identity.sourceId, entryIndex, entry.itemID]);
        addSourceIndex(itemIndex, entry.itemID, "container", sourceKey, placementIds(identity), conditionIds(identity), { min: entry.minCount, max: entry.maxCount, rawRate: entry.dropChance, maxDrops: container.projection.maxDrops, provenance: [pointer(reference, `/projection/lootInstances/${entryIndex}`), pointer(context.identityReference, `/identities/${identity.identityIndex}`)] });
      } else for (const [tableIndex, row] of container.projection.containerTablesData.entries()) if (!("unavailable" in row) && row.lootTableID !== null) tableOutputs(identity, row.lootTableID, `node:${tableIndex}`, pointer(reference, `/projection/containerTablesData/${tableIndex}`), "container", { authoredActionChance: row.chance });
    }
    for (const [index, zone] of context.world.questZones.entries()) {
      const identity = identityFor(zone.source), reference = pointer(context.worldReference, `/questZones/${index}`);
      if (zone.worldQuest) questAssociations.push({ associationId: hashRelation("world-quest-zone", [identity?.sourceId ?? context.snapshotId, zone.worldQuest.nativeId]), associationKind: "world-quest-zone", questID: zone.worldQuest.quest?.nativeId ?? null, sourceId: identity?.sourceId ?? null, payload: { worldQuest: zone.worldQuest, selectionRule: zone.selectionRule, zoneRespawnCooldown: zone.zoneRespawnCooldown }, provenance: [reference] });
      for (const [questIndex, candidate] of zone.possibleQuests.entries()) if (!("unavailable" in candidate)) questAssociations.push({ associationId: hashRelation("world-quest-zone-candidate", [identity?.sourceId ?? context.snapshotId, candidate.worldQuest.nativeId]), associationKind: "world-quest-zone-candidate", questID: candidate.worldQuest.quest?.nativeId ?? null, sourceId: identity?.sourceId ?? null, payload: candidate, selectionRule: zone.selectionRule, provenance: [pointer(reference, `/possibleQuests/${questIndex}`)] });
    }
    for (const [index, row] of context.world.transitions.entries()) {
      const identity = identityFor(row.source);
      const { source, ...authored } = row;
      transitions.push({ ...authored, transitionId: hashRelation("transition", [identity?.sourceId ?? context.snapshotId, row.transitionKind]), sourceId: identity?.sourceId ?? null, sourceSceneNativeId: context.sceneNativeId, destinationSceneNativeId: row.destinationScene?.nativeId ?? null, destinationMapSpaceId: null, transitionKind: row.transitionKind, provenance: [pointer(context.worldReference, `/transitions/${index}`)] });
    }
    for (const [index, interaction] of context.world.interactions.entries()) {
      if (!("actions" in interaction)) continue;
      const identity = identityFor(interaction.source);
      for (const [actionIndex, action] of interaction.actions.entries()) {
        if ("unavailable" in action) continue;
        const reference = pointer(context.worldReference, `/interactions/${index}/actions/${actionIndex}`);
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
  return { resourceYields, transitions, questAssociations };
}

export function sourceDetails(contexts: readonly SceneContext[]): NormalizedSourceDetail[] {
  const details: NormalizedSourceDetail[] = [];
  for (const context of contexts) {
    for (const collection of ["resourceProducers", "interactions", "containers", "services", "questZones", "transitions", "conditionSources", "mapIcons", "mapZones", "unsupportedSources"] as const) for (const row of context.world[collection]) {
      if (!("source" in row) || !row.source || row.source.componentInstanceId === null) continue;
      const identity = context.sourceByComponent.get(row.source.componentInstanceId);
      if (!identity) continue;
      const family = "family" in row ? row.family : "producerFamily" in row ? row.producerFamily : "transitionKind" in row ? row.transitionKind : collection === "mapIcons" ? "mapIcon" : collection;
      details.push({ sourceId: identity.sourceId, placementId: identity.placementId, family, data: row });
    }
    for (const [collection, family] of [["producers", "npcProducer"], ["adventurerProducers", "adventurerSpawnZone"], ["adventurerPopulationManagers", "adventurerPopulationManager"]] as const) for (const row of context.npc[collection]) {
      if ("unavailable" in row) continue;
      const identity = context.sourceByComponent.get(row.componentInstanceId);
      if (identity) details.push({ sourceId: identity.sourceId, placementId: identity.placementId, family, data: row });
    }
  }
  return details;
}
