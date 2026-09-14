import { applicableConditionReferenceFields, type WorldSources } from "@afallon/contracts";

type AnyRecord = Record<string, any>;
type Reference = (source: string, targetKind: string, nativeId: number) => void;

function record(value: unknown, path: string): AnyRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`World source ${path} is not an object.`);
  return value as AnyRecord;
}

function array(value: unknown, path: string): AnyRecord[] {
  if (!Array.isArray(value)) throw new Error(`World source ${path} is not an array.`);
  return value as AnyRecord[];
}

function finiteInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`World source ${path} is not an integer.`);
  return value;
}

function countRows(rows: unknown[], expected: unknown, path: string) {
  const count = finiteInteger(expected, `${path} count`);
  if (count < 0 || rows.length !== count) throw new Error(`World source ${path} lost rows: expected ${count}, got ${rows.length}.`);
}

function countMaybeUnavailable(rows: unknown[], expected: unknown, available: unknown, path: string) {
  const count = finiteInteger(expected, `${path} count`);
  if (available !== true && available !== false) throw new Error(`World source ${path} availability is invalid.`);
  if (available === true) {
    if (count < 0 || rows.length !== count) throw new Error(`World source ${path} lost rows: expected ${count}, got ${rows.length}.`);
  } else if (count !== -1 || rows.length !== 0) {
    throw new Error(`World source ${path} reports unavailable data with rows or a non-sentinel count.`);
  }
}

function countNodeRows(row: AnyRecord, countKey: string, rowsKey: string, path: string, availableKey?: string) {
  const rows = array(row[rowsKey], `${path}.${rowsKey}`);
  const count = finiteInteger(row[countKey], `${path}.${countKey}`);
  countMaybeUnavailable(rows, count, availableKey === undefined ? count >= 0 : row[availableKey], `${path}.${rowsKey}`);
}

function validateSourceScene(reference: Reference, sourceValue: unknown, path: string) {
  const evidence = record(sourceValue, path);
  if (evidence.sourceScene === null || evidence.sourceScene === undefined) return;
  const scene = record(evidence.sourceScene, `${path}.sourceScene`);
  if (scene.nativeIdMatched === true && (scene.nativeId === null || scene.nativeId === undefined)) throw new Error(`World source ${path} marks a scene ID as matched without an ID.`);
  if (scene.nativeIdMatched === false && scene.nativeId !== null && scene.nativeId !== undefined) throw new Error(`World source ${path} exposes an unmatched scene ID.`);
  callReference(reference, `${path}.sourceScene`, "scenes", scene.nativeId);
}

function callReference(reference: Reference, source: string, targetKind: string, id: unknown) {
  if (id === null || id === undefined) return;
  reference(source, targetKind, finiteInteger(id, `${source} reference`));
}

function referencePair(reference: Reference, source: string, targetKind: string, id: unknown, target: unknown) {
  if (target !== null && target !== undefined) {
    const targetRecord = record(target, `${source}.${targetKind}`);
    const targetId = finiteInteger(targetRecord.nativeId, `${source}.${targetKind}.nativeId`);
    if (id !== null && id !== undefined && targetId !== id) throw new Error(`World source ${source} has mismatched ${targetKind} reference IDs.`);
    if (id === null || id === undefined) callReference(reference, source, targetKind, targetId);
    if (targetKind === "resources") validateResourceReference(reference, targetRecord, `${source}.${targetKind}`);
  }
  callReference(reference, source, targetKind, id);
}

function validateResourceReference(reference: Reference, resource: AnyRecord, path: string) {
  referencePair(reference, `${path}.skillRequiredID`, "skills", finiteInteger(resource.skillRequiredID, `${path}.skillRequiredID`), resource.skill);
  const ranks = array(resource.ranks, `${path}.ranks`);
  countMaybeUnavailable(ranks, resource.rankCount, resource.ranksAvailable, `${path}.ranks`);
  ranks.forEach((rankValue, index) => {
    const rank = record(rankValue, `${path}.ranks[${index}]`);
    if ("unavailable" in rank) return;
    referencePair(reference, `${path}.ranks[${index}].lootTable`, "lootTables", rank.lootTableID, rank.lootTable);
  });
}

