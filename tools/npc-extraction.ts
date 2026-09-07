import { Type, type Static } from "typebox";
import { applicableConditionReferenceFields } from "./condition-references";

const integer = Type.Integer();
const number = Type.Number();
const text = Type.String();
const boolean = Type.Boolean();
const nullableInteger = Type.Union([integer, Type.Null()]);
const nullableNumber = Type.Union([number, Type.Null()]);
const nullableBoolean = Type.Union([boolean, Type.Null()]);
const nullableText = Type.Union([text, Type.Null()]);

const vector3 = Type.Object({ x: number, y: number, z: number });
const rotation = Type.Object({ x: number, y: number, z: number, w: number });
const color = Type.Object({ r: number, g: number, b: number, a: number });
const hierarchyNode = Type.Object({ name: text, siblingIndex: integer });
const sourceScene = Type.Object({
  nativeId: nullableInteger,
  name: nullableText,
  path: nullableText,
  buildIndex: integer,
  handle: integer,
  isLoaded: boolean,
  rootCount: integer,
  nativeIdMatched: boolean,
  nativeIdMatchBasis: nullableText,
});
const source = Type.Object({
  hierarchyPath: text,
  hierarchyNodes: Type.Array(hierarchyNode),
  componentType: text,
  componentIndex: integer,
  saverIdentifier: nullableText,
  addressableAssetGuid: nullableText,
});
const candidateSource = Type.Object({
  sourcePath: text,
  sourceScene,
  hierarchyPath: text,
  hierarchyNodes: Type.Array(hierarchyNode),
  componentType: text,
  componentIndex: integer,
  stability: text,
  provenStable: boolean,
});
const entry = Type.Object({
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  description: nullableText,
  nativeType: nullableText,
  text: nullableText,
});
const enumValue = Type.Object({ value: integer, name: text });
const timeRequirement = Type.Union([
  Type.Null(),
  Type.Object({
    checkYear: boolean,
    checkMonth: boolean,
    checkWeek: boolean,
    checkDay: boolean,
    checkHour: boolean,
    checkMinute: boolean,
    checkSecond: boolean,
    checkGlobalSpeed: boolean,
    year: integer,
    month: integer,
    week: integer,
    day: integer,
    hour: integer,
    minute: integer,
    second: integer,
    globalSpeed: number,
  }),
]);
const projectedObject = Type.Union([Type.Null(), Type.Object({ nativeType: text, text })]);

const requirement = Type.Object({
  sourceFieldPath: text,
  groupIndex: integer,
  requirementIndex: integer,
  requirementType: text,
  requirementTypeValue: integer,
  conditionRule: text,
  conditionRuleValue: integer,
  evaluation: text,
  abilityID: integer,
  bonusID: integer,
  recipeID: integer,
  resourceID: integer,
  effectID: integer,
  NPCID: integer,
  statID: integer,
  factionID: integer,
  comboID: integer,
  raceID: integer,
  levelsID: integer,
  classID: integer,
  speciesID: integer,
  itemID: integer,
  currencyID: integer,
  pointID: integer,
  talentTreeID: integer,
  skillID: integer,
  spellbookID: integer,
  weaponTemplateID: integer,
  enchantmentID: integer,
  gearSetID: integer,
  gameSceneID: integer,
  questID: integer,
  dialogueID: integer,
  knowledge: enumValue,
  state: enumValue,
  comparison: enumValue,
  value: enumValue,
  ownership: enumValue,
  itemCondition: enumValue,
  progression: enumValue,
  entity: enumValue,
  pointType: enumValue,
  dialogueNodeState: enumValue,
  effectCondition: enumValue,
  amountType: enumValue,
  timeType: enumValue,
  timeValue: enumValue,
  amount1: number,
  amount2: number,
  float1: number,
  consume: boolean,
  boolBalue1: boolean,
  boolBalue2: boolean,
  boolBalue3: boolean,
  isPercent: boolean,
  effectTag: Type.Union([entry, Type.Null()]),
  effectType: enumValue,
  factionStance: Type.Union([entry, Type.Null()]),
  itemType: Type.Union([entry, Type.Null()]),
  weaponType: Type.Union([entry, Type.Null()]),
  weaponSlot: Type.Union([entry, Type.Null()]),
  armorType: Type.Union([entry, Type.Null()]),
  armorSlot: Type.Union([entry, Type.Null()]),
  gender: Type.Union([entry, Type.Null()]),
  questState: enumValue,
  dialogueNode: projectedObject,
  NPCFamily: Type.Union([entry, Type.Null()]),
  region: Type.Union([entry, Type.Null()]),
  timeRequirement1: timeRequirement,
  timeRequirement2: timeRequirement,
});
const requirementRow = Type.Union([requirement, Type.Null()]);
const requirementGroup = Type.Union([
  Type.Null(),
  Type.Object({
    sourceFieldPath: text,
    groupIndex: integer,
    checkCount: boolean,
    requiredCount: integer,
    nativeRequirementCount: integer,
    requirements: Type.Array(requirementRow),
  }),
]);
const requirementTemplate = Type.Object({
  nativeId: integer,
  sourceName: nullableText,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  description: nullableText,
  nativeType: nullableText,
  nativeGroupCount: integer,
  groups: Type.Array(requirementGroup),
  sourceFieldPath: text,
});

const candidate = Type.Union([
  Type.Object({
    sourceIndex: integer,
    npcId: nullableInteger,
    npc: Type.Union([entry, Type.Null()]),
    rawSpawnChance: nullableNumber,
    spawnChance: nullableNumber,
    spawnChanceSemantics: text,
    persistent: nullableBoolean,
    isPersistent: nullableBoolean,
    sourceFieldPath: text,
  }),
  Type.Object({
    sourceIndex: integer,
    sourceFieldPath: text,
    npcId: Type.Null(),
    npc: Type.Null(),
    rawSpawnChance: Type.Null(),
    spawnChance: Type.Null(),
    spawnChanceSemantics: text,
    persistent: Type.Null(),
    isPersistent: Type.Null(),
    unavailable: text,
  }),
]);

