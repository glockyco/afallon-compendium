import { Assert } from "typebox/value";
import type { NpcProducers } from "./npc-extraction";
import type { PlacementIdentityResult, PlacementSnapshot } from "./placement-contracts";
import { PlacementRolesSchema, type PlacementRoles, type RoleEvidence, type RoleFact, type RoleIssue } from "./role-contracts";
import type { WorldSources } from "./world-extraction";
import { collectWorldRoleFacts } from "./world-roles";

type Row = Record<string, any>;
type Binding = PlacementIdentityResult["identities"][number];
type EvidenceMap = Map<string, RoleEvidence>;
type RoleState = { role: string; npcId: number | null; scope: RoleFact["scope"]; evidence: EvidenceMap; sourceIds: Set<string> };
type SourceState = { sourceId: string; placementId: string; families: Set<string>; evidence: EvidenceMap };
type PlacementState = { placementId: string; position: Binding["position"]; label: string | null; sourceIds: Set<string>; roles: Map<string, RoleState> };

function addEvidence(destination: EvidenceMap, values: readonly RoleEvidence[]): void {
  for (const value of values) destination.set(`${value.artifact}\0${value.pointer}`, value);
}
function orderedEvidence(values: EvidenceMap): RoleEvidence[] {
  return [...values.values()].sort((a, b) => a.artifact.localeCompare(b.artifact) || a.pointer.localeCompare(b.pointer));
}
function nativeType(value: string): string { return value.replace(/^Il2Cpp\.?/, ""); }