const actionReferenceKinds: Record<string, string> = {
  effect: "effects",
  quest: "quests",
  treePoint: "treePoints",
  skill: "skills",
  weaponTemplate: "weaponTemplates",
  task: "tasks",
  resource: "resources",
  lootTable: "lootTables",
};
function validateRequirements(reference: Reference, groups: unknown[], path: string) {
  const rows = array(groups, path);
  const seenGroups = new Set<number>();
  rows.forEach((rawGroup, groupIndex) => {
    if (rawGroup === null) return;
    const group = record(rawGroup, `${path}[${groupIndex}]`);
    const projectedGroupIndex = finiteInteger(group.groupIndex, `${path}[${groupIndex}].groupIndex`);
    if (projectedGroupIndex !== groupIndex || seenGroups.has(projectedGroupIndex)) throw new Error(`World source ${path} has lost or duplicate requirement groups.`);
    seenGroups.add(projectedGroupIndex);
    const requirements = array(group.requirements, `${path}[${groupIndex}].requirements`);
    countRows(requirements, group.nativeRequirementCount, `${path}[${groupIndex}].requirements`);
    const seenRequirements = new Set<number>();
    requirements.forEach((rawRequirement, requirementIndex) => {
      if (rawRequirement === null) return;
      const requirement = record(rawRequirement, `${path}[${groupIndex}].requirements[${requirementIndex}]`);
      const projectedIndex = finiteInteger(requirement.requirementIndex, `${path}[${groupIndex}].requirements[${requirementIndex}].requirementIndex`);
      if (projectedIndex !== requirementIndex || seenRequirements.has(projectedIndex)) throw new Error(`World source ${path} has lost or duplicate requirement rows.`);
      seenRequirements.add(projectedIndex);
      const fields = applicableConditionReferenceFields(requirement.requirementType);
      for (const [field, targetKind] of fields) {
        callReference(reference, `${path}[${groupIndex}].requirements[${requirementIndex}].${field}`, targetKind, requirement[field]);
      }
    });
  });
}

function validateTemplate(reference: Reference, template: unknown, path: string) {
  if (template === null || template === undefined) return;
  const value = record(template, path);
  const groups = array(value.groups, `${path}.groups`);
  countRows(groups, value.nativeGroupCount, `${path}.groups`);
  validateRequirements(reference, groups, `${path}.groups`);
}

function validateGameActionList(reference: Reference, listValue: unknown, path: string) {
  const list = record(listValue, path);
  const actions = array(list.actions, `${path}.actions`);
  countMaybeUnavailable(actions, list.nativeActionCount, list.available, `${path}.actions`);
  const seen = new Set<string>();
  actions.forEach((actionValue, actionIndex) => {
    const action = record(actionValue, `${path}.actions[${actionIndex}]`);
    if ("unavailable" in action) return;
    const sourceIndex = finiteInteger(action.sourceIndex, `${path}.actions[${actionIndex}].sourceIndex`);
    if (sourceIndex !== actionIndex) throw new Error(`World source ${path}.actions lost or reordered rows.`);
    const sourceFieldPath = action.sourceFieldPath;
    if (typeof sourceFieldPath !== "string" || seen.has(sourceFieldPath)) throw new Error(`World source ${path}.actions contains duplicate rows.`);
    seen.add(sourceFieldPath);
    const requirements = array(action.requirements, `${path}.actions[${actionIndex}].requirements`);
    countMaybeUnavailable(requirements, action.nativeRequirementGroupCount, action.nativeRequirementGroupCount >= 0, `${path}.actions[${actionIndex}].requirements`);
    validateRequirements(reference, requirements, `${path}.actions[${actionIndex}].requirements`);
    const actionType = record(action.type, `${path}.actions[${actionIndex}].type`);
    if (actionType.value !== 22) {
      if (action.teleport !== null) throw new Error(`World source ${path}.actions[${actionIndex}] projects a teleport payload for a non-Teleport action.`);
      return;
    }
    if (action.teleport === null) return;
    const teleport = record(action.teleport, `${path}.actions[${actionIndex}].teleport`);
    const teleportType = record(teleport.type, `${path}.actions[${actionIndex}].teleport.type`);
    if (teleportType.value === 0 && teleport.sceneNativeId >= 0) {
      callReference(reference, `${path}.actions[${actionIndex}].teleport.sceneNativeId`, "scenes", teleport.sceneNativeId);
    }
  });
}

function validateGameActions(reference: Reference, value: unknown, path: string) {
  const gameActions = record(value, path);
  const template = gameActions.template;
  if (template !== null) validateGameActionList(reference, template, `${path}.template`);
  validateGameActionList(reference, gameActions.inline, `${path}.inline`);
}

