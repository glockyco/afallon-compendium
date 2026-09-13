import type { WorldSources } from "./world-extraction";
import type { RoleEvidence, RoleFact, RoleIssue } from "./role-contracts";

export type WorldRoleRow = {
  collection:
    | "resourceProducers"
    | "interactions"
    | "containers"
    | "questZones"
    | "transitions"
    | "services"
    | "conditionSources"
    | "unsupportedSources"
    | "mapIcons";
  index: number;
  families: string[];
  facts: RoleFact[];
  issues: RoleIssue[];
};

type RecordValue = Record<string, unknown>;
type Collection = WorldRoleRow["collection"];
type FactBuilder = Map<string, RoleFact>;

const collections: readonly Collection[] = [
  "resourceProducers",
  "interactions",
  "containers",
  "questZones",
  "transitions",
  "services",
  "conditionSources",
  "unsupportedSources",
  "mapIcons",
];

const typedActionPayloads: Readonly<Record<string, string>> = {
  Effect: "effect",
  Quest: "quest",
  Point: "point",
  GiveSkillExperience: "skill",
  GiveWeaponTemplateExperience: "weaponTemplate",
  CompleteTask: "task",
  Resource: "resource",
  Chest: "lootTable",
};

const unreferencedActionTypes = new Set(["GiveCharacterExperience", "SaveCharacter"]);
const actionReferenceKinds: Readonly<Record<string, string>> = {
  Effect: "effect",
  Quest: "quest",
  Point: "treePoint",
  GiveSkillExperience: "skill",
  GiveWeaponTemplateExperience: "weaponTemplate",
  CompleteTask: "task",
  Resource: "resource",
  Chest: "lootTable",
};

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function array(value: unknown): readonly unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function pointer(path: string): RoleEvidence {
  return { artifact: "world-sources", pointer: path.startsWith("/") ? path : `/${path}` };
}

function refs(...paths: string[]): RoleEvidence[] {
  const seen = new Set<string>();
  const result: RoleEvidence[] = [];
  for (const path of paths) {
    const evidence = pointer(path);
    if (seen.has(evidence.pointer)) continue;
    seen.add(evidence.pointer);
    result.push(evidence);
  }
  return result;
}

function sourceRefs(rowPath: string, row: RecordValue): RoleEvidence[] {
  return row.source === undefined ? refs(rowPath) : refs(`${rowPath}/source`);
}

function issue(issues: RoleIssue[], reason: string, detail: string, evidence: readonly RoleEvidence[]): void {
  issues.push({ reason, detail, evidence: [...evidence] });
}

function addFact(facts: FactBuilder, role: string, evidence: readonly RoleEvidence[], scope: RoleFact["scope"] = "authored"): void {
  if (evidence.length === 0) return;
  const prior = facts.get(role);
  if (prior === undefined) {
    facts.set(role, { role, npcId: null, scope, evidence: [...evidence] });
    return;
  }
  const seen = new Set(prior.evidence.map(value => value.pointer));
  for (const value of evidence) {
    if (!seen.has(value.pointer)) {
      prior.evidence.push(value);
      seen.add(value.pointer);
    }
  }
}

function valueName(value: unknown): string | null {
  const row = record(value);
  return row !== null && typeof row.name === "string" ? row.name : null;
}

function validReference(value: unknown): boolean {
  const reference = record(value);
  return reference !== null && typeof reference.nativeId === "number" && Number.isInteger(reference.nativeId) && reference.nativeId >= 0;
}

function referenceMatchesId(value: unknown, id: unknown): boolean {
  if (id === null || id === undefined) return true;
  const reference = record(value);
  return reference !== null && typeof id === "number" && Number.isInteger(id) && id >= 0 && reference.nativeId === id;
}

function familyFor(collection: Collection, row: RecordValue): string {
  if (collection === "mapIcons") return "mapIcon";
  const key = collection === "resourceProducers" ? "producerFamily" : collection === "transitions" ? "transitionKind" : "family";
  return typeof row[key] === "string" && row[key].length > 0 ? row[key] as string : collection;
}

function availableActionRows(row: RecordValue, rowPath: string, issues: RoleIssue[]): readonly unknown[] | null {
  const actions = array(row.actions);
  if (row.actionsAvailable !== true) {
    issue(issues, "actionsUnavailable", "The authored InteractableObject action list is unavailable; no player-facing action role is inferred.", refs(`${rowPath}/actionsAvailable`, `${rowPath}/actions`));
    return null;
  }
  if (actions === null || actions.length === 0) {
    issue(issues, "emptyActions", "The authored InteractableObject action list is empty; useful interaction semantics are not established.", refs(`${rowPath}/actions`));
    return null;
  }
  return actions;
}