export function collectPlacementRoles(
  snapshot: PlacementSnapshot,
  identities: PlacementIdentityResult,
  npc: NpcProducers,
  world: WorldSources,
  npcFacts: ReadonlyMap<number, { facts: RoleFact[]; issues: RoleIssue[] }>,
): PlacementRoles {
  if (identities.sceneNativeId !== snapshot.context.gameSceneNativeId || identities.scenePath !== snapshot.context.scene.path || identities.snapshotFrame !== snapshot.frame) {
    throw new Error("Placement role inputs do not share a verified snapshot.");
  }
  if (world.coverage.componentIndexSemantics !== "all-gameobject-components") throw new Error("World sources do not use verified GameObject component slots.");
  const nodes = new Map(snapshot.nodes.map(node => [node.instanceId, node]));
  const components = new Map(snapshot.components.map(component => [component.instanceId, component]));
  if (nodes.size !== snapshot.nodes.length || components.size !== snapshot.components.length) throw new Error("Placement snapshot repeats native identities.");
  const queriedTypes = new Map<number, Set<string>>();
  for (const query of snapshot.queries) {
    for (const id of query.componentInstanceIds) {
      let types = queriedTypes.get(id);
      if (!types) queriedTypes.set(id, types = new Set());
      types.add(nativeType(query.typeName));
    }
  }
  const bindings = new Map<number, Binding>();
  const sourceBindings = new Set<string>();
  for (const binding of identities.identities) {
    const component = components.get(binding.componentInstanceId);
    if (!component || component.gameObjectInstanceId !== binding.gameObjectInstanceId || component.typeName !== binding.typeName) throw new Error("A verified identity does not match its native component.");
    if (bindings.has(binding.componentInstanceId) || sourceBindings.has(binding.sourceId)) throw new Error("Verified placement identities repeat a source binding.");
    bindings.set(binding.componentInstanceId, binding);
    sourceBindings.add(binding.sourceId);
  }
  const identityIssues = new Map(identities.unresolved.map(issue => [issue.componentInstanceId, issue]));
  const placements = new Map<string, PlacementState>();
  const sources = new Map<string, SourceState>();
  const unresolved: RoleIssue[] = [];
  const unplacedSources: PlacementRoles["unplacedSources"] = [];
  let inputRows = 0;
  let identityResolvedRows = 0;

  const bind = (sourceEvidence: Row | null | undefined, evidence: RoleEvidence): Binding | null => {
    const fail = (reason: string, detail: string): null => { unresolved.push({ reason, detail, evidence: [evidence] }); return null; };
    const scene = sourceEvidence?.sourceScene;
    const source = sourceEvidence?.source;
    if (!scene || !source || !Number.isInteger(sourceEvidence?.componentInstanceId) || !Number.isInteger(sourceEvidence?.gameObjectInstanceId) || !Number.isInteger(source.componentIndex) || source.componentIndex < 0 || typeof source.componentType !== "string") {
      return fail("unavailableSourceIdentity", "Source evidence does not identify a scene instance, native component, GameObject, and component slot.");
    }
    if (scene.path !== snapshot.context.scene.path || scene.buildIndex !== snapshot.context.scene.buildIndex || scene.handle !== snapshot.context.scene.handle) {
      return fail("foreignSourceScene", "The source belongs to a different scene instance or to an unplaced prefab asset.");
    }
    const component = components.get(sourceEvidence!.componentInstanceId);
    if (!component) return fail("unresolvedSnapshotSource", "The source component was not observed in the identity snapshot.");
    const node = nodes.get(component.gameObjectInstanceId);
    const type = nativeType(source.componentType);
    if (!node || node.sceneHandle !== scene.handle || component.gameObjectInstanceId !== sourceEvidence!.gameObjectInstanceId || component.componentIndex !== source.componentIndex || (nativeType(component.typeName) !== type && !queriedTypes.get(component.instanceId)?.has(type))) {
      return fail("mismatchedSourceObservation", "Native source and snapshot observations disagree on scene, owner, component slot, or type.");
    }
    const binding = bindings.get(component.instanceId);
    if (!binding) {
      const issue = identityIssues.get(component.instanceId);
      return fail("unresolvedSerializedSource", issue ? `${issue.reason}: ${issue.detail}` : "The snapshot component has no verified serialized identity.");
    }
    return binding;
  };

  const collect = (sourceEvidence: Row | null | undefined, evidence: RoleEvidence, families: string[], facts: RoleFact[], issues: RoleIssue[]): void => {
    inputRows++;
    unresolved.push(...issues);
    const binding = bind(sourceEvidence, evidence);
    if (!binding) { unplacedSources.push({ families: [...new Set(families)].sort(), roles: facts, evidence: [evidence] }); return; }
    identityResolvedRows++;
    let source = sources.get(binding.sourceId);
    if (!source) {
      source = { sourceId: binding.sourceId, placementId: binding.placementId, families: new Set(), evidence: new Map() };
      sources.set(binding.sourceId, source);
    }
    if (source.placementId !== binding.placementId) throw new Error("One source is attached to more than one physical placement.");
    for (const family of families) source.families.add(family);
    addEvidence(source.evidence, [evidence]);
    let placement = placements.get(binding.placementId);
    if (!placement) {
      placement = { placementId: binding.placementId, position: binding.position, label: null, sourceIds: new Set(), roles: new Map() };
      placements.set(binding.placementId, placement);
    }
    if (placement.position.x !== binding.position.x || placement.position.y !== binding.position.y || placement.position.z !== binding.position.z) throw new Error("One placement has conflicting snapshot positions.");
    if (families.includes("mapIcon")) {
      const title = typeof sourceEvidence?.title === "string" ? sourceEvidence.title : null;
      if (placement.label !== null && title !== null && placement.label !== title) throw new Error("One map icon placement has conflicting titles.");
      if (placement.label === null) placement.label = title;
    }
    placement.sourceIds.add(binding.sourceId);
    for (const fact of facts) {
      const key = JSON.stringify([fact.role, fact.npcId, fact.scope]);
      let role = placement.roles.get(key);
      if (!role) {
        role = { role: fact.role, npcId: fact.npcId, scope: fact.scope, evidence: new Map(), sourceIds: new Set() };
        placement.roles.set(key, role);
      }
      role.sourceIds.add(binding.sourceId);
      addEvidence(role.evidence, fact.evidence);
      addEvidence(role.evidence, [evidence]);
    }
  };

  npc.producers.forEach((producer, index) => {
    const pointer = `/producers/${index}`;
    const evidence: RoleEvidence = { artifact: "npc-producers", pointer };
    const facts: RoleFact[] = [];
    const issues: RoleIssue[] = [];
    if ("candidates" in producer) {
      const factionOverride = producer.overrides.faction.enabled;
      if (factionOverride) issues.push({ reason: "unverifiedFactionOverride", detail: "The authored faction override is retained, but its application to spawned NPCs is not verified; base-faction disposition is not used.", evidence: [{ artifact: "npc-producers", pointer: `${pointer}/overrides/faction` }] });
      producer.candidates.forEach((candidate, candidateIndex) => {
        const candidateEvidence: RoleEvidence = { artifact: "npc-producers", pointer: `${pointer}/candidates/${candidateIndex}` };
        const canonical = candidate.npcId === null ? undefined : npcFacts.get(candidate.npcId);
        if (!canonical) { issues.push({ reason: "unresolvedNpcRole", detail: `Authored candidate NPC ${candidate.npcId} has no canonical role facts.`, evidence: [candidateEvidence] }); return; }
        for (const fact of canonical.facts) if (!factionOverride || fact.scope !== "player-state") facts.push({ ...fact, evidence: [...fact.evidence, candidateEvidence] });
        for (const issue of canonical.issues) if (!factionOverride || (issue.reason !== "hostilityUnclassified" && !issue.evidence.some(reference => reference.artifact === "faction-roles"))) issues.push({ ...issue, evidence: [...issue.evidence, candidateEvidence] });
      });
      if (producer.candidates.length === 0) issues.push({ reason: "unresolvedNpcCandidates", detail: "The authored NPC producer has no resolved candidates.", evidence: [evidence] });
    } else issues.push({ reason: "unavailableNpcProducer", detail: "The NPC producer projection is unavailable.", evidence: [evidence] });
    collect(producer, evidence, ["npcSpawner"], facts, issues);
  });
  npc.adventurerProducers.forEach((producer, index) => {
    const evidence: RoleEvidence = { artifact: "npc-producers", pointer: `/adventurerProducers/${index}` };
    collect(producer, evidence, ["adventurerSpawnZone"], [{ role: "adventurerProducer", npcId: null, scope: "authored", evidence: [evidence] }], [{ reason: "unresolvedAdventurerCandidates", detail: "The association between this authored zone and the global adventurer roster is not recovered.", evidence: [evidence] }]);
  });
  npc.adventurerPopulationManagers.forEach((manager, index) => {
    const evidence: RoleEvidence = { artifact: "npc-producers", pointer: `/adventurerPopulationManagers/${index}` };
    collect(manager, evidence, ["adventurerPopulationManager"], [], []);
  });
  for (const row of collectWorldRoleFacts(world)) {
    if (row.collection === "mapIcons" && row.facts.length === 0) continue;
    const evidence: RoleEvidence = { artifact: "world-sources", pointer: `/${row.collection}/${row.index}` };
    const source = (world[row.collection][row.index] as Row)?.source;
    const sourceEvidence = row.collection === "mapIcons" && source
      ? { ...source, title: (world[row.collection][row.index] as Row)?.title }
      : source;
    collect(sourceEvidence, evidence, row.families, row.facts, row.issues);
  }
  const placementRows = [...placements.values()].sort((a, b) => a.placementId.localeCompare(b.placementId)).map(placement => ({
    placementId: placement.placementId, position: placement.position, label: placement.label, sourceIds: [...placement.sourceIds].sort(),
    roles: [...placement.roles.values()].sort((a, b) => a.role.localeCompare(b.role) || (a.npcId ?? -1) - (b.npcId ?? -1)).map(role => ({ role: role.role, npcId: role.npcId, scope: role.scope, sourceIds: [...role.sourceIds].sort(), evidence: orderedEvidence(role.evidence) })),
  }));
  const result: PlacementRoles = {
    schemaVersion: "compendium.placement-roles.v1", buildId: identities.buildId, sceneNativeId: identities.sceneNativeId, snapshotFrame: snapshot.frame,
    placements: placementRows,
    sources: [...sources.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)).map(source => ({ sourceId: source.sourceId, placementId: source.placementId, families: [...source.families].sort(), evidence: orderedEvidence(source.evidence) })),
    unplacedSources, unresolved,
    summary: { inputRows, identityResolvedRows, uniqueSources: sources.size, placements: placements.size, multiSourcePlacements: placementRows.filter(placement => placement.sourceIds.length > 1).length, multiRolePlacements: placementRows.filter(placement => new Set(placement.roles.map(role => role.role)).size > 1).length, unplacedSources: unplacedSources.length, unresolved: unresolved.length },
  };
  Assert(PlacementRolesSchema, result);
  return result;
}