function validateAction(reference: Reference, actionValue: unknown, path: string) {
  const action = record(actionValue, path);
  if ("unavailable" in action) return;
  const referenceKind = action.referenceKind;
  const targetKind = referenceKind === null ? undefined : actionReferenceKinds[referenceKind];
  if (referenceKind !== null && targetKind === undefined) {
    if (action.referenceId !== null && action.referenceId !== undefined) throw new Error(`World source ${path} uses an unknown action reference kind.`);
  } else if (targetKind !== undefined) {
    referencePair(reference, path, targetKind, action.referenceId, action.reference);
  }
  const actionType = record(action.type, `${path}.type`);
  if (actionType.value === 9) validateGameActions(reference, action.gameActions, `${path}.gameActions`);
  if (action.effectiveProbabilityResolved === true) throw new Error(`World source ${path} claims an unresolved action probability was resolved.`);
}

function validateChestLoot(reference: Reference, projectionValue: unknown, path: string) {
  const projection = record(projectionValue, path);
  const lootRows = array(projection.lootInstances, `${path}.lootInstances`);
  countMaybeUnavailable(lootRows, projection.lootInstanceCount, projection.lootInstancesAvailable, `${path}.lootInstances`);
  const seen = new Set<string>();
  lootRows.forEach((rawLoot, index) => {
    const loot = record(rawLoot, `${path}.lootInstances[${index}]`);
    const fieldPath = typeof loot.sourceFieldPath === "string" ? loot.sourceFieldPath : `${index}`;
    if (seen.has(fieldPath)) throw new Error(`World source ${path}.lootInstances contains duplicate rows.`);
    seen.add(fieldPath);
    if ("unavailable" in loot) return;
    referencePair(reference, `${path}.lootInstances[${index}].item`, "items", loot.itemID, loot.item);

  });
}

function validateCandidateOutput(reference: Reference, outputValue: unknown, path: string) {
  const output = record(outputValue, path);
  if (output.effectiveProbabilityResolved === true) throw new Error(`World source ${path} claims an unresolved output probability was resolved.`);
  if (output.outputKind === "resource") {
    referencePair(reference, `${path}.resource`, "resources", output.resourceID, output.resource);
  } else if (output.outputKind === "lootTable") {
    referencePair(reference, `${path}.lootTable`, "lootTables", output.lootTableID, output.lootTable);
  } else if (output.outputKind === "chestLootInstances") {
    validateChestLoot(reference, output.loot, `${path}.loot`);
  } else {
    throw new Error(`World source ${path} uses an unsupported candidate output kind.`);
  }
}

