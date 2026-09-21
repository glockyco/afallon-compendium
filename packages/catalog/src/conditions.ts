import type { ArtifactReference, NormalizedCondition, NormalizedSpawnCandidate, NormalizedPatrolPath } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
import { pointer, type SceneContext, type Blocker } from "./context";

export function conditionSemanticPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(conditionSemanticPayload);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "sourceFieldPath").map(([key, child]) => [key, conditionSemanticPayload(child)]));
}

const equipmentRequirementTypes = new Set(["Level", "Class", "Race", "Gender", "Species"]);
const useRequirementTypes = new Set(["Effect", "Item", "Region", "CombatState", "Stealth", "Mounted", "Grounded", "Time"]);

export function classifyItemCondition(payload: unknown): { scope: "equipment" | "use" | null; requirementTypes: string[] } {
  if (payload === null || typeof payload !== "object") return { scope: null, requirementTypes: [] };
  const root = payload as Record<string, unknown>;
  const groups = Array.isArray(root.groups) ? root.groups : Array.isArray(root.requirements) ? [{ requirements: root.requirements }] : [];
  const requirementTypes = [...new Set(groups.flatMap((group) => {
    if (group === null || typeof group !== "object") return [];
    const requirements = (group as Record<string, unknown>).requirements;
    if (!Array.isArray(requirements)) return [];
    return requirements.flatMap((requirement) => requirement !== null && typeof requirement === "object" && typeof (requirement as Record<string, unknown>).requirementType === "string" ? [(requirement as Record<string, unknown>).requirementType as string] : []);
  }))].sort();
  if (requirementTypes.length === 0) return { scope: null, requirementTypes };
  if (requirementTypes.every((type) => equipmentRequirementTypes.has(type))) return { scope: "equipment", requirementTypes };
  if (requirementTypes.every((type) => useRequirementTypes.has(type))) return { scope: "use", requirementTypes };
  return { scope: null, requirementTypes };
}

export function conditionFrom(ownerType: string, ownerKey: string, payload: unknown, semantics: string, sourceFieldPath: string | null, provenance: ArtifactReference[]): NormalizedCondition {
  return { conditionId: hashRelation("condition", [ownerType, ownerKey, 0, conditionSemanticPayload(payload)]), ownerType, ownerKey, ordinal: 0, semantics, scope: null, sourceFieldPath, payload, provenance };
}

export function conditionRowsFor(ownerType: string, ownerKey: string, raw: object, provenance: ArtifactReference): NormalizedCondition[] {
  const rows: NormalizedCondition[] = [];
  for (const [field, semantics] of [["requirementsTemplate", "requirements-template"], ["inlineRequirements", "inline-requirements"], ["inlineRequirementGroups", "inline-requirements"], ["activationRequirement", "activation-requirement"], ["activationRequirements", "activation-requirements"], ["deactivationRequirements", "deactivation-requirements"], ["requirements", "requirements"], ["requirementGroups", "requirements"]] as const) {
    const payload: unknown = Reflect.get(raw, field);
    if (payload === undefined || payload === null) continue;
    const ordinal = rows.length;
    const sourceFieldPath = payload !== null && typeof payload === "object" && "sourceFieldPath" in payload && typeof payload.sourceFieldPath === "string" ? payload.sourceFieldPath : null;
    rows.push({ conditionId: hashRelation("condition", [ownerType, ownerKey, ordinal, conditionSemanticPayload(payload)]), ownerType, ownerKey, ordinal, semantics, scope: null, sourceFieldPath, payload, provenance: [pointer(provenance, `/${field}`)] });
  }
  return rows;
}