const sourceIdentity = Type.Object({
  status: text,
  provenStable: boolean,
  sourcePathCandidate: text,
  hierarchyPathCandidate: text,
  saverIdentifierCandidate: nullableText,
  addressableAssetGuidCandidate: nullableText,
  sourceAddressableLoaderHierarchyCandidate: nullableText,
  componentIndexAvailable: boolean,
});
const producerUnavailable = Type.Object({
  sourceIndex: integer,
  sourceScene: Type.Null(),
  source: Type.Null(),
  position: Type.Null(),
  activeSelf: Type.Null(),
  activeInHierarchy: Type.Null(),
  enabled: Type.Null(),
  unavailable: text,
});
const producer = Type.Union([
  producerUnavailable,
  Type.Object({
    sourceIndex: integer,
    sourcePath: text,
    componentInstanceId: integer,
    gameObjectInstanceId: integer,
    sourceScene,
    source,
    sourceIdentity,
    position: vector3,
    rotation,
    activeSelf: boolean,
    activeInHierarchy: boolean,
    enabled: boolean,
    name: text,
    spawnerType: enumValue,
    isActive: boolean,
    shape: Type.Object({
      kind: Type.Union([Type.Literal("point"), Type.Literal("area")]),
      usePosition: boolean,
      radius: number,
      height: number,
      semantics: text,
    }),
    count: Type.Object({
      npcCountMax: integer,
      spawnedCount: integer,
      spawnedCountMax: integer,
      currentNPCCount: integer,
      currentPersistentNPCCount: integer,
      spawnerType: enumValue,
      semantics: text,
    }),
    candidatesAvailable: boolean,
    candidateCount: integer,
    candidates: Type.Array(candidate),
    activation: Type.Object({
      isActive: boolean,
      triggerSpawn: boolean,
      playerDistanceMax: number,
      spawningCoroutineCount: integer,
    }),
    conditions: Type.Object({
      ownerSourcePath: text,
      useRequirementsTemplate: boolean,
      selectedConditionSource: text,
      behaviorStatus: text,
      inlineRequirementsAvailable: boolean,
      inlineRequirementGroupCount: integer,
      inlineRequirementGroups: Type.Array(requirementGroup),
      requirementsTemplateFieldReadAvailable: boolean,
      requirementsTemplateFieldType: text,
      requirementsTemplateManagedNull: nullableBoolean,
      requirementsTemplateUnityNull: nullableBoolean,
      requirementsTemplateRepresentation: text,
      requirementsTemplateGroupsAvailable: nullableBoolean,
      requirementsTemplateGroupCount: integer,
      requirementsTemplateAvailable: boolean,
      requirementsTemplateProjectionAvailable: boolean,
      requirementsTemplate: Type.Union([requirementTemplate, Type.Null()]),
    }),
    overrides: Type.Object({
      levels: Type.Object({ enabled: boolean, minLevel: integer, maxLevel: integer }),
      scaleWithPlayer: boolean,
      zoneScaling: Type.Object({ enabled: boolean, minLevel: integer, maxLevel: integer }),
      faction: Type.Object({ enabled: boolean, value: Type.Union([entry, Type.Null()]) }),
      species: Type.Object({ enabled: boolean, value: Type.Union([entry, Type.Null()]) }),
      respawn: Type.Object({ enabled: boolean, minSeconds: number, maxSeconds: number }),
      patrol: Type.Object({
        enabled: boolean,
        pointPauseSeconds: number,
        pathAvailable: boolean,
        path: Type.Union([Type.Null(), Type.Object({
          nativeType: text,
          name: text,
          sourceScene,
          source,
          looping: boolean,
          groupPatrol: boolean,
          groupSpacing: number,
          poiRadius: number,
          pointsAvailable: boolean,
          pointCount: integer,
          points: Type.Array(Type.Union([
            Type.Object({
              sourceIndex: integer,
              name: text,
              sourceScene,
              source,
              position: vector3,
              activeSelf: boolean,
              activeInHierarchy: boolean,
              enabled: Type.Null(),
            }),
            Type.Object({ sourceIndex: integer, unavailable: text }),
          ])),
        })]),
      }),
      leash: Type.Object({ enabled: boolean, range: number }),
    }),
    runtime: Type.Object({
      nextAllowedSpawnTime: number,
      pendingRespawnTimesAvailable: boolean,
      pendingRespawnTimes: Type.Array(Type.Object({ sourceIndex: integer, time: number })),
      framesBetweenBatchSpawns: integer,
      groundLayers: Type.Object({ value: integer }),
      gizmoColor: color,
      lineColor: color,
    }),
    persistence: Type.Object({
      saverPresent: boolean,
      saverIdentifier: nullableText,
      saverIsDynamic: nullableBoolean,
      saverIdentifierDynamic: nullableBoolean,
      savedState: Type.Union([
        Type.Object({ available: Type.Literal(false), reason: text, sourceFieldPath: text }),
        Type.Object({
          available: Type.Literal(true),
          sourceFieldPath: text,
          nativeType: text,
          spawnedCount: integer,
          persistentNPCsAvailable: boolean,
          persistentNPCCount: integer,
          persistentNPCs: Type.Array(Type.Union([
            Type.Object({ sourceIndex: integer, unavailable: text }),
            Type.Object({
              sourceIndex: integer,
              npcName: nullableText,
              npcId: integer,
              position: vector3,
              rotation: Type.Object({ x: number, y: number, z: number }),
              vitalityStatsAvailable: boolean,
              vitalityStats: Type.Array(Type.Union([
                Type.Object({ sourceIndex: integer, unavailable: text }),
                Type.Object({ sourceIndex: integer, statName: nullableText, statId: integer, value: number }),
              ])),
              sourceFieldPath: text,
            }),
          ])),
        }),
      ]),
    }),
  }),
]);