function validateResourceProducer(reference: Reference, rowValue: unknown, index: number) {
  const path = `resourceProducers[${index}]`;
  const row = record(rowValue, path);
  if ("unavailable" in row) return;
  if (row.gatheringRole.skillID !== row.gatheringSkillID) throw new Error(`World source ${path} has mismatched gathering skill projections.`);
  referencePair(reference, `${path}.gatheringSkill`, "skills", row.gatheringSkillID, row.gatheringSkill);
  if ((row.gatheringSkillID === null || row.gatheringSkillID === undefined) && row.gatheringRole.skillID !== null && row.gatheringRole.skillID !== undefined) {
    referencePair(reference, `${path}.gatheringRole.skill`, "skills", row.gatheringRole.skillID, row.gatheringRole.skill);
  }
  if (row.resourceNode !== null && row.resourceNode !== undefined) referencePair(reference, `${path}.resourceNode`, "resources", undefined, row.resourceNode);
  if (row.producerFamily === "interactiveNode") {
    validateNodeProjection(reference, row.projection, `${path}.projection`);
    return;
  }
  const options = array(row.options, `${path}.options`);
  countMaybeUnavailable(options, row.optionCount, row.optionsAvailable, `${path}.options`);
  const possibleOutputs = array(row.possibleOutputs, `${path}.possibleOutputs`);
  countMaybeUnavailable(possibleOutputs, row.possibleOutputCount, row.possibleOutputsAvailable, `${path}.possibleOutputs`);
  const weights = array(row.computeWeightsSamples, `${path}.computeWeightsSamples`);
  if (row.optionsAvailable === true && weights.length !== options.length) throw new Error(`World source ${path}.computeWeightsSamples lost rows.`);
  let nestedOutputCount = 0;
  const expectedOutputKeys: string[] = [];
  options.forEach((optionValue, optionIndex) => {
    const option = record(optionValue, `${path}.options[${optionIndex}]`);
    if ("unavailable" in option) return;
    if (option.optionIndex !== optionIndex) throw new Error(`World source ${path}.options has a lost or duplicate option index.`);
    const outputs = array(option.possibleOutputs, `${path}.options[${optionIndex}].possibleOutputs`);
    nestedOutputCount += outputs.length;
    const seenOutputs = new Set<string>();
    outputs.forEach((outputValue, outputIndex) => {
      const output = record(outputValue, `${path}.options[${optionIndex}].possibleOutputs[${outputIndex}]`);
      const outputKey = output.sourceFieldPath;
      if (typeof outputKey !== "string" || seenOutputs.has(outputKey)) throw new Error(`World source ${path}.options[${optionIndex}] has duplicate candidate outputs.`);
      seenOutputs.add(outputKey);
      expectedOutputKeys.push(`${optionIndex}|${outputKey}`);
    });
    const seenCandidateActions = new Set<string>();
    for (const [candidateIndex, candidateValue] of array(option.authoredInteractables, `${path}.options[${optionIndex}].authoredInteractables`).entries()) {
      const candidate = record(candidateValue, `${path}.options[${optionIndex}].authoredInteractables[${candidateIndex}]`);
      if ("unavailable" in candidate) continue;
      for (const [actionIndex, actionValue] of array(candidate.actions, `${path}.options[${optionIndex}].authoredInteractables[${candidateIndex}].actions`).entries()) {
        const action = record(actionValue, `${path}.options[${optionIndex}].authoredInteractables[${candidateIndex}].actions[${actionIndex}]`);
        if ("unavailable" in action) continue;
        const actionPath = action.sourceFieldPath;
        if (seenCandidateActions.has(actionPath)) throw new Error(`World source ${path}.options[${optionIndex}] has duplicate candidate actions.`);
        seenCandidateActions.add(actionPath);
        validateAction(reference, action, `${path}.options[${optionIndex}].authoredInteractables[${candidateIndex}].actions[${actionIndex}]`);
      }
      validateTemplate(reference, candidate.requirementsTemplate, `${path}.options[${optionIndex}].authoredInteractables[${candidateIndex}].requirementsTemplate`);
    }
    for (const [chestIndex, chestValue] of array(option.authoredChests, `${path}.options[${optionIndex}].authoredChests`).entries()) {
      const chest = record(chestValue, `${path}.options[${optionIndex}].authoredChests[${chestIndex}]`);
      if ("unavailable" in chest) continue;
      validateChestLoot(reference, chest.loot, `${path}.options[${optionIndex}].authoredChests[${chestIndex}].loot`);
    }
    outputs.forEach((outputValue, outputIndex) => validateCandidateOutput(reference, outputValue, `${path}.options[${optionIndex}].possibleOutputs[${outputIndex}]`));
  });
  if (nestedOutputCount !== possibleOutputs.length) throw new Error(`World source ${path}.possibleOutputs lost candidate outputs.`);
  const seenFlattenedOutputs = new Set<string>();
  possibleOutputs.forEach((wrapperValue, outputIndex) => {
    const wrapper = record(wrapperValue, `${path}.possibleOutputs[${outputIndex}]`);
    const optionIndex = finiteInteger(wrapper.optionIndex, `${path}.possibleOutputs[${outputIndex}].optionIndex`);
    if (optionIndex < 0 || optionIndex >= options.length) throw new Error(`World source ${path}.possibleOutputs has an invalid option index.`);
    const output = record(wrapper.output, `${path}.possibleOutputs[${outputIndex}].output`);
    const outputKey = output.sourceFieldPath;
    if (typeof outputKey !== "string") throw new Error(`World source ${path}.possibleOutputs has an output without a source path.`);
    const flattenedKey = `${optionIndex}|${outputKey}`;
    if (seenFlattenedOutputs.has(flattenedKey) || expectedOutputKeys[outputIndex] !== flattenedKey) throw new Error(`World source ${path}.possibleOutputs lost or reordered candidate outputs.`);
    seenFlattenedOutputs.add(flattenedKey);
    validateCandidateOutput(reference, output, `${path}.possibleOutputs[${outputIndex}].output`);
  });
  weights.forEach((weightValue, weightIndex) => {
    const weight = record(weightValue, `${path}.computeWeightsSamples[${weightIndex}]`);
    if ("unavailable" in weight) return;
    if (weight.sourceFieldPath !== options[weightIndex]!.sourceFieldPath) throw new Error(`World source ${path}.computeWeightsSamples lost or reordered rows.`);
  });
}

