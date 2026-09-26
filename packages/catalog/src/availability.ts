import { stableJson, type NormalizedCondition, type NormalizedSourceGate } from "@afallon/contracts/catalog";
import type { WorldSources } from "@afallon/contracts";
import { conditionSemanticPayload } from "./conditions";
import { hashRelation } from "./database";
import type { Blocker, SceneContext } from "./context";

type Effect = NormalizedSourceGate["effect"];
type ConditionSource = WorldSources["conditionSources"][number];
interface ToggleRule { semantics: string; effect: Effect; durationSeconds: number | null }

// The requirement set that an NPC spawner evaluates, by the collector's `selectedConditionSource`. "none" is an
// enabled requirements template that is null in the scene; the game passes it without a check.
const SPAWNER_CONDITION_SEMANTICS: Readonly<Record<string, string | null>> = {
  "none": null,
  "requirements-template": "requirements-template",
  "inline-requirement-groups": "inline-requirements",
};

// A condition gates a source only when it names at least one requirement.
function hasRequirements(condition: NormalizedCondition): boolean {
  const payload = condition.payload;
  const groups = payload !== null && typeof payload === "object" && "groups" in payload ? payload.groups : payload;
  return Array.isArray(groups) && groups.some((group: unknown) => group !== null && typeof group === "object" && "requirements" in group
    && Array.isArray(group.requirements) && group.requirements.some((row: unknown) => row !== null));
}

// The component decides which of its authored requirement sets it evaluates: an ActiveRequirement reads its
// template or its inline groups according to `requirementSource`, and an EnhancedInteractableObject switches
// its target on with one set and off with the other.
function toggleRules(row: ConditionSource, blockers: Blocker[], key: string): ToggleRule[] {
  switch (row.family) {
    case "activeRequirement": {
      const semantics = row.requirementSource.name === "Template" ? "activation-requirement" : row.requirementSource.name === "RequirementGroup" ? "requirements" : null;
      if (semantics === null) { blockers.push({ kind: "unsupported-enum", key: `${key}:requirementSource`, detail: `ActiveRequirement source ${row.requirementSource.name} has no supported requirement set.`, provenance: [] }); return []; }
      return [{ semantics, effect: "requires", durationSeconds: null }];
    }
    case "disableRequirement": return [{ semantics: "activation-requirement", effect: "excludes", durationSeconds: null }];
    case "timedActiveRequirement": return [{ semantics: "activation-requirement", effect: "temporary", durationSeconds: row.activationDurationSeconds }];
    case "enhancedInteractableObject": return [{ semantics: "activation-requirements", effect: "requires", durationSeconds: null }, { semantics: "deactivation-requirements", effect: "excludes", durationSeconds: null }];
    default: return [];
  }
}