function validActionReference(
  action: RecordValue,
  actionName: string,
  actionPath: string,
  issues: RoleIssue[],
): boolean {
  const payloadName = typedActionPayloads[actionName];
  if (payloadName === undefined) return false;
  const payload = action[payloadName];
  const expectedKind = actionReferenceKinds[actionName];
  const kind = action.referenceKind;
  const id = action.referenceId;
  const payloadValid = validReference(payload) && referenceMatchesId(payload, id);
  const genericValid = action.reference === null || action.reference === undefined || validReference(action.reference);
  const genericMatches = action.reference === null || action.reference === undefined || referenceMatchesId(action.reference, id);
  if (kind !== expectedKind || !payloadValid || !genericValid || !genericMatches) {
    const actual = kind === null || kind === undefined ? "no reference kind" : String(kind);
    issue(
      issues,
      "unresolvedActionReference",
      `${actionName} action has no valid ${expectedKind} reference (reported kind: ${actual}).`,
      refs(`${actionPath}/${payloadName}`, `${actionPath}/referenceKind`, `${actionPath}/referenceId`, `${actionPath}/reference`),
    );
    return false;
  }
  return true;
}

type ResolvedAction = { name: string; evidence: RoleEvidence[] };
type NestedGameActionsResult = { supported: number; loot: number; blocked: boolean; evidence: RoleEvidence[] };

function nestedActionEvidence(action: RecordValue, actionPath: string): RoleEvidence[] {
  const evidence = refs(`${actionPath}/type`, `${actionPath}/chance`, `${actionPath}/requirements`);
  const requirements = array(action.requirements);
  requirements?.forEach((group, groupIndex) => {
    evidence.push(...refs(`${actionPath}/requirements/${groupIndex}`));
    const requirementGroup = record(group);
    const rows = requirementGroup === null ? null : array(requirementGroup.requirements);
    rows?.forEach((_requirement, requirementIndex) => evidence.push(...refs(`${actionPath}/requirements/${groupIndex}/requirements/${requirementIndex}`)));
  });
  return evidence;
}

function validTeleportPosition(value: unknown): boolean {
  const position = record(value);
  return position !== null && typeof position.x === "number" && Number.isFinite(position.x)
    && typeof position.y === "number" && Number.isFinite(position.y)
    && typeof position.z === "number" && Number.isFinite(position.z);
}

function inspectNestedGameActionList(value: unknown, listPath: string, issues: RoleIssue[]): NestedGameActionsResult {
  const list = record(value);
  if (list === null) return { supported: 0, loot: 0, blocked: true, evidence: refs(listPath) };
  const actions = array(list.actions);
  if (list.available !== true || actions === null || actions.length === 0) return { supported: 0, loot: 0, blocked: false, evidence: refs(`${listPath}/available`, `${listPath}/nativeActionCount`, `${listPath}/actions`) };
  let supported = 0;
  let loot = 0;
  let blocked = false;
  const evidence: RoleEvidence[] = [];
  actions.forEach((value, actionIndex) => {
    const actionPath = `${listPath}/actions/${actionIndex}`;
    const action = record(value);
    if (action === null || typeof action.unavailable === "string") {
      issue(issues, "unavailableNestedGameAction", action?.unavailable as string ?? "The nested GameAction row is unavailable. Its behavior is not established.", refs(actionPath));
      blocked = true;
      return;
    }
    const actionType = record(action.type);
    const actionName = valueName(action.type);
    const actionEvidence = nestedActionEvidence(action, actionPath);
    evidence.push(...actionEvidence);
    if (actionType === null || actionName === null) {
      issue(issues, "unsupportedNestedGameAction", "The nested GameAction has no native type projection. Its effect is not established.", actionEvidence.length > 0 ? actionEvidence : refs(actionPath));
      blocked = true;
      return;
    }
    const teleport = record(action.teleport);
    const teleportType = teleport === null ? null : record(teleport.type);
    const teleportEvidence = teleport === null ? [] : refs(`${actionPath}/teleport`, `${actionPath}/teleport/type`, `${actionPath}/teleport/sceneNativeId`, `${actionPath}/teleport/position`, `${actionPath}/teleport/rotation`);
    evidence.push(...teleportEvidence);
    if (action.unsupported === true) {
      const targetEvidence = teleport === null ? actionEvidence : [...actionEvidence, ...teleportEvidence];
      const targetIssue = actionName === "Teleport" && teleportType?.value === 2;
      const invalidScene = actionName === "Teleport" && teleportType?.value === 0;
      issue(issues, targetIssue ? "unresolvedNestedTargetTeleport" : invalidScene ? "invalidNestedTeleportDestination" : "unsupportedNestedGameAction", targetIssue ? "Target teleport destination remains unresolved." : invalidScene ? "GameScene teleport has an invalid destination scene ID." : `Nested GameAction ${actionName} is retained but its effect is not supported.`, targetEvidence);
      blocked = true;
      return;
    }
    // A LootTable game action hands over the table's loot: a container output.
    if (actionType.value === 28 && actionName === "LootTable") {
      if (!validReference(action.lootTable)) {
        issue(issues, "unresolvedNestedLootTable", "LootTable game action has no valid resolved loot table reference.", [...actionEvidence, ...refs(`${actionPath}/lootTable`, `${actionPath}/lootTableID`)]);
        blocked = true;
        return;
      }
      evidence.push(...refs(`${actionPath}/lootTable`));
      loot++;
      return;
    }
    // An Effect game action whose effect is a Teleport is a door with a projected destination.
    if (actionType.value === 4 && actionName === "Effect" && record(action.effectTeleport) !== null) {
      evidence.push(...refs(`${actionPath}/effectTeleport`));
      supported++;
      return;
    }
    if (actionType.value !== 22 || actionName !== "Teleport") {
      issue(issues, "unsupportedNestedGameAction", `Nested GameAction ${actionName} is retained but its effect is not supported.`, actionEvidence);
      blocked = true;
      return;
    }
    if (teleport === null || teleportType === null) {
      issue(issues, "invalidNestedTeleportDestination", "Teleport action has no projected teleport payload.", [...actionEvidence, ...refs(`${actionPath}/teleport`) ]);
      blocked = true;
      return;
    }
    if (teleportType.value === 1 && validTeleportPosition(teleport.position) && validTeleportPosition(teleport.rotation)) {
      supported++;
      return;
    }
    if (teleportType.value === 0 && typeof teleport.sceneNativeId === "number" && Number.isInteger(teleport.sceneNativeId) && teleport.sceneNativeId >= 0) {
      supported++;
      return;
    }
    if (teleportType.value === 2) {
      issue(issues, "unresolvedNestedTargetTeleport", "Target teleport destination remains unresolved.", [...actionEvidence, ...teleportEvidence]);
    } else {
      issue(issues, "invalidNestedTeleportDestination", "Teleport action has an invalid destination payload.", [...actionEvidence, ...teleportEvidence]);
    }
    blocked = true;
  });
  return { supported, loot, blocked, evidence };
}

