import type { CatalogCondition, CatalogEntityRow, CatalogGatedSourceRow, CatalogQuestRow, CatalogTaskFacts } from "@afallon/contracts/catalog";
import type { EntityRef, PublicQuest, QuestObjective, QuestStart, QuestTurnIn, QuestWorldChange, Ref } from "@afallon/contracts/public";
import { placedRules } from "../placed-rules";
import { displayName, plainText } from "../text";
import { baseDocument, description, type DocumentProjectionInput, endpointOrUnknown, groupPlacedRows, mergeRefs, optionalCount, pageOrVariant, projectAvailability, publishedPlacements, recordLocations, type ReferenceResolver, refKey, type RelationIndexes, requirementsFor } from "./projection";

const TASK_TYPE: Readonly<Record<string, QuestObjective["type"]>> = {
  killNPC: "killNpc", getItem: "getItem", talkToNPC: "talkToNpc", useItem: "useItem",
  enterScene: "enterScene", enterRegion: "enterRegion", learnAbility: "learnAbility",
};

/** `text` is the objective's display text; an empty text falls back to the native task type. */
export function projectQuestObjective(task: CatalogTaskFacts, resolve: ReferenceResolver, index: number, text: string, completions: QuestObjective["completions"]): QuestObjective {
  const type = TASK_TYPE[task.taskType];
  const base = { index, text: plainText(text) || plainText(task.taskType) || "Objective", completions };
  if (!type || type === "unsupported") return { ...base, type: "unsupported", rawType: plainText(task.taskType) || "unknown" };
  const target = endpointOrUnknown(resolve, task.target, displayName(task.sceneName ?? "") || "Unknown target");
  const count = Math.max(1, optionalCount(task.count) ?? 1);
  switch (type) {
    case "killNpc": return { ...base, type, target, count };
    case "getItem": return { ...base, type, target, count, keepItems: task.keepItems === true };
    case "talkToNpc": return { ...base, type, target };
    case "useItem": return { ...base, type, target, count };
    case "enterScene": return { ...base, type, target };
    case "enterRegion": return { ...base, type };
    case "learnAbility": return { ...base, type, target };
    default: return { ...base, type: "unsupported", rawType: plainText(task.taskType) || "unknown" };
  }
}

export function objectiveForRow(row: CatalogQuestRow, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): QuestObjective {
  const task = row.task!;
  const entity = indexes.entities.get(task.entityKey);
  const text = plainText(entity?.description ?? "") || plainText(entity?.name ?? "");
  const completions = groupPlacedRows(row.completions.map((completion) => ({
    ...(displayName(completion.label ?? "") ? { label: displayName(completion.label!) } : {}),
    availability: projectAvailability(completion.availability, conditions, input.resolve),
    placements: publishedPlacements(completion.placementIds, input.placements),
  })));
  return projectQuestObjective(task, input.resolve, row.index, text, completions);
}

function conditionNamesQuest(conditionId: string, questKey: string, conditions: ReadonlyMap<string, CatalogCondition>): boolean {
  const condition = conditions.get(conditionId);
  if (!condition) throw new Error(`Missing catalog condition ${conditionId}.`);
  return condition.requirements.some((group) => group.requirements.some((requirement) => requirement.references.quest?.entityKey === questKey));
}

const WORLD_SOURCE_KIND: Readonly<Record<CatalogGatedSourceRow["family"], QuestWorldChange["sourceKind"]>> = {
  npcProducer: "creature", interaction: "object", container: "container", resource: "resource",
  craftingStation: "craftingStation", worldQuestZone: "worldZone",
};

// A character that gives or completes a quest appears once, with the areas of every variant that does so.
function questPeople(rows: readonly CatalogQuestRow[], kind: "giver" | "turnIn", input: DocumentProjectionInput, indexes: RelationIndexes): QuestTurnIn[] {
  const people = new Map<string, { refs: Ref[]; areas: Set<string> }>();
  for (const row of rows) {
    if (row.kind !== kind || row.counterpart === null) continue;
    const ref = input.resolve(row.counterpart);
    const person = people.get(refKey(ref)) ?? { refs: [], areas: new Set<string>() };
    person.refs.push(ref);
    for (const placement of recordLocations(row.counterpart.entityKey ?? "", indexes, input.placements)) person.areas.add(placement.label);
    people.set(refKey(ref), person);
  }
  return [...people.values()].map(({ refs, areas }) => ({ npc: pageOrVariant(refs, input), areas: [...areas].sort() }));
}