// The availability of a world source is every rule that decides whether it exists or works: its own spawn or
// interaction requirements, and each requirement toggle whose target is the source's game object or one of its
// ancestors in the same observed scene. Rules are keyed by their meaning, so a toggle observed in several
// contexts, with or without a verified identity, yields one rule.
export function collectSourceGates(contexts: readonly SceneContext[], conditions: readonly NormalizedCondition[], blockers: Blocker[]): NormalizedSourceGate[] {
  const byOwner = new Map<string, NormalizedCondition[]>();
  for (const condition of conditions) {
    if (!hasRequirements(condition)) continue;
    const rows = byOwner.get(condition.ownerKey) ?? [];
    rows.push(condition);
    byOwner.set(condition.ownerKey, rows);
  }
  const gates = new Map<string, NormalizedSourceGate>();
  const add = (sourceId: string, viaSourceId: string | null, condition: NormalizedCondition, rule: ToggleRule | { effect: Effect; durationSeconds: null }) => {
    const gateId = hashRelation("source-gate", [sourceId, rule.effect, rule.durationSeconds, condition.semantics, stableJson(conditionSemanticPayload(condition.payload))]);
    const previous = gates.get(gateId);
    if (!previous) { gates.set(gateId, { gateId, sourceId, viaSourceId, conditionId: condition.conditionId, effect: rule.effect, durationSeconds: rule.durationSeconds, provenance: [...condition.provenance] }); return; }
    if (previous.viaSourceId === null) previous.viaSourceId = viaSourceId;
    previous.provenance = [...new Map([...previous.provenance, ...condition.provenance].map((reference) => [`${reference.sha256}:${reference.pointer ?? ""}`, reference])).values()];
  };
  for (const context of contexts) {
    const paths = new Map<string, string>();
    for (const collection of ["resourceProducers", "interactions", "containers", "questZones", "transitions", "services", "conditionSources", "mapZones", "regions", "mapIcons", "unsupportedSources"] as const) for (const row of context.world[collection]) {
      if (!("source" in row) || row.source.componentInstanceId === null) continue;
      const identity = context.sourceByComponent.get(row.source.componentInstanceId);
      if (identity && row.source.source.hierarchyPath) paths.set(identity.sourceId, row.source.source.hierarchyPath);
    }
    for (const collection of ["producers", "adventurerProducers", "adventurerPopulationManagers"] as const) for (const row of context.npc[collection]) {
      if ("unavailable" in row) continue;
      const identity = context.sourceByComponent.get(row.componentInstanceId);
      if (identity) paths.set(identity.sourceId, row.source.hierarchyPath);
    }
    // Own rules: an interaction's requirement template and a spawner's selected requirement set.
    for (const collection of ["interactions", "containers", "questZones"] as const) for (const row of context.world[collection]) {
      if (!("source" in row) || row.source.componentInstanceId === null) continue;
      const identity = context.sourceByComponent.get(row.source.componentInstanceId);
      if (identity) for (const condition of byOwner.get(`source:${identity.sourceId}`) ?? []) add(identity.sourceId, identity.sourceId, condition, { effect: "requires", durationSeconds: null });
    }
    for (const row of context.npc.producers) {
      if ("unavailable" in row) continue;
      const identity = context.sourceByComponent.get(row.componentInstanceId);
      if (!identity) continue;
      const selected = row.conditions.selectedConditionSource;
      if (!Object.hasOwn(SPAWNER_CONDITION_SEMANTICS, selected)) { blockers.push({ kind: "unsupported-enum", key: `source:${identity.sourceId}:selectedConditionSource`, detail: `NPC spawner condition source ${selected} has no supported requirement set.`, provenance: [] }); continue; }
      const semantics = SPAWNER_CONDITION_SEMANTICS[selected];
      for (const condition of byOwner.get(`source:${identity.sourceId}`) ?? []) if (condition.semantics === semantics) add(identity.sourceId, identity.sourceId, condition, { effect: "requires", durationSeconds: null });
    }
    // Toggle rules apply to the target and everything below it. A toggle without a verified identity keeps the
    // owner key that condition collection gave it.
    for (const [index, row] of context.world.conditionSources.entries()) {
      if (!("targetSource" in row) || row.targetSource === null || !row.targetSource.source.hierarchyPath) continue;
      const identity = row.source.componentInstanceId === null ? undefined : context.sourceByComponent.get(row.source.componentInstanceId);
      const ownerKey = identity ? `source:${identity.sourceId}` : `${context.snapshotId}:conditionSources:${index}`;
      const targetPath = row.targetSource.source.hierarchyPath;
      for (const rule of toggleRules(row, blockers, ownerKey)) for (const condition of byOwner.get(ownerKey) ?? []) {
        if (condition.semantics !== rule.semantics) continue;
        for (const [sourceId, path] of paths) if (path === targetPath || path.startsWith(`${targetPath}/`)) add(sourceId, identity?.sourceId ?? null, condition, rule);
      }
    }
  }
  return [...gates.values()].sort((a, b) => a.gateId.localeCompare(b.gateId));
}