function inspectGameActions(action: RecordValue, actionPath: string, issues: RoleIssue[]): ResolvedAction | null {
  const gameActions = record(action.gameActions);
  if (gameActions === null) {
    issue(issues, "unsupportedGameAction", "GameActions action has no projected template or inline payload.", refs(`${actionPath}/type`, `${actionPath}/gameActions`));
    return null;
  }
  const evidence = refs(`${actionPath}/type`, `${actionPath}/gameActions/executionOrder`, `${actionPath}/gameActions/template`, `${actionPath}/gameActions/inline`);
  const template = gameActions.template === null ? null : inspectNestedGameActionList(gameActions.template, `${actionPath}/gameActions/template`, issues);
  const inline = inspectNestedGameActionList(gameActions.inline, `${actionPath}/gameActions/inline`, issues);
  const supported = (template?.supported ?? 0) + inline.supported;
  const loot = (template?.loot ?? 0) + inline.loot;
  const blocked = (template?.blocked ?? false) || inline.blocked;
  evidence.push(...(template?.evidence ?? []), ...inline.evidence);
  if (supported === 0 && loot === 0) {
    if (!blocked) issue(issues, "unsupportedGameAction", "GameActions action has no supported nested teleport or loot payload.", evidence);
    return null;
  }
  if (supported === 0) return { name: "GameActionsLoot", evidence };
  return { name: "GameActions", evidence };
}

function inspectAction(value: unknown, actionPath: string, issues: RoleIssue[]): ResolvedAction | null {
  const action = record(value);
  if (action === null) {
    issue(issues, "unavailableAction", "The authored action row is unavailable; its behavior is not established.", refs(actionPath));
    return null;
  }
  if (typeof action.unavailable === "string") {
    issue(issues, "unavailableAction", action.unavailable, refs(actionPath));
    return null;
  }
  const actionType = record(action.type);
  const actionName = valueName(action.type);
  const typeEvidence = refs(`${actionPath}/type`);
  if (actionType === null || actionName === null) {
    issue(issues, "unsupportedActionType", "The action has no native type projection, so its behavior is not established.", typeEvidence.length > 0 ? typeEvidence : refs(actionPath));
    return null;
  }
  if (actionName === "GameActions") return inspectGameActions(action, actionPath, issues);
  if (action.unsupported === true || actionName === "UnityEvent") {
    issue(
      issues,
      "unsupportedGameAction",
      `${actionName} action payload is not projected; no useful interaction role is inferred from it.`,
      refs(`${actionPath}/type`, `${actionPath}/unityEventAvailable`),
    );
    return null;
  }
  const isTyped = Object.prototype.hasOwnProperty.call(typedActionPayloads, actionName);
  const isUnreferenced = unreferencedActionTypes.has(actionName);
  if (!isTyped && !isUnreferenced) {
    issue(issues, "unsupportedActionType", `Native action type ${actionName} is not supported by the world projection.`, typeEvidence);
    return null;
  }
  if (isTyped && !validActionReference(action, actionName, actionPath, issues)) return null;
  const payloadName = typedActionPayloads[actionName];
  const evidence = [...typeEvidence, ...(payloadName === undefined ? [] : refs(`${actionPath}/${payloadName}`))];
  // An Effect action whose effect is a Teleport is a door; the probe projects the destination.
  if (actionName === "Effect" && record(action.effectTeleport) !== null) {
    return { name: "TeleportEffect", evidence: [...evidence, ...refs(`${actionPath}/effectTeleport`)] };
  }
  return { name: actionName, evidence };
}