const managerRosterCandidate = Type.Union([
  Type.Object({ sourceIndex: integer, sourceFieldPath: text, npcId: integer, npc: entry, selection: text }),
  Type.Object({ sourceIndex: integer, sourceFieldPath: text, npcId: Type.Null(), npc: Type.Null(), unavailable: text }),
  Type.Object({ sourceIndex: integer, sourceFieldPath: text, unavailable: text }),
]);
const familyIdentity = Type.Object({
  status: text,
  provenStable: boolean,
  sourcePathCandidate: text,
  hierarchyPathCandidate: text,
  componentIndexAvailable: boolean,
});
const manager = Type.Union([
  Type.Object({ sourceIndex: integer, sourcePath: text, sourceScene: Type.Null(), source: Type.Null(), unavailable: text }),
  Type.Object({
    sourceIndex: integer,
    sourcePath: text,
    componentInstanceId: integer,
    gameObjectInstanceId: integer,
    sourceScene,
    source,
    sourceIdentity: familyIdentity,
    activeSelf: boolean,
    activeInHierarchy: boolean,
    enabled: boolean,
    name: text,
    managerType: text,
    candidateRules: Type.Object({ sourceFieldPath: text, available: boolean, candidateCount: integer, exportedCandidateCount: integer, candidates: Type.Array(managerRosterCandidate), semantics: text }),
    overrides: Type.Object({ faction: Type.Object({ enabled: boolean, value: Type.Union([entry, Type.Null()]), semantics: text }) }),
    runtime: Type.Object({ deathReturnToPoolDelay: number }),
  }),
]);
const zone = Type.Union([
  Type.Object({ sourceIndex: integer, sourcePath: text, sourceScene: Type.Null(), source: Type.Null(), unavailable: text }),
  Type.Object({
    sourceIndex: integer,
    sourcePath: text,
    componentInstanceId: integer,
    gameObjectInstanceId: integer,
    sourceScene,
    source,
    sourceIdentity: familyIdentity,
    producerFamily: Type.Literal("adventurerSpawnZone"),
    name: text,
    position: vector3,
    rotation,
    activeSelf: boolean,
    activeInHierarchy: boolean,
    enabled: boolean,
    shape: Type.Object({ kind: Type.Union([Type.Literal("point"), Type.Literal("area")]), usePosition: boolean, radius: number, height: number, semantics: text }),
    count: Type.Object({ maxAdventurers: integer, currentAdventurerCount: integer, currentAdventurersFieldReadAvailable: boolean, semantics: text }),
    activation: Type.Object({ isActive: boolean, playerDistanceMax: number }),
    candidateRules: Type.Object({ sourceFieldPath: text, candidateSourceFieldPath: text, available: boolean, candidateCount: integer, candidates: Type.Array(Type.Object({})), semantics: text }),
    conditions: Type.Object({ sourceFieldPath: text, available: boolean, semantics: text }),
    overrides: Type.Object({ faction: Type.Object({ available: boolean, semantics: text }) }),
    spawnRules: Type.Object({ navMeshSampleRadius: number, minWalkableRadius: number, groundLayers: Type.Object({ value: integer }) }),
    runtime: Type.Object({ gizmoColor: color, lineColor: color }),
  }),
]);

const observationIdentity = Type.Object({ status: text, hierarchyPathCandidate: text, provenStable: boolean, componentIndexAvailable: boolean });
const observation = Type.Object({
  observationList: text,
  sourceProducerPath: text,
  sourceIndex: integer,
  instanceId: nullableInteger,
  sourceScene: Type.Union([sourceScene, Type.Null()]),
  source: Type.Union([source, Type.Null()]),
  sourcePath: Type.Optional(text),
  sourceIdentity: Type.Optional(observationIdentity),
  sourceSpawnerCandidate: Type.Optional(Type.Union([candidateSource, Type.Null()])),
  sourceAdventurerZoneCandidate: Type.Optional(Type.Union([candidateSource, Type.Null()])),
  position: Type.Union([vector3, Type.Null()]),
  activeSelf: nullableBoolean,
  activeInHierarchy: nullableBoolean,
  enabled: nullableBoolean,
  npcId: nullableInteger,
  npc: Type.Union([entry, Type.Null()]),
  level: nullableInteger,
  persistent: nullableBoolean,
  unavailable: Type.Optional(text),
});

const totals = Type.Object({
  producers: integer,
  observations: integer,
  sourceNPCSpawnerComponents: integer,
  exportedProducers: integer,
  sourceSpawnDataCandidates: integer,
  exportedSpawnDataCandidates: integer,
  sourceCurrentNPCs: integer,
  sourceCurrentPersistentNPCs: integer,
  sourceAllObservations: integer,
  sourceAdventurerSpawnZones: integer,
  sourceAdventurerPopulationManagers: integer,
  sourceAdventurerRosterCandidates: integer,
  sourceAdventurerObservations: integer,
  exportedCurrentNPCs: integer,
  exportedCurrentPersistentNPCs: integer,
  exportedAllObservations: integer,
  exportedAdventurerSpawnZones: integer,
  exportedAdventurerPopulationManagers: integer,
  exportedAdventurerRosterCandidates: integer,
  exportedAdventurerObservations: integer,
  adventurerObservationNullEntries: integer,
  adventurerObservationDuplicateInstanceIds: integer,
  adventurerUnavailableLists: integer,
  requirementsTemplateManagedNull: integer,
  requirementsTemplateUnityNull: integer,
  requirementsTemplateNativeObjects: integer,
  requirementsTemplateFieldReadFailures: integer,
  currentNPCNullEntries: integer,
  currentPersistentNPCNullEntries: integer,
  currentNPCUnavailableLists: integer,
  currentPersistentNPCUnavailableLists: integer,
  currentNPCDuplicateInstanceIds: integer,
  currentPersistentNPCDuplicateInstanceIds: integer,
  observationDeduplication: text,
});

