import { CoverageLedgerSchema, ScanCoverageSchema, ScanTargetEnvelopeSchema, decodeContract, type Canonical } from "@afallon/contracts";
import { compileMapSpaces } from "@afallon/contracts/spatial";
import { entityKey, publicEntityDetails, stableJson, type ArtifactReference, type NormalizedDatabaseInput, type NormalizedEntity, type ItemSource, type NormalizedSceneSpawn, type ProvenanceReference, type CatalogDerivation } from "@afallon/contracts/catalog";
import { collectPlacements, collectRegions, attachShapes } from "./placements";
import { collectPatrolPaths, collectWorldConditions, conditionRowsFor, conditionSemanticPayload, producerRows } from "./conditions";
import { relationRows } from "./relations";
import { sourceDetails, worldRelations } from "./world";
import { entityDetails } from "./projections";
import { validateSupportedSemantics } from "./decoders";
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
  for (const kind of ["currencies", "tasks"] as const) for (const [index, row] of relationships.value[kind].entries()) entities.push({ entityKey: entityKey(kind, row.nativeId), buildId: plan.buildId, kind, nativeId: row.nativeId, ...publicEntityDetails(row), sourceKey: null, publicData: { localization: null, gameplay: null, icon: null }, provenance: [pointer(relationships.reference, `/${kind}/${index}`)] });
  entities.sort((a, b) => a.entityKey.localeCompare(b.entityKey));
  const knownEntities = new Set(entities.map((row) => row.entityKey));
  const roles = placements.roles.filter((role) => {
    if (role.npcId === null || knownEntities.has(entityKey("npcs", role.npcId))) return true;
    blockers.push({ kind: "missing-reference", key: `role:${role.placementId}:${role.role}:${role.npcId}`, detail: `Role references missing NPC ${role.npcId}.`, provenance: [] });
    return false;
  });
  const spawn = producerRows(contexts, blockers);
  for (const row of spawn.candidates) if (row.npcId !== null && !knownEntities.has(entityKey("npcs", row.npcId))) { blockers.push({ kind: "missing-reference", key: `spawn:${row.sourceId}:${row.candidateIndex}:${row.npcId}`, detail: `Spawn candidate references missing NPC ${row.npcId}.`, provenance: row.provenance }); row.npcId = null; }
  const relations = relationRows(relationships.value, canonical.value, lootRules.value, roles, knownEntities, gameplay, relationships.reference, lootRules.reference, blockers);
  const conditions = [...spawn.conditions, ...collectWorldConditions(contexts, blockers), ...relations.conditions];
  for (const kind of ["lootTables", "quests", "tasks", "resources"] as const) for (const [index, row] of relationships.value[kind].entries()) if ("nativeId" in row && typeof row.nativeId === "number") conditions.push(...conditionRowsFor("entity", entityKey(kind, row.nativeId), row, pointer(relationships.reference, `/${kind}/${index}`)));
  const worlds = worldRelations(contexts, placements.sourcePlacement, relations.lootEntries, conditions, relations.itemIndex, blockers);
  const bindingsByScene = new Map<number, Set<string>>();
  for (const binding of bindings) { const maps = bindingsByScene.get(binding.sceneNativeId) ?? new Set<string>(); maps.add(binding.mapSpaceId); bindingsByScene.set(binding.sceneNativeId, maps); }
  for (const transition of worlds.transitions) if (transition.destinationSceneNativeId !== null) {
    const destinations = bindingsByScene.get(transition.destinationSceneNativeId);
    if (destinations?.size === 1) transition.destinationMapSpaceId = [...destinations][0]!;
    if (!knownEntities.has(entityKey("scenes", transition.destinationSceneNativeId))) blockers.push({ kind: "missing-reference", key: `transition:${transition.transitionId}`, detail: `Transition references missing scene ${transition.destinationSceneNativeId}.`, provenance: transition.provenance });
  }
  const conditionsByOwner = new Map<string, string[]>();
  for (const condition of conditions) { const rows = conditionsByOwner.get(condition.ownerKey) ?? []; rows.push(condition.conditionId); conditionsByOwner.set(condition.ownerKey, rows); }
  for (const sources of relations.itemIndex.values()) for (const source of sources.values()) {
    const owners: string[] = [];
    if (Array.isArray(source.context.ownerEntityKeys)) for (const owner of source.context.ownerEntityKeys) if (typeof owner === "string") owners.push(owner);
    if (typeof source.context.lootTableId === "number") owners.push(entityKey("lootTables", source.context.lootTableId));
    if (typeof source.context.resourceId === "number") owners.push(entityKey("resources", source.context.resourceId));
    source.conditionIds = [...new Set([...source.conditionIds, ...owners.flatMap((owner) => conditionsByOwner.get(owner) ?? [])])].sort();
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
  const uniqueConditions = mergeEvidence(conditions, (row) => row.conditionId, (row) => ({ ...row, sourceFieldPath: null, payload: conditionSemanticPayload(row.payload), provenance: [] }));
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
  return { buildId: plan.buildId, sourceRunId, sourceRunIds, derivations: [...derivationIndex.values()], imagery: admitted.imagery.map(({ reference, document }) => ({ assetId: `${document.layer.mapSpaceId}:${document.layer.id}`, mapSpaceId: document.layer.mapSpaceId, kind: document.layer.kind, sha256: reference.sha256, bytes: reference.bytes, metadata: document.layer, provenance: [evidenceReference(reference)] })), identityResults: contexts.map((context) => ({ runId: context.snapshotRunId, snapshotId: context.snapshotId, snapshotPrefix: context.snapshotPrefix, snapshotSha256: context.snapshotReference.sha256, character: context.character, sceneHandle: context.sceneHandle, result: context.identityResult })), entities, scenes: [...sceneRows.values()], mapSpaces: profile.mapSpaces, bindings, placements: placements.placements, sources: placements.sources, roles, regions, conditions: uniqueConditions, spawnCandidates: mergeEvidence(spawn.candidates, (row) => `${row.sourceId}:${row.candidateIndex}`), merchantTables: relations.merchantTables, merchantBindings: relations.merchantBindings, merchantStock: relations.merchantStock, lootTables: relations.lootTables, lootBindings: relations.lootBindings, lootEntries: relations.lootEntries, linkedNpcRules: relations.linkedNpcRules, resourceYields, questAssociations, transitions: worlds.transitions, itemSources, entityDetails: details, sourceDetails: sourceDetails(contexts), patrolPaths, sceneSpawns, blockers: [...new Map(blockers.map((row) => [`${row.kind}:${row.key}`, row])).values()], coverageOccurrences, exclusions: [...new Map(exclusions.map((row) => [row.key, row])).values()], inputCoverage: null, provenance: { plan: planReference, profile: profileReference, sources: admitted.sources.map((source) => source.reference) } };
}