function collectInteractableActions(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const actions = availableActionRows(row, rowPath, issues);
  if (actions === null) return;

  actions.forEach((value, actionIndex) => {
    const resolved = inspectAction(value, `${rowPath}/actions/${actionIndex}`, issues);
    if (resolved === null) return;
    if (resolved.name === "Chest" || resolved.name === "GameActionsLoot") {
      addFact(facts, "container", resolved.evidence);
      addFact(facts, "usefulInteraction", resolved.evidence);
    } else if (resolved.name === "Quest" || resolved.name === "CompleteTask") {
      addFact(facts, "questLocation", resolved.evidence);
      addFact(facts, "usefulInteraction", resolved.evidence);
    } else if (resolved.name === "GameActions" || resolved.name === "TeleportEffect") {
      addFact(facts, "transition", resolved.evidence);
      addFact(facts, "usefulInteraction", resolved.evidence);
    } else {
      addFact(facts, "usefulInteraction", resolved.evidence);
    }
  });
}

function inspectProducerOptions(row: RecordValue, rowPath: string, issues: RoleIssue[]): void {
  const options = array(row.options);
  if (row.optionsAvailable !== true || options === null) {
    issue(issues, "producerOptionsUnavailable", "OreSpawner authored producer options are unavailable; candidate output semantics remain unresolved.", refs(`${rowPath}/optionsAvailable`, `${rowPath}/options`));
    return;
  }
  options.forEach((optionValue, optionIndex) => {
    const optionPath = `${rowPath}/options/${optionIndex}`;
    const option = record(optionValue);
    if (option === null || typeof option.unavailable === "string") {
      issue(issues, "unavailableProducerOption", option?.unavailable as string ?? "The authored producer option is unavailable.", refs(optionPath));
      return;
    }
    const interactables = array(option.authoredInteractables);
    if (interactables === null) {
      issue(issues, "candidateInteractablesUnavailable", "The authored producer option has no projected candidate interactable list.", refs(`${optionPath}/authoredInteractables`));
      return;
    }
    interactables.forEach((candidateValue, candidateIndex) => {
      const candidatePath = `${optionPath}/authoredInteractables/${candidateIndex}`;
      const candidate = record(candidateValue);
      if (candidate === null || typeof candidate.unavailable === "string") {
        issue(issues, "unavailableCandidateInteractable", candidate?.unavailable as string ?? "The authored candidate interactable is unavailable.", refs(candidatePath));
        return;
      }
      const actions = array(candidate.actions);
      if (actions === null || actions.length === 0) {
        issue(issues, "emptyCandidateActions", "The authored candidate interactable has no actions; its generated interaction semantics are not established.", refs(`${candidatePath}/actions`));
        return;
      }
      actions.forEach((actionValue, actionIndex) => {
        inspectAction(actionValue, `${candidatePath}/actions/${actionIndex}`, issues);
      });
    });
  });
}