function validateInteraction(reference: Reference, rowValue: unknown, index: number) {
  const path = `interactions[${index}]`;
  const row = record(rowValue, path);
  if (row.family === "chest") {
    validateChestLoot(reference, row.projection, `${path}.projection`);
    return;
  }
  if (row.family === "interactiveNode") {
    validateNodeProjection(reference, row.projection, `${path}.projection`);
    return;
  }
  countMaybeUnavailable(row.requiredNPCRanks, row.requiredNPCRankCount, row.requiredNPCRanksAvailable, `${path}.requiredNPCRanks`);
  const actions = array(row.actions, `${path}.actions`);
  countMaybeUnavailable(actions, row.actionCount, row.actionsAvailable, `${path}.actions`);
  const seen = new Set<string>();
  actions.forEach((actionValue, actionIndex) => {
    const action = record(actionValue, `${path}.actions[${actionIndex}]`);
    if ("unavailable" in action) return;
    if (seen.has(action.sourceFieldPath)) throw new Error(`World source ${path}.actions contains duplicate rows.`);
    seen.add(action.sourceFieldPath);
    validateAction(reference, action, `${path}.actions[${actionIndex}]`);
  });
  validateTemplate(reference, row.requirementsTemplate, `${path}.requirementsTemplate`);
  referencePair(reference, `${path}.resource`, "resources", row.resourceID, row.resource);
}

function validateNodeProjection(reference: Reference, projectionValue: unknown, path: string) {
  const projection = record(projectionValue, path);
  countNodeRows(projection, "containerTableCount", "containerTablesData", path, "containerTablesDataAvailable");
  countNodeRows(projection, "effectCount", "effectsData", path, "effectsDataAvailable");
  countNodeRows(projection, "skillCount", "skillsData", path, "skillsDataAvailable");
  countRows(projection.questsData, projection.questsDataAvailable ? 1 : 0, `${path}.questsData`);
  countNodeRows(projection, "abilityCount", "abilitiesData", path);
  countNodeRows(projection, "treePointCount", "treePointsData", path);
  countNodeRows(projection, "skillExperienceCount", "skillExpData", path);
  countNodeRows(projection, "taskCount", "taskData", path);
  referencePair(reference, `${path}.gatherSkill`, "skills", projection.gatherSkillID, projection.gatherSkill);
  referencePair(reference, `${path}.gatheringRole.skill`, "skills", projection.gatheringRole.skillID, projection.gatheringRole.skill);
  const outputs = record(projection.possibleOutputs, `${path}.possibleOutputs`);
  if (projection.containerTablesDataAvailable) {
    countRows(array(outputs.containerLootTables, `${path}.possibleOutputs.containerLootTables`), projection.containerTableCount, `${path}.possibleOutputs.containerLootTables`);
  } else if (outputs.containerLootTables !== null) {
    throw new Error(`World source ${path} reports container outputs without an available source list.`);
  }
  if (projection.resourceNode !== null) {
    const ranks = record(outputs.resourceRanks, `${path}.possibleOutputs.resourceRanks`);
    if (ranks.count !== projection.resourceNode.rankCount || ranks.available !== projection.resourceNode.ranksAvailable) throw new Error(`World source ${path} has inconsistent resource rank counts.`);
  } else if (outputs.resourceRanks !== null) {
    throw new Error(`World source ${path} reports resource ranks without a resource.`);
  }
  const nodeReferences: Record<string, { idField: string; referenceField: string; targetKind: string }> = {
    containerTablesData: { idField: "lootTableID", referenceField: "lootTable", targetKind: "lootTables" },
    effectsData: { idField: "effectID", referenceField: "effect", targetKind: "effects" },
    questsData: { idField: "questID", referenceField: "quest", targetKind: "quests" },
    skillsData: { idField: "skillID", referenceField: "skill", targetKind: "skills" },
    abilitiesData: { idField: "abilityID", referenceField: "ability", targetKind: "abilities" },
    treePointsData: { idField: "treePointID", referenceField: "treePoint", targetKind: "treePoints" },
    skillExpData: { idField: "skillID", referenceField: "skill", targetKind: "skills" },
    taskData: { idField: "taskID", referenceField: "task", targetKind: "tasks" },
  };
  for (const [key, typedReference] of Object.entries(nodeReferences)) {
    const rows = projection[key];
    if (!Array.isArray(rows)) continue;
    rows.forEach((rawRow: unknown, index: number) => {
      const row = record(rawRow, `${path}.${key}[${index}]`);
      if ("unavailable" in row) return;
      referencePair(reference, `${path}.${key}[${index}]`, typedReference.targetKind, row[typedReference.idField], row[typedReference.referenceField]);
    });
  }
  if (projection.resourceNode !== undefined) referencePair(reference, `${path}.resourceNode`, "resources", undefined, projection.resourceNode);
}

