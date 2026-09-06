import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert, AssertError } from "typebox/value";
import type { Static, TSchema } from "typebox";
import { buildIdentity, hashFile, toolRevision } from "./build";
import type { CompendiumConfig } from "./config";
import { CanonicalSchema, LocalizationSchema, LootRulesSchema, RelationshipsSchema, SupportSchema, WorldInventorySchema, canonicalKinds } from "./contracts";
import { beginRun } from "./runs";
import type { Runtime } from "./runtime";

function parseArtifact<T extends TSchema>(schema: T, value: unknown): Static<T> {
  try {
    Assert(schema, value);
    return value;
  } catch (error) {
    if (error instanceof AssertError) throw new Error("Extraction artifact does not match its schema.", { cause: error.cause.errors });
    throw error;
  }
}

export async function extract(runtime: Runtime, config: CompendiumConfig, identity: Awaited<ReturnType<typeof buildIdentity>>) {
  const names = ["canonical", "localization", "support", "relationships", "loot-rules", "world-inventory"] as const;
  const prelude = resolve(import.meta.dir, "probes/conditions.csx");
  const inputHashes: Record<string, string> = { ...identity.inputHashes, conditions: await hashFile(prelude) };
  for (const name of names) inputHashes[name] = await hashFile(resolve(import.meta.dir, `probes/${name}.csx`));
  const run = await beginRun(config.outputRoot, {
    ...identity, inputHashes, toolRevision: await toolRevision(), command: "extract",
    settings: { character: config.character, timeoutMs: config.timeoutMs, scope: "canonical records, authored relationships, and loaded world inventory; not full world coverage" },
  });
  try {
    await mkdir(resolve(run.directory, "raw"));
    const raw: Partial<Record<(typeof names)[number], unknown>> = {};
    for (const name of names) {
      const result = await runtime.probe(resolve(import.meta.dir, `probes/${name}.csx`), resolve(run.directory, `raw/${name}.json`), {
        preludeFile: name === "relationships" ? prelude : undefined,
        parameters: { researchCharacter: config.character },
      });
      const artifact = await run.addArtifact(`raw/${name}.json`);
      if (artifact.sha256 !== result.reference.sha256) throw new Error(`The ${name} artifact changed before registration.`);
      raw[name] = result.value;
    }
    const canonical = parseArtifact(CanonicalSchema, raw.canonical);
    const localization = parseArtifact(LocalizationSchema, raw.localization);
    const support = parseArtifact(SupportSchema, raw.support);
    const relationships = parseArtifact(RelationshipsSchema, raw.relationships);
    const lootRules = parseArtifact(LootRulesSchema, raw["loot-rules"]);
    const worldInventory = parseArtifact(WorldInventorySchema, raw["world-inventory"]);
    for (const [kind, count] of Object.entries(worldInventory.sourceTotals)) {
      if (count < 0 || count !== worldInventory.exportedTotals[kind]) throw new Error(`World inventory counts do not reconcile for ${kind}.`);
    }
    const inventoryRows = {
      buildScenes: worldInventory.buildScenes, databaseScenes: worldInventory.databaseScenes,
      loadedScenes: worldInventory.loadedScenes, addressableSources: worldInventory.addressableSources,
      loadedTransitions: worldInventory.transitions, referencedDestinations: worldInventory.referencedDestinations,
      componentFamilies: worldInventory.componentFamilies, behaviourTypes: worldInventory.behaviourTypes,
    };
    for (const [kind, rows] of Object.entries(inventoryRows)) {
      if (rows.length !== worldInventory.sourceTotals[kind]) throw new Error(`World inventory lost ${kind} rows.`);
    }
    for (const rows of [worldInventory.componentFamilies, worldInventory.behaviourTypes]) {
      for (const row of rows) {
        if (row.activeCount < 0 || row.includeInactiveCount < row.activeCount) throw new Error("World inventory component counts are invalid.");
      }
    }
    if (worldInventory.behaviourTypes.reduce((sum, row) => sum + row.includeInactiveCount, 0) !== worldInventory.sourceTotals.behaviourComponents) throw new Error("World inventory lost behavior components.");
    const inventorySceneIds = new Set(worldInventory.databaseScenes.map(row => row.nativeId));
    if (inventorySceneIds.size !== canonical.scenes.length || worldInventory.databaseScenes.length !== canonical.scenes.length || canonical.scenes.some(row => !inventorySceneIds.has(row.nativeId))) throw new Error("World inventory scenes differ from the canonical snapshot.");
    const ids: Record<string, Set<number>> = {};
    for (const kind of canonicalKinds) {
      const rows = canonical[kind];
      if (rows.length !== canonical.sourceTotals[kind] || rows.length !== canonical.exportedTotals[kind]) throw new Error(`${kind} counts do not reconcile.`);
      ids[kind] = new Set();
      for (const row of rows) {
        if (row.nativeId < 0 || row.nativeId !== row.sourceKey || ids[kind].has(row.nativeId)) throw new Error(`Invalid or duplicate ${kind} identity: ${row.nativeId}`);
        ids[kind].add(row.nativeId);
      }
    }
    for (const [kind, rows] of Object.entries(support.tables)) {
      if (rows.length !== support.sourceTotals[kind]) throw new Error(`${kind} supporting counts do not reconcile.`);
      const keys = new Set<number>();
      for (const row of rows) {
        if (row.entry.nativeId !== row.sourceKey || keys.has(row.entry.nativeId)) throw new Error(`Invalid supporting ${kind} identity: ${row.entry.nativeId}`);
        keys.add(row.entry.nativeId);
      }
      ids[kind] = keys;
    }
    ids.merchantTables = new Set(relationships.merchantTables.map(row => row.nativeId));
    if (localization.entries.length !== localization.sourceCount || new Set(localization.entries.map(row => row.key)).size !== localization.sourceCount) throw new Error("Localization counts or keys do not reconcile.");
    if (canonical.localization.language !== localization.language || support.language !== localization.language) throw new Error("Extraction language changed between probes.");
    const unresolved: { source: string; targetKind: string; nativeId: number }[] = [];
    const unset: { source: string; targetKind: string; nativeId: number }[] = [];
    let checkedReferences = 0;
    const reference = (source: string, targetKind: string, nativeId: number) => {
      checkedReferences++;
      if (nativeId < 0) unset.push({ source, targetKind, nativeId });
      else if (!ids[targetKind]?.has(nativeId)) unresolved.push({ source, targetKind, nativeId });
    };
    for (const row of relationships.merchantBindings) {
      reference(`npc:${row.ownerNativeId}.merchant[${row.bindingIndex}]`, "npcs", row.ownerNativeId);
      reference(`npc:${row.ownerNativeId}.merchant[${row.bindingIndex}]`, "merchantTables", row.merchantTableID);
    }
    for (const row of relationships.merchantStock) {
      const source = `merchant:${row.merchantTableID}.stock[${row.stockIndex}]`;
      reference(source, "merchantTables", row.merchantTableID);
      reference(source, "items", row.itemID);
      reference(source, "currencies", row.currencyID);
    }
    for (const row of relationships.npcLootBindings) {
      const source = `npc:${row.ownerNativeId}.loot[${row.bindingIndex}]`;
      reference(source, "npcs", row.ownerNativeId);
      reference(source, "lootTables", row.lootTableID);
    }
    const quantityDiagnostics: { source: string; authoredMinimum: number; authoredMaximum: number; resolved: false }[] = [];
    for (const row of relationships.lootEntries) {
      const source = `loot:${row.lootTableID}.entry[${row.entryIndex}]`;
      reference(source, "lootTables", row.lootTableID);
      reference(source, "items", row.itemID);
      if (row.min > row.max) quantityDiagnostics.push({ source, authoredMinimum: row.min, authoredMaximum: row.max, resolved: false });
    }
    for (const row of relationships.npcQuestBindings) {
      const source = `npc:${row.ownerNativeId}.${row.association}[${row.associationIndex}]`;
      reference(source, "npcs", row.ownerNativeId);
      reference(source, "quests", row.questID);
    }
    for (const row of relationships.questObjectives) {
      const source = `quest:${row.questID}.objective[${row.objectiveIndex}]`;
      reference(source, "quests", row.questID);
      reference(source, "tasks", row.taskID);
    }
    for (const row of relationships.questItemsGiven) {
      reference(`quest:${row.questID}.itemsGiven`, "quests", row.questID);
      reference(`quest:${row.questID}.itemsGiven`, "items", row.itemID);
    }
    for (const row of relationships.questRewards) {
      reference(`quest:${row.questID}.reward`, "quests", row.questID);
      if (row.rewardType === "item") reference(`quest:${row.questID}.reward`, "items", row.itemID);
      if (row.rewardType === "currency") reference(`quest:${row.questID}.reward`, "currencies", row.currencyID);
    }
    for (const row of lootRules.linkedNpcs) {
      if (row.hasLinkedNpc) reference(`npc:${row.npcId}.linkedNpc`, "npcs", row.authoredLinkedNpcId);
      if (row.resolvedLootSpecNpcId !== null) reference(`npc:${row.npcId}.lootSpecialization`, "npcs", row.resolvedLootSpecNpcId);
    }
    for (const table of lootRules.dynamicTables) {
      reference(`dynamicLoot:${table.tableId}`, "lootTables", table.tableId);
      if (table.entries.length !== table.sourceEntryCount) throw new Error(`Dynamic loot table ${table.tableId} lost an entry.`);
      for (const row of table.entries) reference(`dynamicLoot:${table.tableId}.entry[${row.entryIndex}]`, "items", row.itemId);
    }
    const validation = {
      schemaVersion: "compendium.extraction-validation.v1", buildId: identity.buildId,
      fullGameCoverage: false, canonicalTotals: canonical.exportedTotals, supportTotals: support.sourceTotals,
      localization: { language: localization.language, entries: localization.sourceCount },
      checkedReferences, unresolved, unset, quantityDiagnostics,
      blankDisplayNames: canonicalKinds.flatMap(kind => canonical[kind].filter(row => !row.name?.trim()).map(row => ({ kind, nativeId: row.nativeId, internalName: row.internalName }))),
      relationshipDiagnostics: relationships.unresolved,
      lootRuleVerification: lootRules.observation,
      worldInventory: { totals: worldInventory.sourceTotals, coverage: worldInventory.coverage, diagnostics: worldInventory.unresolved },
    };
    await Bun.write(resolve(run.directory, "validation.json"), `${JSON.stringify(validation, null, 2)}\n`);
    await run.addArtifact("validation.json");
    await run.succeed();
    return { manifest: run.manifestPath, validation };
  } catch (error) {
    await run.fail(error);
    console.error(`Failed extraction: ${run.manifestPath}`);
    throw error;
  }
}