function nodeRoleEvidence(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[], source: "interaction" | "resourceProducer" | "container"): void {
  const projection = record(row.projection);
  const roleEvidence = record(row.roleEvidence);
  const nodeRoles = projection === null ? null : record(projection.nodeRoles);
  if (projection?.unsupportedUnityEvent === true) {
    issue(issues, "unsupportedUnityEvent", "InteractiveNode UnityEvent payload is not projected; its player-facing behavior remains unresolved.", refs(`${rowPath}/projection/unsupportedUnityEvent`));
  }

  const readRole = (roleName: "resource" | "container"): { value: boolean | null; path: string } => {
    if (source === "interaction") {
      const path = `${rowPath}/roleEvidence/${roleName}`;
      const value = roleEvidence?.[roleName];
      return { value: typeof value === "boolean" ? value : null, path };
    }
    const path = `${rowPath}/projection/nodeRoles/${roleName}`;
    const value = nodeRoles?.[roleName];
    return { value: typeof value === "boolean" ? value : null, path };
  };

  const resource = readRole("resource");
  const container = readRole("container");
  if (resource.value === null && source !== "container") {
    issue(issues, "missingNodeRoleEvidence", "InteractiveNode resource role evidence is unavailable.", refs(resource.path));
  }
  if (container.value === null) {
    issue(issues, "missingNodeRoleEvidence", "InteractiveNode container role evidence is unavailable.", refs(container.path));
  }

  const gatherValue = source === "resourceProducer"
    ? (validReference(row.gatheringSkill) ? row.gatheringSkill : record(row.gatheringRole)?.skill)
    : (validReference(projection?.gatherSkill) ? projection?.gatherSkill : record(projection?.gatheringRole)?.skill);
  const gatherPointer = source === "resourceProducer"
    ? (validReference(row.gatheringSkill) ? `${rowPath}/gatheringSkill` : validReference(record(row.gatheringRole)?.skill) ? `${rowPath}/gatheringRole/skill` : null)
    : (validReference(projection?.gatherSkill) ? `${rowPath}/projection/gatherSkill` : validReference(record(projection?.gatheringRole)?.skill) ? `${rowPath}/projection/gatheringRole/skill` : null);
  const projectionRoleEvidence = source === "interaction"
    ? refs(`${rowPath}/roleEvidence/resource`)
    : refs(`${rowPath}/projection/nodeRoles/resource`);
  if (resource.value === true) {
    addFact(facts, "resourceProducer", [...projectionRoleEvidence, ...(gatherPointer === null ? [] : refs(gatherPointer))]);
    if (gatherValue === null || gatherValue === undefined || !validReference(gatherValue)) {
      issue(issues, "missingGatheringSkill", "InteractiveNode is marked as a resource node, but its gathering skill reference is unavailable.", refs(`${rowPath}/projection/gatherSkill`, `${rowPath}/projection/gatheringRole/skill`));
    }
  }

  const containerEvidence = source === "interaction"
    ? refs(`${rowPath}/roleEvidence/container`)
    : refs(`${rowPath}/projection/nodeRoles/container`);
  if (container.value === true) {
    addFact(facts, "container", containerEvidence);
    addFact(facts, "usefulInteraction", [...containerEvidence, ...refs(`${rowPath}/projection/containerTablesData`)]);
  }

  if (source === "interaction" && roleEvidence !== null && projection !== null && nodeRoles !== null) {
    for (const roleName of ["resource", "container"] as const) {
      const explicit = roleEvidence[roleName];
      const projected = nodeRoles[roleName];
      if (typeof explicit === "boolean" && typeof projected === "boolean" && explicit !== projected) {
        issue(issues, "inconsistentNodeRoleEvidence", `InteractiveNode ${roleName} role evidence disagrees between the interaction and projection rows.`, refs(`${rowPath}/roleEvidence/${roleName}`, `${rowPath}/projection/nodeRoles/${roleName}`));
      }
    }
  }
}

function classifyResource(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const family = typeof row.producerFamily === "string" ? row.producerFamily : "";
  if (family === "oreSpawner") {
    const gatheringRole = record(row.gatheringRole);
    const skill = validReference(row.gatheringSkill)
      ? `${rowPath}/gatheringSkill`
      : validReference(gatheringRole?.skill) ? `${rowPath}/gatheringRole/skill` : null;
    if (skill === null) {
      issue(issues, "missingGatheringSkill", "OreSpawner has no valid gatheringSkill reference; its producer name and native MiningSkillID are not sufficient to classify a resource role.", refs(`${rowPath}/gatheringSkill`, `${rowPath}/gatheringSkillID`, `${rowPath}/gatheringRole/skill`));
    } else {
      addFact(facts, "resourceProducer", refs(skill));
    }
    if (gatheringRole !== null && gatheringRole.kind !== undefined && gatheringRole.kind !== "resource") {
      issue(issues, "unsupportedGatheringRole", "OreSpawner gatheringRole.kind is not the recovered resource semantic.", refs(`${rowPath}/gatheringRole/kind`));
    }
    inspectProducerOptions(row, rowPath, issues);
    return;
  }
  if (family === "interactiveNode") {
    nodeRoleEvidence(row, rowPath, facts, issues, "resourceProducer");
    return;
  }
  issue(issues, "unsupportedResourceFamily", `Resource producer family ${family || "<missing>"} is not supported.`, refs(`${rowPath}/producerFamily`));
}

function classifyInteraction(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const family = typeof row.family === "string" ? row.family : "";
  if (family === "interactableObject" || family === "interactableTrigger") {
    collectInteractableActions(row, rowPath, facts, issues);
    return;
  }
  if (family === "chest") {
    addFact(facts, "container", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/projection/lootInstances`)]);
    addFact(facts, "usefulInteraction", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/projection/lootInstances`)]);
    const projection = record(row.projection);
    if (projection !== null && projection.lootInstancesAvailable !== true) {
      issue(issues, "lootInstancesUnavailable", "Chest interaction is typed, but its authored loot instance list is unavailable.", refs(`${rowPath}/projection/lootInstancesAvailable`, `${rowPath}/projection/lootInstances`));
    }
    return;
  }
  if (family === "interactiveNode") {
    nodeRoleEvidence(row, rowPath, facts, issues, "interaction");
    return;
  }
  issue(issues, "unsupportedInteractionFamily", `Interaction family ${family || "<missing>"} is not supported.`, refs(`${rowPath}/family`));
}