function validateQuestZone(reference: Reference, rowValue: unknown, index: number) {
  const path = `questZones[${index}]`;
  const row = record(rowValue, path);
  const worldQuest = row.worldQuest;
  if (worldQuest !== null) validateWorldQuestReference(reference, worldQuest, `${path}.worldQuest`);
  const quests = array(row.possibleQuests, `${path}.possibleQuests`);
  countMaybeUnavailable(quests, row.possibleQuestCount, row.possibleQuestsAvailable, `${path}.possibleQuests`);
  quests.forEach((poolValue, poolIndex) => {
    const pool = record(poolValue, `${path}.possibleQuests[${poolIndex}]`);
    if ("unavailable" in pool) return;
    validateWorldQuestReference(reference, pool.worldQuest, `${path}.possibleQuests[${poolIndex}].worldQuest`);
  });
  if (row.currentQuestObservation?.present === true) validateWorldQuestReference(reference, row.currentQuestObservation.worldQuest, `${path}.currentQuestObservation.worldQuest`);
}

function validateWorldQuestReference(reference: Reference, value: unknown, path: string) {
  const quest = record(value, path);
  callReference(reference, path, "worldQuests", quest.nativeId);
  referencePair(reference, `${path}.quest`, "quests", undefined, quest.quest);
}

function validateService(reference: Reference, rowValue: unknown, index: number) {
  const path = `services[${index}]`;
  const row = record(rowValue, path);
  if (row.family === "craftingStation") {
    const skills = array(row.craftSkills, `${path}.craftSkills`);
    countMaybeUnavailable(skills, row.craftSkillCount, row.craftSkillsAvailable, `${path}.craftSkills`);
    skills.forEach((skillValue, skillIndex) => {
      const skill = record(skillValue, `${path}.craftSkills[${skillIndex}]`);
      if ("unavailable" in skill) return;
      referencePair(reference, `${path}.craftSkills[${skillIndex}]`, "skills", skill.craftSkillID, skill.craftSkill);
    });
    return;
  }
  referencePair(reference, `${path}.property`, "properties", row.propertyID, row.property);
  referencePair(reference, `${path}.currency`, "currencies", row.currencyID, row.currency);
}

function validateCondition(reference: Reference, rowValue: unknown, index: number) {
  const path = `conditionSources[${index}]`;
  const row = record(rowValue, path);
  if (row.family === "characterGraveyard") {
    const classes = array(row.requiredClasses, `${path}.requiredClasses`);
    const races = array(row.requiredRaces, `${path}.requiredRaces`);
    countMaybeUnavailable(classes, row.requiredClassCount, row.requiredClassesAvailable, `${path}.requiredClasses`);
    countMaybeUnavailable(races, row.requiredRaceCount, row.requiredRacesAvailable, `${path}.requiredRaces`);
    classes.forEach((classValue, classIndex) => {
      const classRow = record(classValue, `${path}.requiredClasses[${classIndex}]`);
      if ("unavailable" in classRow) return;
      referencePair(reference, `${path}.requiredClasses[${classIndex}]`, "classes", classRow.classID, classRow.classReference);
    });
    races.forEach((raceValue, raceIndex) => {
      const raceRow = record(raceValue, `${path}.requiredRaces[${raceIndex}]`);
      if ("unavailable" in raceRow) return;
      referencePair(reference, `${path}.requiredRaces[${raceIndex}]`, "races", raceRow.raceID, raceRow.race);
    });
    return;
  }
  validateTemplate(reference, row.activationRequirement, `${path}.activationRequirement`);
  validateTemplate(reference, row.activationRequirements, `${path}.activationRequirements`);
  validateTemplate(reference, row.deactivationRequirements, `${path}.deactivationRequirements`);
  if (row.family === "activeRequirement") {
    const groups = array(row.requirementGroups, `${path}.requirementGroups`);
    countMaybeUnavailable(groups, row.requirementGroupCount, row.requirementGroupsAvailable, `${path}.requirementGroups`);
    validateRequirements(reference, groups, `${path}.requirementGroups`);
  }
  if (row.targetSource !== null && row.targetSource !== undefined) {
    const targetSource = record(row.targetSource, `${path}.targetSource`);
    const scene = record(targetSource.sourceScene, `${path}.targetSource.sourceScene`);
    callReference(reference, `${path}.targetSource.sourceScene`, "scenes", scene.nativeId);
  }
}