export function projectQuest(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicQuest {
  const fact = input.facts.quests.find((candidate) => candidate.entityKey === entity.entityKey);
  const rows = indexes.questsByQuest.get(entity.entityKey) ?? [];
  const chainName = displayName(fact?.chainName ?? "");
  const chain = chainName ? input.facts.quests.filter((candidate) => displayName(candidate.chainName ?? "") === chainName)
    .sort((left, right) => (left.chainOrder ?? Infinity) - (right.chainOrder ?? Infinity) || left.entityKey.localeCompare(right.entityKey)) : [];
  const starts: QuestStart[] = questPeople(rows, "giver", input, indexes).map((person) => ({ kind: "npc" as const, ...person }));
  starts.push(...groupPlacedRows(rows.filter((row) => row.kind === "worldOffer" && row.worldOffer !== null).map((row) => ({
    kind: "worldZone" as const,
    placements: publishedPlacements(row.placementIds, input.placements),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    ...(row.worldOffer!.zoneDelaySeconds === null ? {} : { zoneDelaySeconds: row.worldOffer!.zoneDelaySeconds }),
    pool: [...new Map(row.worldOffer!.pool.filter((quest) => quest.entityKey !== entity.entityKey)
      .map((quest) => [quest.entityKey ?? quest.label, input.resolve(quest)] as const)).values()].sort((left, right) =>
      (left.key ?? left.label).localeCompare(right.key ?? right.label)),
  }))));
  starts.push(...groupPlacedRows(rows.filter((row) => row.kind === "objectStart").map((row) => ({
    kind: "object" as const, ...(displayName(row.label ?? "") ? { label: displayName(row.label!) } : {}),
    placements: publishedPlacements(row.placementIds, input.placements),
    availability: projectAvailability(row.availability, conditions, input.resolve),
  }))));
  const unlocks = input.facts.quests.filter((candidate) => candidate.conditionIds.some((id) => conditionNamesQuest(id, entity.entityKey, conditions)))
    .map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey }));
  // Only resolve a source name to an item when this quest explicitly asks for that same item.
  // Matching arbitrary page names would turn similarly named world objects into false item links.
  const objectiveItems = rows.filter((row) => row.kind === "objective" && row.task?.taskType === "getItem" && row.task.target?.entityKey)
    .map((row) => input.resolve(row.task!.target!)).filter((target): target is EntityRef => "kind" in target && target.kind === "items");
  const worldChanges = groupPlacedRows(input.relations.gatedSources.filter((source) =>
    source.availability.some((rule) => conditionNamesQuest(rule.conditionId, entity.entityKey, conditions))).map((source) => ({
    sourceKind: WORLD_SOURCE_KIND[source.family],
    subjects: mergeRefs([...source.subjects.map(input.resolve), ...objectiveItems.filter((item) =>
      source.family === "interaction" && displayName(source.label ?? "") === item.name)], input).sort((left, right) =>
      (left.key ?? left.label).localeCompare(right.key ?? right.label)),
    ...(displayName(source.label ?? "") && !objectiveItems.some((item) =>
      source.family === "interaction" && displayName(source.label ?? "") === item.name)
      ? { label: displayName(source.label!) } : {}),
    availability: projectAvailability(source.availability, conditions, input.resolve),
    placements: publishedPlacements(source.placementIds, input.placements),
  }))).filter((row) => row.availability.length > 0);
  return {
    ...baseDocument(entity, ref, input),
    facts: {
      ...(chainName && fact?.chainOrder !== null && fact?.chainOrder !== undefined ? { chain: { name: chainName, order: fact.chainOrder } } : {}),
      repeatable: fact?.repeatable ?? false, turnInWithoutNpc: fact?.turnInWithoutNpc ?? false,
      requirements: requirementsFor(fact?.conditionIds ?? [], conditions, input.resolve),
      ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}),
      ...(optionalCount(fact?.levelRequirement ?? null) === undefined ? {} : { levelRequirement: optionalCount(fact?.levelRequirement ?? null) }),
      ...(optionalCount(fact?.experience ?? null) === undefined ? {} : { experience: optionalCount(fact?.experience ?? null) }),
      ...(plainText(fact?.objectiveText ?? "") ? { objectiveText: plainText(fact!.objectiveText!) } : {}),
      ...(plainText(fact?.completedDescription ?? "") ? { completedDescription: plainText(fact!.completedDescription!) } : {}),
      ...(fact?.worldQuest ? { worldQuest: fact.worldQuest } : {}),
    },
    starts,
    turnIns: questPeople(rows, "turnIn", input, indexes),
    objectives: rows.filter((row) => row.kind === "objective" && row.task !== null).map((row) => objectiveForRow(row, input, indexes, conditions)),
    itemsGiven: rows.filter((row) => row.kind === "itemGiven" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1) })),
    rewards: rows.filter((row) => row.kind === "reward" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1), choice: false })),
    rewardChoices: rows.filter((row) => row.kind === "rewardChoice" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1), choice: true })),
    chainQuests: chain.map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    unlocks, worldChanges,
    ...(fact?.dungeon ? { dungeon: input.resolve(fact.dungeon) } : {}),
    placedRules: placedRules(input.facts, "quests", { entityKey: entity.entityKey }, input.resolve),
  };
}