function classifyContainer(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const family = typeof row.family === "string" ? row.family : "";
  if (family === "chest") {
    addFact(facts, "container", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/projection/lootInstances`)]);
    const projection = record(row.projection);
    if (projection !== null && projection.lootInstancesAvailable !== true) {
      issue(issues, "lootInstancesUnavailable", "Chest container output is typed, but its authored loot instance list is unavailable.", refs(`${rowPath}/projection/lootInstancesAvailable`, `${rowPath}/projection/lootInstances`));
    }
    return;
  }
  if (family === "interactiveNode") {
    nodeRoleEvidence(row, rowPath, facts, issues, "container");
    return;
  }
  if (family === "storageContainer") {
    addFact(facts, "storage", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/slotAmount`)]);
    return;
  }
  issue(issues, "unsupportedContainerFamily", `Container family ${family || "<missing>"} is not supported.`, refs(`${rowPath}/family`));
}

function worldQuestReferenceEvidence(value: unknown, path: string, issues: RoleIssue[]): RoleEvidence[] {
  const worldQuest = record(value);
  if (worldQuest === null || typeof worldQuest.nativeId !== "number" || !Number.isInteger(worldQuest.nativeId) || worldQuest.nativeId < 0) {
    issue(issues, "unresolvedWorldQuestReference", "The authored world quest reference is missing a valid native ID.", refs(path));
    return [];
  }
  const evidence = refs(path);
  const hasQuestField = Object.prototype.hasOwnProperty.call(worldQuest, "quest");
  if (!validReference(worldQuest.quest)) {
    issue(issues, "unresolvedWorldQuestQuest", "The authored world quest has no valid RPGQuest reference.", hasQuestField ? refs(`${path}/quest`) : refs(path));
  } else {
    evidence.push(...refs(`${path}/quest`));
  }
  return evidence;
}

function classifyQuestZone(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const evidence = sourceRefs(rowPath, row);
  const worldQuest = row.worldQuest;
  if (worldQuest !== null && worldQuest !== undefined) evidence.push(...worldQuestReferenceEvidence(worldQuest, `${rowPath}/worldQuest`, issues));
  const possible = array(row.possibleQuests);
  if (row.possibleQuestsAvailable !== true) {
    issue(issues, "possibleQuestsUnavailable", "WorldQuestZone possible quest pool is unavailable; fixed worldQuest evidence is retained separately.", refs(`${rowPath}/possibleQuestsAvailable`, `${rowPath}/possibleQuests`));
  } else if (possible === null) {
    issue(issues, "possibleQuestsUnavailable", "WorldQuestZone possible quest pool has no projected rows.", refs(`${rowPath}/possibleQuests`));
  } else {
    for (let index = 0; index < possible.length; index += 1) {
      const poolPath = `${rowPath}/possibleQuests/${index}`;
      const pool = record(possible[index]);
      if (pool === null || typeof pool.unavailable === "string") {
        issue(issues, "unavailablePossibleQuest", pool?.unavailable as string ?? "The possible world quest row is unavailable.", refs(poolPath));
        continue;
      }
      evidence.push(...worldQuestReferenceEvidence(pool.worldQuest, `${poolPath}/worldQuest`, issues));
    }
  }
  if ((worldQuest === null || worldQuest === undefined) && (possible === null || possible.length === 0)) {
    issue(issues, "missingQuestReference", "WorldQuestZone has neither a fixed worldQuest nor a possible quest row.", refs(`${rowPath}/worldQuest`, `${rowPath}/possibleQuests`));
  }
  addFact(facts, "questLocation", evidence.length > 0 ? evidence : sourceRefs(rowPath, row));
}