export function validateWorldSources(value: WorldSources, reference: Reference): void {
  const artifact = value as unknown as AnyRecord;
  if (artifact.schemaVersion !== "compendium.world-sources.v7") throw new Error("World source schema version is invalid.");
  const totals = record(artifact.totals, "totals");
  const sourceTotalsValue = record(totals.source, "totals.source");
  const exportedTotalsValue = record(totals.exported, "totals.exported");
  const sourceArrays = {
    oreSpawners: artifact.resourceProducers.filter((row: AnyRecord) => row.producerFamily === "oreSpawner"),
    interactableObjects: artifact.interactions.filter((row: AnyRecord) => row.family === "interactableObject"),
    interactableTriggers: artifact.interactions.filter((row: AnyRecord) => row.family === "interactableTrigger"),
    storageContainers: artifact.containers.filter((row: AnyRecord) => row.family === "storageContainer"),
    interactiveNodes: artifact.interactions.filter((row: AnyRecord) => row.family === "interactiveNode"),
    chests: artifact.containers.filter((row: AnyRecord) => row.family === "chest"),
    worldQuestZones: artifact.questZones.filter((row: AnyRecord) => row.family === "worldQuestZone"),
    questScenePortals: artifact.transitions.filter((row: AnyRecord) => row.transitionKind === "questScenePortal"),
    dungeonEntranceTriggers: artifact.transitions.filter((row: AnyRecord) => row.transitionKind === "dungeonEntranceTrigger"),
    craftingStations: artifact.services.filter((row: AnyRecord) => row.family === "craftingStation"),
    propertyForSaleSigns: artifact.services.filter((row: AnyRecord) => row.family === "propertyForSaleSign"),
    corruptionAltars: artifact.services.filter((row: AnyRecord) => row.family === "corruptionAltar"),
    heroicConsoles: artifact.unsupportedSources.filter((row: AnyRecord) => row.family === "heroicConsole"),
    characterGraveyards: artifact.conditionSources.filter((row: AnyRecord) => row.family === "characterGraveyard"),
    enhancedInteractableObjects: artifact.conditionSources.filter((row: AnyRecord) => row.family === "enhancedInteractableObject"),
    activeRequirements: artifact.conditionSources.filter((row: AnyRecord) => row.family === "activeRequirement"),
    timedActiveRequirements: artifact.conditionSources.filter((row: AnyRecord) => row.family === "timedActiveRequirement"),
    disableRequirements: artifact.conditionSources.filter((row: AnyRecord) => row.family === "disableRequirement"),
    randomActivators: artifact.unsupportedSources.filter((row: AnyRecord) => row.family === "randomActivator"),
    interactiveZones: artifact.unsupportedSources.filter((row: AnyRecord) => row.family === "interactiveZone"),
    mapZones: artifact.mapZones,
    regions: artifact.regions,
  };
  for (const [kind, rows] of Object.entries(sourceArrays)) {
    countRows(rows, sourceTotalsValue[kind], `totals.source.${kind}`);
  }
  const exportedArrays: Record<string, unknown[]> = {
    resourceProducers: array(artifact.resourceProducers, "resourceProducers"),
    interactions: array(artifact.interactions, "interactions"),
    containers: array(artifact.containers, "containers"),
    questZones: array(artifact.questZones, "questZones"),
    transitions: array(artifact.transitions, "transitions"),
    services: array(artifact.services, "services"),
    conditionSources: array(artifact.conditionSources, "conditionSources"),
    unsupportedSources: array(artifact.unsupportedSources, "unsupportedSources"),
    mapZones: array(artifact.mapZones, "mapZones"),
    regions: array(artifact.regions, "regions"),
  };
  for (const [kind, rows] of Object.entries(exportedArrays)) {
    countRows(rows, exportedTotalsValue[kind], `totals.exported.${kind}`);
    const typedRows = rows as AnyRecord[];
    typedRows.forEach((row, index) => {
      if (row.source !== undefined) validateSourceScene(reference, row.source, `${kind}[${index}].source`);
    });
  }
  const resourceRows = exportedArrays.resourceProducers as AnyRecord[];
  const interactionRows = exportedArrays.interactions as AnyRecord[];
  const containerRows = exportedArrays.containers as AnyRecord[];
  const questRows = exportedArrays.questZones as AnyRecord[];
  const transitionRows = exportedArrays.transitions as AnyRecord[];
  const serviceRows = exportedArrays.services as AnyRecord[];
  const conditionRows = exportedArrays.conditionSources as AnyRecord[];
  const unsupportedRows = exportedArrays.unsupportedSources as AnyRecord[];
  if (resourceRows.some(row => row.producerFamily !== "oreSpawner" && row.producerFamily !== "interactiveNode")) throw new Error("World resource producers contain an unknown producer family.");
  if (resourceRows.filter(row => row.producerFamily === "interactiveNode").length !== interactionRows.filter(row => row.family === "interactiveNode" && row.roleEvidence?.resource === true).length) throw new Error("World resource producers do not reconcile interactive-node resource roles.");
  if (interactionRows.length !== sourceArrays.interactableObjects.length + sourceArrays.interactableTriggers.length + sourceArrays.interactiveNodes.length + sourceArrays.chests.length) throw new Error("World interactions do not reconcile source families.");
  if (containerRows.some(row => row.family !== "chest" && row.family !== "interactiveNode")) throw new Error("World containers contain an unknown source family.");
  if (containerRows.filter(row => row.family === "interactiveNode").length !== interactionRows.filter(row => row.family === "interactiveNode" && row.roleEvidence?.container === true).length) throw new Error("World containers do not reconcile interactive-node container roles.");
  if (containerRows.length !== sourceArrays.chests.length + sourceArrays.storageContainers.length + containerRows.filter(row => row.family === "interactiveNode").length) throw new Error("World containers do not reconcile source families.");
  if (questRows.some(row => row.family !== "worldQuestZone") || questRows.length !== sourceArrays.worldQuestZones.length) throw new Error("World quest zones do not reconcile source families.");
  if (transitionRows.some(row => row.transitionKind !== "questScenePortal" && row.transitionKind !== "dungeonEntranceTrigger") || transitionRows.length !== sourceArrays.questScenePortals.length + sourceArrays.dungeonEntranceTriggers.length) throw new Error("World transitions do not reconcile source families.");
  if (serviceRows.some(row => row.family !== "craftingStation" && row.family !== "propertyForSaleSign" && row.family !== "corruptionAltar") || serviceRows.length !== sourceArrays.craftingStations.length + sourceArrays.propertyForSaleSigns.length + sourceArrays.corruptionAltars.length) throw new Error("World services do not reconcile source families.");
  const conditionFamilies = new Set(["characterGraveyard", "enhancedInteractableObject", "activeRequirement", "timedActiveRequirement", "disableRequirement"]);
  if (conditionRows.some(row => !conditionFamilies.has(row.family)) || conditionRows.length !== sourceArrays.characterGraveyards.length + sourceArrays.enhancedInteractableObjects.length + sourceArrays.activeRequirements.length + sourceArrays.timedActiveRequirements.length + sourceArrays.disableRequirements.length) throw new Error("World condition sources do not reconcile source families.");
  const unsupportedFamilies = new Set(["heroicConsole", "randomActivator", "interactiveZone"]);
  if (unsupportedRows.some(row => !unsupportedFamilies.has(row.family)) || unsupportedRows.length !== sourceArrays.heroicConsoles.length + sourceArrays.randomActivators.length + sourceArrays.interactiveZones.length) throw new Error("World unsupported sources do not reconcile source families.");
  const sourceRows = array(artifact.unresolved, "unresolved");
  countRows(sourceRows, totals.unresolved, "totals.unresolved");
  for (const row of sourceRows) {
    const diagnosticRow = record(row, "unresolved");
    if (typeof diagnosticRow.kind !== "string" || typeof diagnosticRow.detail !== "string") throw new Error("World source diagnostics require kind and detail.");
  }
  resourceRows.forEach((row, index) => validateResourceProducer(reference, row, index));
  (exportedArrays.interactions as AnyRecord[]).forEach((row, index) => validateInteraction(reference, row, index));
  (exportedArrays.containers as AnyRecord[]).forEach((row, index) => {
    if (row.projection) {
      if (row.projection.lootInstances !== undefined) validateChestLoot(reference, row.projection, `containers[${index}].projection`);
      else validateNodeProjection(reference, row.projection, `containers[${index}].projection`);
    }
  });
  (exportedArrays.questZones as AnyRecord[]).forEach((row, index) => validateQuestZone(reference, row, index));
  (exportedArrays.transitions as AnyRecord[]).forEach((row, index) => {
    if (row.destinationScene !== null) referencePair(reference, `transitions[${index}].destinationScene`, "scenes", undefined, row.destinationScene);
  });
  (exportedArrays.services as AnyRecord[]).forEach((row, index) => validateService(reference, row, index));
  (exportedArrays.conditionSources as AnyRecord[]).forEach((row, index) => validateCondition(reference, row, index));
  (exportedArrays.mapZones as AnyRecord[]).forEach((row, index) => {
    if (row.captureBoundsValidated === true) throw new Error(`World source mapZones[${index}] claims unvalidated bounds are valid.`);
  });
}