export const NpcProducersSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.npc-producers.v2"),
  coverage: Type.Object({
    scope: text,
    includesInactiveComponents: boolean,
    sourceComponentType: text,
    sourceCount: integer,
    additionalSourceComponentTypes: Type.Array(text),
    additionalSourceCounts: Type.Object({ adventurerSpawnZones: integer, adventurerPopulationManagers: integer }),
    note: text,
  }),
  producers: Type.Array(producer),
  adventurerProducers: Type.Array(zone),
  adventurerPopulationManagers: Type.Array(manager),
  observations: Type.Object({ currentNPCs: Type.Array(observation), currentPersistentNPCs: Type.Array(observation), currentAdventurers: Type.Array(observation) }),
  requirementTemplates: Type.Array(requirementTemplate),
  runtimeNamingUncertainties: Type.Array(Type.Object({ member: text, detail: text })),
  sourceTotals: Type.Object({
    producers: integer,
    npcSpawnerComponents: integer,
    spawnDataCandidates: integer,
    currentNPCs: integer,
    currentPersistentNPCs: integer,
    allObservations: integer,
    adventurerSpawnZones: integer,
    adventurerPopulationManagers: integer,
    adventurerRosterCandidates: integer,
    adventurerObservations: integer,
    currentNPCUnavailableLists: integer,
    currentPersistentNPCUnavailableLists: integer,
    adventurerUnavailableLists: integer,
  }),
  exportedTotals: Type.Object({
    producers: integer,
    observations: integer,
    spawnDataCandidates: integer,
    currentNPCs: integer,
    currentPersistentNPCs: integer,
    allObservations: integer,
    adventurerSpawnZones: integer,
    adventurerPopulationManagers: integer,
    adventurerRosterCandidates: integer,
    adventurerObservations: integer,
  }),
  totals,
  unresolved: Type.Array(Type.Object({ kind: text, sourceFieldPath: text, detail: text })),
});

export type NpcProducers = Static<typeof NpcProducersSchema>;
export type NpcReference = (source: string, targetKind: string, nativeId: number) => void;

type Requirement = Static<typeof requirement>;
type Producer = Static<typeof producer>;
type Observation = Static<typeof observation>;
type Manager = Static<typeof manager>;
type Zone = Static<typeof zone>;

function fail(message: string): never {
  throw new Error(message);
}

function assertCount(actual: number, expected: number, label: string): void {
  if (actual !== expected) fail(`${label} count does not reconcile.`);
}

function assertNonNegativeCount(value: number, label: string): void {
  if (value < -1) fail(`${label} count is invalid.`);
}

function validateScene(scene: Static<typeof sourceScene>, sourcePath: string, reference: NpcReference): void {
  if (scene.nativeId !== null) reference(`${sourcePath}.sourceScene`, "scenes", scene.nativeId);
}

function validateEntry(value: Static<typeof entry>, sourcePath: string, reference: NpcReference): void {
  if (value.nativeId < -1) fail(`Invalid native ID at ${sourcePath}.`);
}

function validateRequirement(value: Requirement, sourcePath: string, reference: NpcReference): void {
  for (const [field, targetKind] of applicableConditionReferenceFields(value.requirementType)) {
    const nativeId = value[field as keyof Requirement];
    reference(`${sourcePath}.${field}`, targetKind, nativeId as number);
  }
  if (value.effectTag !== null) validateEntry(value.effectTag, `${sourcePath}.effectTag`, reference);
  if (value.factionStance !== null) validateEntry(value.factionStance, `${sourcePath}.factionStance`, reference);
  if (value.itemType !== null) validateEntry(value.itemType, `${sourcePath}.itemType`, reference);
  if (value.weaponType !== null) validateEntry(value.weaponType, `${sourcePath}.weaponType`, reference);
  if (value.weaponSlot !== null) validateEntry(value.weaponSlot, `${sourcePath}.weaponSlot`, reference);
  if (value.armorType !== null) validateEntry(value.armorType, `${sourcePath}.armorType`, reference);
  if (value.armorSlot !== null) validateEntry(value.armorSlot, `${sourcePath}.armorSlot`, reference);
  if (value.gender !== null) validateEntry(value.gender, `${sourcePath}.gender`, reference);
  if (value.NPCFamily !== null) validateEntry(value.NPCFamily, `${sourcePath}.NPCFamily`, reference);
  if (value.region !== null) validateEntry(value.region, `${sourcePath}.region`, reference);
}

function validateGroup(group: Static<typeof requirementGroup>, sourcePath: string, reference: NpcReference): void {
  if (group === null) return;
  if (group.groupIndex < 0) fail(`Invalid requirement group index at ${sourcePath}.`);
  if (group.nativeRequirementCount >= 0) assertCount(group.requirements.length, group.nativeRequirementCount, `${sourcePath}.requirements`);
  for (let index = 0; index < group.requirements.length; index++) {
    const row = group.requirements[index]!;
    if (row !== null) {
      if (row.requirementIndex !== index) fail(`Requirement rows are not ordered at ${sourcePath}.`);
      validateRequirement(row, `${sourcePath}.requirements[${index}]`, reference);
    }
  }
}

function validateGroups(groups: Static<typeof requirementGroup>[], sourcePath: string, reference: NpcReference): void {
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index]!;
    if (group !== null && group.groupIndex !== index) fail(`Requirement groups are not ordered at ${sourcePath}.`);
    validateGroup(group, `${sourcePath}[${index}]`, reference);
  }
}

function validateTemplate(template: Static<typeof requirementTemplate>, sourcePath: string, reference: NpcReference): void {
  if (template.nativeGroupCount >= 0) assertCount(template.groups.length, template.nativeGroupCount, `${sourcePath}.groups`);
  validateGroups(template.groups, `${sourcePath}.groups`, reference);
}

function validateCandidate(row: Static<typeof candidate>, sourcePath: string, reference: NpcReference): void {
  if (row.sourceIndex < 0) fail(`Invalid candidate index at ${sourcePath}.`);
  if ("unavailable" in row) return;
  if (row.npcId !== null) reference(`${sourcePath}.npcId`, "npcs", row.npcId);
  if (row.npc !== null) {
    if (row.npcId === null) fail(`Candidate NPC identity is incomplete at ${sourcePath}.`);
    validateEntry(row.npc, `${sourcePath}.npc`, reference);
    if (row.npc.nativeId !== row.npcId) fail(`Candidate NPC identity differs at ${sourcePath}.`);
  }
  if (row.rawSpawnChance !== null && row.spawnChance !== null && row.rawSpawnChance !== row.spawnChance) fail(`Candidate spawn chance projection differs at ${sourcePath}.`);
  if (row.persistent !== row.isPersistent) fail(`Candidate persistence projection differs at ${sourcePath}.`);
}