export function producerRows(contexts: readonly SceneContext[], blockers: Blocker[]) {
  const conditions: NormalizedCondition[] = [], candidates: NormalizedSpawnCandidate[] = [];
  for (const context of contexts) for (const [index, row] of context.npc.producers.entries()) {
    const reference = pointer(context.npcReference, `/producers/${index}`);
    if ("unavailable" in row) { blockers.push({ kind: "unavailable-producer", key: `${context.snapshotId}:${index}`, detail: row.unavailable, provenance: [reference] }); continue; }
    const identity = context.sourceByComponent.get(row.componentInstanceId);
    if (!identity) { blockers.push({ kind: "unresolved-producer-source", key: `${context.snapshotId}:npc:${index}`, detail: "NPC producer has no verified serialized source binding.", provenance: [reference] }); continue; }
    conditions.push(...conditionRowsFor("source", `source:${identity.sourceId}`, row.conditions, pointer(reference, "/conditions")));
    if (!row.candidatesAvailable) blockers.push({ kind: "unavailable-spawn-candidates", key: identity.sourceId, detail: "The producer candidate list is unavailable.", provenance: [reference] });
    for (const [candidateIndex, candidate] of row.candidates.entries()) candidates.push({ sourceId: identity.sourceId, candidateIndex, npcId: candidate.npcId, minCount: null, maxCount: row.count.npcCountMax, rawChance: candidate.rawSpawnChance, chanceSemantics: candidate.spawnChanceSemantics, payload: { ...candidate, populationLimits: { npcCountMax: row.count.npcCountMax, spawnerType: row.count.spawnerType, semantics: row.count.semantics }, scaling: row.overrides.levels, scaleWithPlayer: row.overrides.scaleWithPlayer, zoneScaling: row.overrides.zoneScaling, patrol: { enabled: row.overrides.patrol.enabled, pointPauseSeconds: row.overrides.patrol.pointPauseSeconds, pathAvailable: row.overrides.patrol.pathAvailable, pathName: row.overrides.patrol.path?.name ?? null }, leash: row.overrides.leash, respawn: row.overrides.respawn, shape: row.shape, activation: { triggerSpawn: row.activation.triggerSpawn, playerDistanceMax: row.activation.playerDistanceMax }, unresolved: "unavailable" in candidate ? candidate.unavailable : null }, provenance: [pointer(reference, `/candidates/${candidateIndex}`), pointer(reference, "/count"), pointer(reference, "/overrides"), pointer(context.identityReference, `/identities/${identity.identityIndex}`)] });
  }
  return { conditions, candidates };
}

export function collectPatrolPaths(contexts: readonly SceneContext[], blockers: Blocker[]): NormalizedPatrolPath[] {
  const paths = new Map<string, NormalizedPatrolPath>();
  for (const context of contexts) for (const [index, row] of context.npc.patrolPaths.entries()) {
    const key = `${context.sceneNativeId}:${row.source.hierarchyPath}:${row.source.componentIndex}`;
    const worldPoints: NormalizedPatrolPath["worldPoints"] = [];
    for (const [pointIndex, point] of row.points.entries()) {
      if ("unavailable" in point) { blockers.push({ kind: "unresolved-patrol-point", key: `${key}:${pointIndex}`, detail: point.unavailable, provenance: [pointer(context.npcReference, `/patrolPaths/${index}/points/${pointIndex}`)] }); continue; }
      worldPoints.push(point.position);
    }
    const previous = paths.get(key);
    const reference = pointer(context.npcReference, `/patrolPaths/${index}`);
    if (previous) {
      if (JSON.stringify(previous.worldPoints) !== JSON.stringify(worldPoints) || previous.looping !== row.looping || previous.groupPatrol !== row.groupPatrol || previous.groupSpacing !== row.groupSpacing || previous.poiRadius !== row.poiRadius) throw new Error(`Conflicting patrol observations for ${key}.`);
      previous.provenance.push(reference);
    } else paths.set(key, { sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, name: row.name, looping: row.looping, groupPatrol: row.groupPatrol, groupSpacing: row.groupSpacing, poiRadius: row.poiRadius, worldPoints, provenance: [reference] });
  }
  return [...paths.values()].sort((a, b) => a.sceneNativeId - b.sceneNativeId || a.name.localeCompare(b.name));
}

export function collectWorldConditions(contexts: readonly SceneContext[], blockers: Blocker[]): NormalizedCondition[] {
  const conditions: NormalizedCondition[] = [];
  for (const context of contexts) for (const collection of ["resourceProducers", "interactions", "containers", "questZones", "transitions", "services", "conditionSources"] as const) for (const [index, row] of context.world[collection].entries()) {
    if (!("source" in row)) continue;
    const identity = row.source.componentInstanceId === null ? undefined : context.sourceByComponent.get(row.source.componentInstanceId);
    const reference = pointer(context.worldReference, `/${collection}/${index}`);
    if (!identity) blockers.push({ kind: "unresolved-world-source", key: `${context.snapshotId}:${collection}:${index}`, detail: "World source has no verified serialized source binding.", provenance: [reference] });
    const ownerKey = identity ? `source:${identity.sourceId}` : `${context.snapshotId}:${collection}:${index}`;
    conditions.push(...conditionRowsFor("world-source", ownerKey, row, reference));
  }
  return conditions;
}