function classifyMapIcon(row: RecordValue, rowPath: string, facts: FactBuilder): void {
  const kind = row.iconKind;
  if (kind !== "town" && kind !== "fort" && kind !== "camp" && kind !== "dungeon" && kind !== "challengeStone") return;
  addFact(facts, "mapIcon", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/iconKind`, `${rowPath}/title`)], kind);
}

function classifyTransition(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  // DungeonEntranceTrigger.OnTriggerEnter (build 25153357) records its scene and opens a UI
  // panel; it loads nothing. The door into the dungeon is a Teleport effect nearby.
  if (row.transitionKind === "dungeonEntranceTrigger") return;
  const evidence = [...sourceRefs(rowPath, row), ...refs(`${rowPath}/transitionKind`, `${rowPath}/destinationSceneName` )];
  if (row.destinationResolved !== true || !validReference(row.destinationScene)) {
    issue(issues, "unresolvedTransitionDestination", "The transition destination is not a valid resolved native scene reference.", refs(`${rowPath}/destinationScene`, `${rowPath}/destinationResolved`, `${rowPath}/destinationReferenceStatus`));
  } else {
    evidence.push(...refs(`${rowPath}/destinationScene`));
  }
  addFact(facts, "transition", evidence);
}

function classifyService(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const family = typeof row.family === "string" ? row.family : "";
  if (family === "craftingStation") {
    const evidence = [...sourceRefs(rowPath, row)];
    if (validReference(row.station)) evidence.push(...refs(`${rowPath}/station`));
    else issue(issues, "unresolvedServiceReference", "CraftingStation has no valid authored station reference.", refs(`${rowPath}/station`, `${rowPath}/stationID`, `${rowPath}/stationReferenceStatus`));
    const skills = array(row.craftSkills);
    if (row.craftSkillsAvailable !== true || skills === null) {
      issue(issues, "craftSkillsUnavailable", "CraftingStation craft skill rows are unavailable.", refs(`${rowPath}/craftSkillsAvailable`, `${rowPath}/craftSkills`));
    } else {
      for (let index = 0; index < skills.length; index += 1) {
        const skillPath = `${rowPath}/craftSkills/${index}`;
        const skill = record(skills[index]);
        if (skill === null || typeof skill.unavailable === "string") {
          issue(issues, "unavailableCraftSkill", skill?.unavailable as string ?? "The authored craft skill row is unavailable.", refs(skillPath));
        } else if (validReference(skill.craftSkill)) evidence.push(...refs(`${skillPath}/craftSkill`));
        else issue(issues, "unresolvedCraftSkillReference", "CraftingStation has a craft skill row without a valid native skill reference.", refs(`${skillPath}/craftSkill`, `${skillPath}/craftSkillID`, `${skillPath}/referenceStatus`));
      }
    }
    addFact(facts, "craftingService", evidence);
    return;
  }
  if (family === "propertyForSaleSign") {
    const evidence = [...sourceRefs(rowPath, row)];
    if (validReference(row.property)) evidence.push(...refs(`${rowPath}/property`));
    else issue(issues, "unresolvedServiceReference", "PropertyForSaleSign has no valid authored property reference.", refs(`${rowPath}/property`, `${rowPath}/propertyID`, `${rowPath}/propertyReferenceStatus`));
    if (validReference(row.currency)) evidence.push(...refs(`${rowPath}/currency`));
    else if (typeof row.currencyID === "number" && Number.isInteger(row.currencyID) && row.currencyID >= 0) issue(issues, "unresolvedCurrencyReference", "PropertyForSaleSign has no valid authored currency reference.", refs(`${rowPath}/currency`, `${rowPath}/currencyID`, `${rowPath}/currencyReferenceStatus`));
    addFact(facts, "propertyPurchaseService", evidence);
    return;
  }
  if (family === "corruptionAltar") {
    addFact(facts, "corruptionAltar", [...sourceRefs(rowPath, row), ...refs(`${rowPath}/altarName`)]);
    return;
  }
  issue(issues, "unsupportedServiceFamily", `Service family ${family || "<missing>"} is not supported.`, refs(`${rowPath}/family`));
}

function classifyCondition(row: RecordValue, rowPath: string, facts: FactBuilder, issues: RoleIssue[]): void {
  const family = typeof row.family === "string" ? row.family : "";
  if (family === "characterGraveyard") {
    const evidence = [...sourceRefs(rowPath, row)];
    const classes = array(row.requiredClasses);
    const races = array(row.requiredRaces);
    if (row.requiredClassesAvailable !== true || classes === null) {
      issue(issues, "requiredClassesUnavailable", "CharacterGraveyard class eligibility rows are unavailable.", refs(`${rowPath}/requiredClassesAvailable`, `${rowPath}/requiredClasses`));
    } else {
      for (let index = 0; index < classes.length; index += 1) {
        const classPath = `${rowPath}/requiredClasses/${index}`;
        const classRow = record(classes[index]);
        if (classRow === null || typeof classRow.unavailable === "string") issue(issues, "unavailableRequiredClass", classRow?.unavailable as string ?? "The required class row is unavailable.", refs(classPath));
        else if (validReference(classRow.classReference)) evidence.push(...refs(`${classPath}/classReference`));
        else issue(issues, "unresolvedRequiredClass", "CharacterGraveyard has a class row without a valid native class reference.", refs(`${classPath}/classReference`, `${classPath}/classID`, `${classPath}/referenceStatus`));
      }
    }
    if (row.requiredRacesAvailable !== true || races === null) {
      issue(issues, "requiredRacesUnavailable", "CharacterGraveyard race eligibility rows are unavailable.", refs(`${rowPath}/requiredRacesAvailable`, `${rowPath}/requiredRaces`));
    } else {
      for (let index = 0; index < races.length; index += 1) {
        const racePath = `${rowPath}/requiredRaces/${index}`;
        const raceRow = record(races[index]);
        if (raceRow === null || typeof raceRow.unavailable === "string") issue(issues, "unavailableRequiredRace", raceRow?.unavailable as string ?? "The required race row is unavailable.", refs(racePath));
        else if (validReference(raceRow.race)) evidence.push(...refs(`${racePath}/race`));
        else issue(issues, "unresolvedRequiredRace", "CharacterGraveyard has a race row without a valid native race reference.", refs(`${racePath}/race`, `${racePath}/raceID`, `${racePath}/referenceStatus`));
      }
    }
    addFact(facts, "respawnDestination", evidence);
    return;
  }
  if (family === "enhancedInteractableObject" || family === "activeRequirement" || family === "timedActiveRequirement" || family === "disableRequirement") {
    if (row.targetObject === null || row.targetObject === undefined) issue(issues, "missingConditionTarget", `${family} has no target GameObject; its activation effect is not attached to a player-facing source.`, refs(`${rowPath}/targetObject`, `${rowPath}/targetSource`));
    if (family === "activeRequirement") {
      if (row.requirementSource === undefined) {
        issue(issues, "missingRequirementSource", "ActiveRequirement has no native requirement source projection.", refs(`${rowPath}/requirementSource`));
      } else {
        const requirementSourceName = valueName(row.requirementSource);
        if (requirementSourceName === "Template" && (row.activationRequirement === null || row.activationRequirement === undefined)) {
          issue(issues, "missingActivationRequirement", "ActiveRequirement selects a template but has no activation requirement template.", refs(`${rowPath}/requirementSource`, `${rowPath}/activationRequirement`));
        }
        if (requirementSourceName === "RequirementGroup" && row.requirementGroupsAvailable !== true) {
          issue(issues, "requirementGroupsUnavailable", "ActiveRequirement selects requirement groups, but those groups are unavailable.", refs(`${rowPath}/requirementSource`, `${rowPath}/requirementGroupsAvailable`, `${rowPath}/requirementGroups`));
        }
      }
    } else if (family === "timedActiveRequirement" || family === "disableRequirement") {
      if (row.activationRequirement === null || row.activationRequirement === undefined) issue(issues, "missingActivationRequirement", `${family} has no activation requirement template.`, refs(`${rowPath}/activationRequirement`));
    }
    // These controllers retain conditions for another source. Their own rows are
    // intentionally kept without a player-facing role.
    return;
  }
  issue(issues, "unsupportedConditionFamily", `Condition source family ${family || "<missing>"} is not supported.`, refs(`${rowPath}/family`));
}

function classifyUnsupported(row: RecordValue, rowPath: string, issues: RoleIssue[]): void {
  const family = typeof row.family === "string" ? row.family : "<missing>";
  issue(issues, "unsupportedSourceFamily", `World source family ${family} has no verified player-facing role semantics.`, [...refs(`${rowPath}/family`), ...sourceRefs(rowPath, row)]);
  if (family === "randomActivator") {
    const targets = array(row.targets);
    if (row.targetCount === -1 || targets === null) issue(issues, "unsupportedTargetsUnavailable", "RandomActivator target rows are unavailable; native selection behavior remains unresolved.", refs(`${rowPath}/targets`, `${rowPath}/targetCount`));
    else targets.forEach((target, index) => {
      const targetRow = record(target);
      if (targetRow === null || typeof targetRow.unavailable === "string") issue(issues, "unavailableUnsupportedTarget", targetRow?.unavailable as string ?? "RandomActivator target row is unavailable.", refs(`${rowPath}/targets/${index}`));
    });
  }
}

function classify(collection: Collection, row: RecordValue, rowPath: string): { families: string[]; facts: RoleFact[]; issues: RoleIssue[] } {
  const facts: FactBuilder = new Map();
  const issues: RoleIssue[] = [];
  const family = familyFor(collection, row);
  switch (collection) {
    case "resourceProducers": classifyResource(row, rowPath, facts, issues); break;
    case "interactions": classifyInteraction(row, rowPath, facts, issues); break;
    case "containers": classifyContainer(row, rowPath, facts, issues); break;
    case "questZones": classifyQuestZone(row, rowPath, facts, issues); break;
    case "transitions": classifyTransition(row, rowPath, facts, issues); break;
    case "services": classifyService(row, rowPath, facts, issues); break;
    case "conditionSources": classifyCondition(row, rowPath, facts, issues); break;
    case "unsupportedSources": classifyUnsupported(row, rowPath, issues); break;
    case "mapIcons": classifyMapIcon(row, rowPath, facts); break;
  }
  return { families: [family], facts: [...facts.values()], issues };
}

export function collectWorldRoleFacts(world: WorldSources): WorldRoleRow[] {
  const result: WorldRoleRow[] = [];
  for (const collection of collections) {
    const rows = world[collection] as unknown;
    if (!Array.isArray(rows)) throw new Error(`World source ${collection} is not an array.`);
    rows.forEach((value, index) => {
      const rowPath = `/${collection}/${index}`;
      const row = record(value);
      if (row === null) {
        result.push({ collection, index, families: [collection], facts: [], issues: [{ reason: "unavailableSourceRow", detail: "The top-level source row is unavailable; no role semantics are inferred.", evidence: refs(rowPath) }] });
        return;
      }
      if (typeof row.unavailable === "string") {
        result.push({
          collection,
          index,
          families: [familyFor(collection, row)],
          facts: [],
          issues: [{ reason: "unavailableSourceRow", detail: row.unavailable, evidence: refs(`${rowPath}/unavailable`) }],
        });
        return;
      }
      result.push({ collection, index, ...classify(collection, row, rowPath) });
    });
  }
  return result;
}