function validateSource(sourceValue: Static<typeof source>, sourcePath: string, reference: NpcReference): void {
  if (sourceValue.componentIndex < -1) fail(`Invalid component index at ${sourcePath}.`);
}

function validateProducer(row: Producer, sourcePath: string, reference: NpcReference): void {
  if ("unavailable" in row) return;
  validateScene(row.sourceScene, sourcePath, reference);
  validateSource(row.source, sourcePath, reference);
  if (row.sourceIndex < 0) fail(`Invalid producer index at ${sourcePath}.`);
  if (row.candidateCount < -1) fail(`Invalid candidate count at ${sourcePath}.`);
  if ((!row.candidatesAvailable && row.candidateCount !== -1) || (row.candidatesAvailable && row.candidateCount < 0)) fail(`Candidate availability flags do not reconcile at ${sourcePath}.`);
  if (row.candidateCount >= 0) assertCount(row.candidates.length, row.candidateCount, `${sourcePath}.candidates`);
  for (let index = 0; index < row.candidates.length; index++) {
    const candidateRow = row.candidates[index]!;
    if (candidateRow.sourceIndex !== index) fail(`Candidate rows are not ordered at ${sourcePath}.candidates.`);
    validateCandidate(candidateRow, `${sourcePath}.candidates[${index}]`, reference);
  }
  if (row.conditions.inlineRequirementGroupCount >= 0) assertCount(row.conditions.inlineRequirementGroups.length, row.conditions.inlineRequirementGroupCount, `${sourcePath}.inlineRequirementGroups`);
  validateGroups(row.conditions.inlineRequirementGroups, `${sourcePath}.inlineRequirementGroups`, reference);
  for (let pendingIndex = 0; pendingIndex < row.runtime.pendingRespawnTimes.length; pendingIndex++) {
    if (row.runtime.pendingRespawnTimes[pendingIndex]!.sourceIndex !== pendingIndex) fail(`Pending respawn rows are not ordered at ${sourcePath}.`);
  }
  if (row.conditions.requirementsTemplateProjectionAvailable !== (row.conditions.requirementsTemplate !== null) || (!row.conditions.requirementsTemplateAvailable && row.conditions.requirementsTemplate !== null)) fail(`Requirements-template projection flags do not reconcile at ${sourcePath}.`);
  if (row.conditions.requirementsTemplateGroupCount >= 0 && row.conditions.requirementsTemplate !== null) {
    assertCount(row.conditions.requirementsTemplate.groups.length, row.conditions.requirementsTemplateGroupCount, `${sourcePath}.requirementsTemplate.groups`);
  }
  if (row.conditions.requirementsTemplate !== null) validateTemplate(row.conditions.requirementsTemplate, `${sourcePath}.requirementsTemplate`, reference);
  if (row.overrides.faction.value !== null) {
    validateEntry(row.overrides.faction.value, `${sourcePath}.overrides.faction`, reference);
    reference(`${sourcePath}.overrides.faction`, "factions", row.overrides.faction.value.nativeId);
  }
  if (row.overrides.species.value !== null) {
    validateEntry(row.overrides.species.value, `${sourcePath}.overrides.species`, reference);
    reference(`${sourcePath}.overrides.species`, "species", row.overrides.species.value.nativeId);
  }
  if (row.overrides.patrol.path !== null) {
    if (row.overrides.patrol.path.pointCount >= 0) assertCount(row.overrides.patrol.path.points.length, row.overrides.patrol.path.pointCount, `${sourcePath}.patrol.points`);
    validateScene(row.overrides.patrol.path.sourceScene, `${sourcePath}.patrol.path`, reference);
    validateSource(row.overrides.patrol.path.source, `${sourcePath}.patrol.path`, reference);
    for (let index = 0; index < row.overrides.patrol.path.points.length; index++) {
      const point = row.overrides.patrol.path.points[index]!;
      if (point.sourceIndex !== index) fail(`Patrol point rows are not ordered at ${sourcePath}.`);
      if (!("unavailable" in point)) {
        validateScene(point.sourceScene, `${sourcePath}.patrol.points[${index}]`, reference);
        validateSource(point.source, `${sourcePath}.patrol.points[${index}]`, reference);
      }
    }
  }
  if (row.persistence.savedState.available) {
    if (row.persistence.savedState.persistentNPCCount >= 0) assertCount(row.persistence.savedState.persistentNPCs.length, row.persistence.savedState.persistentNPCCount, `${sourcePath}.savedState.persistentNPCs`);
    for (let index = 0; index < row.persistence.savedState.persistentNPCs.length; index++) {
      const saved = row.persistence.savedState.persistentNPCs[index]!;
      if (saved.sourceIndex !== index) fail(`Saved NPC rows are not ordered at ${sourcePath}.`);
      if (!("unavailable" in saved)) {
        reference(`${sourcePath}.savedState.persistentNPCs[${index}].npcId`, "npcs", saved.npcId);
        if (!saved.vitalityStatsAvailable && saved.vitalityStats.length !== 0) fail(`Unavailable vitality stats have exported rows at ${sourcePath}.`);
        for (let statIndex = 0; statIndex < saved.vitalityStats.length; statIndex++) {
          if (saved.vitalityStats[statIndex]!.sourceIndex !== statIndex) fail(`Vitality rows are not ordered at ${sourcePath}.`);
        }
      }
    }
  }
}

function validateObservation(row: Observation, sourcePath: string, expectedList: string, reference: NpcReference, sourceIndexCounts: Map<string, number>, instanceIds: Set<number>, indexKeys: Set<string>): void {
  if (row.observationList !== expectedList) fail(`Observation list name differs for ${expectedList}.`);
  if (row.sourceIndex < 0) fail(`Invalid observation index for ${expectedList}.`);
  const indexKey = `${row.sourceProducerPath}\u0000${row.sourceIndex}`;
  if (indexKeys.has(indexKey)) fail(`Duplicate observation source row for ${expectedList}.`);
  indexKeys.add(indexKey);
  const count = sourceIndexCounts.get(row.sourceProducerPath);
  if (count === undefined) fail(`Observation references an unknown producer for ${expectedList}.`);
  if (row.sourceIndex >= count) fail(`Observation index exceeds its producer list for ${expectedList}.`);
  if (row.instanceId !== null) {
    if (instanceIds.has(row.instanceId)) fail(`Duplicate exported observation instance for ${expectedList}.`);
    instanceIds.add(row.instanceId);
  }
  if (row.unavailable !== undefined) {
    if (row.instanceId !== null || row.sourceScene !== null || row.source !== null || row.sourcePath !== undefined || row.sourceIdentity !== undefined || row.npcId !== null || row.npc !== null || row.position !== null) fail(`Unavailable observation projection contains supported fields for ${expectedList}.`);
    return;
  }
  if (row.sourceScene === null || row.source === null || row.sourcePath === undefined || row.sourceIdentity === undefined) fail(`Available observation projection is incomplete for ${expectedList}.`);
  validateScene(row.sourceScene, sourcePath, reference);
  validateSource(row.source, sourcePath, reference);
  if (row.npcId !== null) reference(`${sourcePath}.npcId`, "npcs", row.npcId);
  if (row.npc !== null) {
    if (row.npcId === null) fail(`Observation NPC identity is incomplete at ${sourcePath}.`);
    validateEntry(row.npc, `${sourcePath}.npc`, reference);
    if (row.npc.nativeId !== row.npcId) fail(`Observation NPC identity differs at ${sourcePath}.`);
  }
}

function validateFamilySource(row: Manager | Zone, sourcePath: string, reference: NpcReference): void {
  if ("unavailable" in row) return;
  validateScene(row.sourceScene, sourcePath, reference);
  validateSource(row.source, sourcePath, reference);
}

export function validateNpcProducers(value: NpcProducers, reference: NpcReference): void {
  const { sourceTotals, exportedTotals, totals } = value;
  for (const [label, count] of Object.entries(sourceTotals)) assertNonNegativeCount(count, `sourceTotals.${label}`);
  if (value.coverage.sourceCount !== sourceTotals.producers || sourceTotals.npcSpawnerComponents !== sourceTotals.producers) fail("NPC producer coverage count differs from source totals.");
  if (value.coverage.additionalSourceCounts.adventurerSpawnZones !== sourceTotals.adventurerSpawnZones || value.coverage.additionalSourceCounts.adventurerPopulationManagers !== sourceTotals.adventurerPopulationManagers) fail("NPC producer family coverage counts differ from source totals.");
  if (sourceTotals.producers >= 0) assertCount(value.producers.length, sourceTotals.producers, "producers");
  assertCount(value.producers.length, exportedTotals.producers, "exported producers");
  assertCount(value.adventurerProducers.length, exportedTotals.adventurerSpawnZones, "adventurer spawn zones");
  assertCount(value.adventurerPopulationManagers.length, exportedTotals.adventurerPopulationManagers, "adventurer population managers");
  if (sourceTotals.adventurerSpawnZones >= 0) assertCount(value.adventurerProducers.length, sourceTotals.adventurerSpawnZones, "adventurer spawn zone source");
  if (sourceTotals.adventurerPopulationManagers >= 0) assertCount(value.adventurerPopulationManagers.length, sourceTotals.adventurerPopulationManagers, "adventurer population manager source");

  const producerPaths = new Map<string, Producer>();
  const npcSourceCounts = new Map<string, number>();
  const persistentSourceCounts = new Map<string, number>();
  let candidateSourceCount = 0;
  let currentNPCSourceCount = 0;
  let currentPersistentSourceCount = 0;
  let currentNPCUnavailable = 0;
  let currentPersistentUnavailable = 0;
  let requirementsTemplateManagedNull = 0;
  let requirementsTemplateUnityNull = 0;
  let requirementsTemplateNativeObjects = 0;
  let requirementsTemplateFieldReadFailures = 0;
  for (let index = 0; index < value.producers.length; index++) {
    const row = value.producers[index]!;
    if (row.sourceIndex !== index) fail("NPC producer rows are not ordered.");
    validateProducer(row, `producer[${index}]`, reference);
    if ("unavailable" in row) continue;
    if (producerPaths.has(row.sourcePath)) fail(`Duplicate NPC producer source path: ${row.sourcePath}.`);
    producerPaths.set(row.sourcePath, row);
    if (!row.conditions.requirementsTemplateFieldReadAvailable) {
      if (row.conditions.requirementsTemplateManagedNull !== null || row.conditions.requirementsTemplateUnityNull !== null) fail(`Unavailable requirements-template field has null flags at ${row.sourcePath}.`);
      requirementsTemplateFieldReadFailures++;
    } else {
      if (row.conditions.requirementsTemplateManagedNull === null || row.conditions.requirementsTemplateUnityNull === null) fail(`Requirements-template field null flags are incomplete at ${row.sourcePath}.`);
      if (row.conditions.requirementsTemplateManagedNull === true) requirementsTemplateManagedNull++;
      else if (row.conditions.requirementsTemplateUnityNull === true) requirementsTemplateUnityNull++;
      else if (row.conditions.requirementsTemplateManagedNull === false && row.conditions.requirementsTemplateUnityNull === false) requirementsTemplateNativeObjects++;
      else fail(`Requirements-template field null flags are invalid at ${row.sourcePath}.`);
    }
    if (row.candidateCount >= 0) candidateSourceCount += row.candidateCount;
    if (row.count.currentNPCCount < 0) currentNPCUnavailable++;
    else {
      currentNPCSourceCount += row.count.currentNPCCount;
      npcSourceCounts.set(row.sourcePath, row.count.currentNPCCount);
    }
    if (row.count.currentPersistentNPCCount < 0) currentPersistentUnavailable++;
    else {
      currentPersistentSourceCount += row.count.currentPersistentNPCCount;
      persistentSourceCounts.set(row.sourcePath, row.count.currentPersistentNPCCount);
    }
  }
  if (sourceTotals.spawnDataCandidates !== candidateSourceCount) fail("NPC spawn candidate source count does not reconcile.");
  assertCount(exportedTotals.spawnDataCandidates, candidateSourceCount, "exported spawn candidates");
  if (totals.requirementsTemplateManagedNull !== requirementsTemplateManagedNull || totals.requirementsTemplateUnityNull !== requirementsTemplateUnityNull || totals.requirementsTemplateNativeObjects !== requirementsTemplateNativeObjects || totals.requirementsTemplateFieldReadFailures !== requirementsTemplateFieldReadFailures) fail("Requirements-template diagnostic totals do not reconcile.");
  if (sourceTotals.currentNPCs !== currentNPCSourceCount || sourceTotals.currentPersistentNPCs !== currentPersistentSourceCount) fail("NPC observation source counts do not reconcile.");
  if (sourceTotals.currentNPCUnavailableLists !== currentNPCUnavailable || sourceTotals.currentPersistentNPCUnavailableLists !== currentPersistentUnavailable) fail("NPC unavailable-list counts do not reconcile.");

  let rosterSourceCount = 0;
  let rosterUnavailable = false;
  const managerPaths = new Set<string>();
  for (let index = 0; index < value.adventurerPopulationManagers.length; index++) {
    const row = value.adventurerPopulationManagers[index]!;
    if (row.sourceIndex !== index) fail("Adventurer population manager rows are not ordered.");
    validateFamilySource(row, `adventurerPopulationManager[${index}]`, reference);
    if ("unavailable" in row) continue;
    if (managerPaths.has(row.sourcePath)) fail(`Duplicate adventurer population manager source path: ${row.sourcePath}.`);
    managerPaths.add(row.sourcePath);
    const rules = row.candidateRules;
    if (rules.candidateCount >= 0) {
      if (!rules.available) fail("Adventurer roster has rows while marked unavailable.");
      assertCount(rules.candidates.length, rules.candidateCount, `adventurerPopulationManager[${index}].candidates`);
      rosterSourceCount += rules.candidateCount;
    } else {
      if (rules.available || rules.candidates.length !== 0) fail("Unavailable adventurer roster has an exported row.");
      rosterUnavailable = true;
    }
    if (rules.exportedCandidateCount !== rules.candidates.length) fail("Adventurer roster exported count does not reconcile.");
    for (let candidateIndex = 0; candidateIndex < rules.candidates.length; candidateIndex++) {
      const roster = rules.candidates[candidateIndex]!;
      if (roster.sourceIndex !== candidateIndex) fail("Adventurer roster rows are not ordered.");
      if ("unavailable" in roster || roster.npcId === null) continue;
      reference(`adventurerPopulationManager[${index}].candidates[${candidateIndex}].npcId`, "npcs", roster.npcId);
      validateEntry(roster.npc, `adventurerPopulationManager[${index}].candidates[${candidateIndex}].npc`, reference);
      if (roster.npc.nativeId !== roster.npcId) fail("Adventurer roster NPC identity differs.");
    }
    if (row.overrides.faction.value !== null) {
      validateEntry(row.overrides.faction.value, `adventurerPopulationManager[${index}].overrides.faction`, reference);
      reference(`adventurerPopulationManager[${index}].overrides.faction`, "factions", row.overrides.faction.value.nativeId);
    }
  }
  assertCount(exportedTotals.adventurerRosterCandidates, rosterSourceCount, "exported adventurer roster candidates");
  assertCount(exportedTotals.observations, value.observations.currentNPCs.length + value.observations.currentPersistentNPCs.length, "exported NPC observations");
  if (rosterUnavailable) {
    if (sourceTotals.adventurerRosterCandidates !== -1) fail("Unavailable adventurer roster source count does not reconcile.");
  } else if (sourceTotals.adventurerRosterCandidates !== rosterSourceCount) {
    fail("Adventurer roster source count does not reconcile.");
  }

  let zoneSourceCount = 0;
  let adventurerUnavailable = 0;
  const zonePaths = new Set<string>();
  const adventurerSourceCounts = new Map<string, number>();
  for (let index = 0; index < value.adventurerProducers.length; index++) {
    const row = value.adventurerProducers[index]!;
    if (row.sourceIndex !== index) fail("Adventurer zone rows are not ordered.");
    validateFamilySource(row, `adventurerProducer[${index}]`, reference);
    if ("unavailable" in row) continue;
    if (zonePaths.has(row.sourcePath)) fail(`Duplicate adventurer zone source path: ${row.sourcePath}.`);
    zonePaths.add(row.sourcePath);
    if (row.candidateRules.available || row.candidateRules.candidateCount !== -1 || row.candidateRules.candidates.length !== 0) fail("Adventurer zone candidate projection claims unsupported candidates.");
    if (row.conditions.available || row.overrides.faction.available) fail("Adventurer zone projection claims unsupported condition or override semantics.");
    if (row.count.currentAdventurerCount < 0) adventurerUnavailable++;
    else {
      zoneSourceCount += row.count.currentAdventurerCount;
      adventurerSourceCounts.set(row.sourcePath, row.count.currentAdventurerCount);
    }
  }
  if (sourceTotals.adventurerObservations !== zoneSourceCount) fail("Adventurer observation source count does not reconcile.");
  if (sourceTotals.adventurerUnavailableLists !== adventurerUnavailable) fail("Adventurer unavailable-list count does not reconcile.");
  if (value.adventurerProducers.length > 0 && !value.unresolved.some((diagnostic) => diagnostic.kind === "npcProducerFamily")) fail("Adventurer producer coverage lacks its unsupported-semantics diagnostic.");

  assertCount(value.observations.currentNPCs.length, exportedTotals.currentNPCs, "current NPC observations");
  assertCount(value.observations.currentPersistentNPCs.length, exportedTotals.currentPersistentNPCs, "current persistent NPC observations");
  assertCount(value.observations.currentAdventurers.length, exportedTotals.adventurerObservations, "current adventurer observations");
  const npcInstanceIds = new Set<number>();
  const persistentInstanceIds = new Set<number>();
  const adventurerInstanceIds = new Set<number>();
  const npcIndexKeys = new Set<string>();
  const persistentIndexKeys = new Set<string>();
  const adventurerIndexKeys = new Set<string>();
  value.observations.currentNPCs.forEach((row, index) => validateObservation(row, `observations.currentNPCs[${index}]`, "CurrentNPCs", reference, npcSourceCounts, npcInstanceIds, npcIndexKeys));
  value.observations.currentPersistentNPCs.forEach((row, index) => validateObservation(row, `observations.currentPersistentNPCs[${index}]`, "CurrentPersistentNPCs", reference, persistentSourceCounts, persistentInstanceIds, persistentIndexKeys));
  value.observations.currentAdventurers.forEach((row, index) => validateObservation(row, `observations.currentAdventurers[${index}]`, "CurrentAdventurers", reference, adventurerSourceCounts, adventurerInstanceIds, adventurerIndexKeys));

  if (sourceTotals.currentNPCs < 0 || sourceTotals.currentPersistentNPCs < 0 || sourceTotals.adventurerObservations < 0) fail("Observation source counts are invalid.");
  const npcDuplicates = totals.currentNPCDuplicateInstanceIds;
  const persistentDuplicates = totals.currentPersistentNPCDuplicateInstanceIds;
  const adventurerDuplicates = totals.adventurerObservationDuplicateInstanceIds;
  const currentNPCNullEntries = value.observations.currentNPCs.filter((row) => row.unavailable === "null CombatEntity").length;
  const currentPersistentNullEntries = value.observations.currentPersistentNPCs.filter((row) => row.unavailable === "null CombatEntity").length;
  const adventurerNullEntries = value.observations.currentAdventurers.filter((row) => row.unavailable === "null CombatEntity").length;
  if (totals.currentNPCNullEntries !== currentNPCNullEntries || totals.currentPersistentNPCNullEntries !== currentPersistentNullEntries || totals.adventurerObservationNullEntries !== adventurerNullEntries) fail("Observation null-entry accounting does not reconcile.");
  if (sourceTotals.currentNPCs - npcDuplicates !== exportedTotals.currentNPCs) fail("Current NPC deduplication accounting does not reconcile.");
  if (sourceTotals.currentPersistentNPCs - persistentDuplicates !== exportedTotals.currentPersistentNPCs) fail("Current persistent NPC deduplication accounting does not reconcile.");
  if (sourceTotals.adventurerObservations - adventurerDuplicates !== exportedTotals.adventurerObservations) fail("Current adventurer deduplication accounting does not reconcile.");
  if (totals.currentNPCNullEntries > sourceTotals.currentNPCs || totals.currentPersistentNPCNullEntries > sourceTotals.currentPersistentNPCs || totals.adventurerObservationNullEntries > sourceTotals.adventurerObservations) fail("Observation null-entry counts are invalid.");

  for (const template of value.requirementTemplates) validateTemplate(template, `requirementTemplate:${template.sourceFieldPath}`, reference);
  assertCount(totals.producers, value.producers.length, "totals.producers");
  assertCount(totals.observations, value.observations.currentNPCs.length + value.observations.currentPersistentNPCs.length, "totals.observations");
  if (totals.sourceNPCSpawnerComponents !== sourceTotals.npcSpawnerComponents || totals.exportedProducers !== exportedTotals.producers || totals.sourceSpawnDataCandidates !== sourceTotals.spawnDataCandidates || totals.exportedSpawnDataCandidates !== exportedTotals.spawnDataCandidates) fail("NPC totals do not reconcile.");
  if (totals.sourceCurrentNPCs !== sourceTotals.currentNPCs || totals.sourceCurrentPersistentNPCs !== sourceTotals.currentPersistentNPCs || totals.sourceAllObservations !== sourceTotals.allObservations) fail("NPC observation totals do not reconcile.");
  if (totals.sourceAdventurerSpawnZones !== sourceTotals.adventurerSpawnZones || totals.sourceAdventurerPopulationManagers !== sourceTotals.adventurerPopulationManagers || totals.sourceAdventurerRosterCandidates !== sourceTotals.adventurerRosterCandidates || totals.sourceAdventurerObservations !== sourceTotals.adventurerObservations) fail("Adventurer source totals do not reconcile.");
  if (totals.exportedCurrentNPCs !== exportedTotals.currentNPCs || totals.exportedCurrentPersistentNPCs !== exportedTotals.currentPersistentNPCs || totals.exportedAllObservations !== exportedTotals.allObservations || totals.exportedAdventurerSpawnZones !== exportedTotals.adventurerSpawnZones || totals.exportedAdventurerPopulationManagers !== exportedTotals.adventurerPopulationManagers || totals.exportedAdventurerRosterCandidates !== exportedTotals.adventurerRosterCandidates || totals.exportedAdventurerObservations !== exportedTotals.adventurerObservations) fail("Adventurer exported totals do not reconcile.");
  if (sourceTotals.allObservations !== sourceTotals.currentNPCs + sourceTotals.currentPersistentNPCs + sourceTotals.adventurerObservations) fail("All observation source count does not reconcile.");
  if (exportedTotals.allObservations !== exportedTotals.currentNPCs + exportedTotals.currentPersistentNPCs + exportedTotals.adventurerObservations) fail("All observation exported count does not reconcile.");
  if (totals.currentNPCNullEntries < 0 || totals.currentPersistentNPCNullEntries < 0 || totals.adventurerObservationNullEntries < 0 || totals.currentNPCDuplicateInstanceIds < 0 || totals.currentPersistentNPCDuplicateInstanceIds < 0 || totals.adventurerObservationDuplicateInstanceIds < 0) fail("Observation diagnostics contain negative counts.");
}
