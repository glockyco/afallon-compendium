import { Type, type Static, type TSchema } from "typebox";
import { applicableConditionReferenceFields } from "./condition-references";

const integer = Type.Integer();
const number = Type.Number();
const boolean = Type.Boolean();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);

function nullable<T extends TSchema>(schema: T) {
  return Type.Union([schema, Type.Null()]);
}

const enumValue = Type.Object({ value: integer, name: text });
const canonicalReference = Type.Object({
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
});
const sceneEvidence = Type.Object({
  nativeId: nullable(integer),
  nativeIdMatched: boolean,
  nativeIdMatchBasis: nullableText,
  name: nullableText,
  path: nullableText,
  buildIndex: integer,
  handle: integer,
});
const hierarchyNode = Type.Object({ name: text, siblingIndex: integer });
const sourceDetails = Type.Object({
  hierarchyPath: nullableText,
  hierarchyNodes: Type.Array(hierarchyNode),
  hierarchyDepth: Type.Optional(integer),
  hierarchyPathTruncated: Type.Optional(boolean),
  componentType: text,
  componentIndex: integer,
  observationIndex: integer,
  saverIdentifier: Type.Optional(nullableText),
  saverIdentifierError: Type.Optional(nullableText),
  addressableAssetGuid: Type.Optional(nullableText),
  addressableAssetGuidError: Type.Optional(nullableText),
});
const sourceIdentity = Type.Object({
  status: text,
  provenStable: boolean,
  hierarchyPathCandidate: nullableText,
  saverIdentifierCandidate: nullableText,
  addressableAssetGuidCandidate: nullableText,
});
const sourceEvidence = Type.Object({
  componentInstanceId: nullable(integer),
  gameObjectInstanceId: nullable(integer),
  sourceScene: nullable(sceneEvidence),
  source: sourceDetails,
  sourceIdentity,
  position: Type.Object({ x: number, y: number, z: number }),
  activeSelf: boolean,
  activeInHierarchy: boolean,
  enabled: boolean,
});

const timeRequirement = Type.Object({
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
  globalSpeed: integer,
});
const projectedReference = nullable(canonicalReference);
const conditionRequirement = Type.Object({
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
  effectTag: projectedReference,
  effectType: enumValue,
  factionStance: projectedReference,
  itemType: projectedReference,
  weaponType: projectedReference,
  weaponSlot: projectedReference,
  armorType: projectedReference,
  armorSlot: projectedReference,
  gender: projectedReference,
  questState: enumValue,
  dialogueNode: nullable(Type.Object({ nativeType: text, text })),
  NPCFamily: projectedReference,
  region: projectedReference,
  timeRequirement1: nullable(timeRequirement),
  timeRequirement2: nullable(timeRequirement),
});
const requirementRow = Type.Union([conditionRequirement, Type.Null()]);
const requirementGroup = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    groupIndex: integer,
    checkCount: boolean,
    requiredCount: integer,
    nativeRequirementCount: integer,
    requirements: Type.Array(requirementRow),
  }),
  Type.Null(),
]);
const requirementTemplate = nullable(Type.Object({
  nativeId: integer,
  sourceName: text,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  description: nullableText,
  nativeType: text,
  nativeGroupCount: integer,
  sourceFieldPath: text,
  groups: Type.Array(requirementGroup),
}));

const actionUnavailable = Type.Object({ sourceFieldPath: text, unavailable: text });
const gameActionTeleport = nullable(Type.Object({
  type: enumValue,
  sceneNativeId: integer,
  position: Type.Object({ x: number, y: number, z: number }),
  rotation: Type.Object({ x: number, y: number, z: number }),
}));
const gameAction = Type.Object({
  sourceFieldPath: text,
  sourceIndex: integer,
  type: enumValue,
  chance: number,
  nativeRequirementGroupCount: integer,
  requirements: Type.Array(requirementGroup),
  teleport: gameActionTeleport,
  unsupported: boolean,
});
const gameActionRow = Type.Union([gameAction, actionUnavailable]);
const gameActionList = Type.Object({
  available: boolean,
  nativeActionCount: integer,
  actions: Type.Array(gameActionRow),
});
const gameActions = Type.Object({
  executionOrder: Type.Literal("template-then-inline"),
  template: nullable(Type.Object({
    instanceId: integer,
    nativeId: integer,
    name: nullableText,
    internalName: nullableText,
    fileName: nullableText,
    available: boolean,
    nativeActionCount: integer,
    actions: Type.Array(gameActionRow),
  })),
  inline: gameActionList,
});
const action = Type.Object({
  sourceFieldPath: text,
  type: enumValue,
  activationType: enumValue,
  chance: number,
  chanceSemantics: text,
  entryID: integer,
  amount: number,
  referenceKind: nullableText,
  referenceId: nullable(integer),
  reference: projectedReference,
  effect: projectedReference,
  quest: projectedReference,
  point: projectedReference,
  skill: projectedReference,
  weaponTemplate: projectedReference,
  task: projectedReference,
  resource: projectedReference,
  lootTable: projectedReference,
  gameActions: gameActions,
  unityEventAvailable: boolean,
  unsupported: boolean,
});
const actionRow = Type.Union([action, actionUnavailable]);
const chestLootRow = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    itemID: nullable(integer),
    item: projectedReference,
    itemReferenceStatus: text,
    minCount: integer,
    maxCount: integer,
    quantitySemantics: text,
    dropChance: number,
    dropChanceSemantics: text,
    lootedObservation: boolean,
  }),
  actionUnavailable,
]);
const chestLootProjection = Type.Object({
  sourceFieldPath: text,
  lootInstancesAvailable: boolean,
  lootInstanceCount: integer,
  lootInstances: Type.Array(chestLootRow),
  maxDrops: integer,
  maxDropsSemantics: text,
  interactionDistance: number,
  chestName: nullableText,
});

const candidateInteractable = Type.Union([
  Type.Object({
    source: sourceEvidence,
    authoredOnly: boolean,
    state: enumValue,
    interactableName: nullableText,
    actions: Type.Array(actionRow),
    requirementsTemplate: requirementTemplate,
    requirementsOwner: nullable(Type.Object({ ownerKind: text, sourceFieldPath: text, source: sourceEvidence })),
    resource: projectedReference,
    resourceUseValues: boolean,
    lootWindowGathering: boolean,
    limitedUseAmount: boolean,
    maxUseAmount: number,
    maxActions: integer,
    cooldown: number,
    interactionTime: number,
    maxDistance: number,
    isTrigger: boolean,
    isClick: boolean,
  }),
  actionUnavailable,
]);
const candidateChest = Type.Union([
  Type.Object({ source: sourceEvidence, authoredOnly: boolean, loot: chestLootProjection }),
  actionUnavailable,
]);
const candidateOutput = Type.Object({
  outputKind: text,
  sourceFieldPath: text,
  resourceID: Type.Optional(nullable(integer)),
  resource: Type.Optional(projectedReference),
  lootTableID: Type.Optional(nullable(integer)),
  lootTable: Type.Optional(projectedReference),
  source: Type.Optional(sourceEvidence),
  loot: Type.Optional(chestLootProjection),
  authoredActionChance: Type.Optional(number),
  effectiveProbabilityResolved: boolean,
  outputSemantics: Type.Optional(text),
});
const possibleOutput = Type.Object({ optionIndex: integer, output: candidateOutput });
const candidateOption = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    optionIndex: integer,
    veinPrefab: nullable(Type.Object({ name: text })),
    requiredSkill: integer,
    weightAtLowSkill: number,
    weightAtHighSkill: number,
    teaserWeight: number,
    authoredInteractables: Type.Array(candidateInteractable),
    authoredChests: Type.Array(candidateChest),
    possibleOutputs: Type.Array(candidateOutput),
    candidateInspection: Type.Object({ instantiated: boolean, rolled: boolean, mutated: boolean }),
  }),
  actionUnavailable,
]);
const weightSample = Type.Union([
  Type.Object({ sourceFieldPath: text, skill: integer, weights: Type.Array(number), semantics: text }),
  actionUnavailable,
]);
const currentNodeObservation = Type.Union([
  Type.Object({
    present: Type.Literal(true),
    observationKind: Type.Literal("runtimeGeneratedInstance"),
    instanceIdObservation: integer,
    source: sourceEvidence,
    interactableName: nullableText,
    state: enumValue,
  }),
  Type.Object({
    present: Type.Literal(false),
    observationKind: Type.Literal("runtimeGeneratedInstance"),
    reason: Type.Optional(text),
    unavailable: Type.Optional(text),
  }),
]);
const oreSpawner = Type.Union([
  Type.Object({
    source: sourceEvidence,
    disposition: text,
    producerFamily: text,
    role: text,
    roles: Type.Array(text),
    sourceIndex: integer,
    miningSkillID: integer,
    gatheringSkillID: nullable(integer),
    gatheringSkill: projectedReference,
    gatheringRole: Type.Object({ kind: text, skillID: nullable(integer), skill: projectedReference, sourceFieldPath: text, semantics: text }),
    resourceNode: Type.Optional(projectedReference),
    projection: Type.Optional(Type.Object({})),
    skillCap: number,
    respawnTime: number,
    respawnJitter: number,
    despawnDelay: number,
    playerRange: number,
    optionsAvailable: boolean,
    optionCount: integer,
    options: Type.Array(candidateOption),
    possibleOutputsAvailable: boolean,
    possibleOutputCount: integer,
    possibleOutputs: Type.Array(possibleOutput),
    outputSemantics: text,
    computeWeightsSamples: Type.Array(weightSample),
    currentNodeObservation,
    authoredProducerIndependentOfObservation: boolean,
  }),
  Type.Object({ sourceIndex: integer, producerFamily: text, unavailable: text }),
]);

const nodeChance = { sourceFieldPath: text, chance: number, chanceSemantics: text };
const nodeContainerRow = Type.Union([actionUnavailable, Type.Object({ ...nodeChance, lootTableID: nullable(integer), lootTable: projectedReference })]);
const nodeProjection = Type.Object({
  source: sourceEvidence,
  disposition: text,
  producerFamily: Type.Literal("interactiveNode"),
  nodeType: enumValue,
  nodeStateObservation: Type.Object({ value: integer, name: text, useCount: integer, nextUse: number }),
  interactableName: nullableText,
  isTrigger: boolean,
  isClick: boolean,
  gatherSkill: projectedReference,
  gatherSkillID: nullable(integer),
  gatherExperience: number,
  gatheringRole: Type.Object({ kind: text, skillID: nullable(integer), skill: projectedReference, sourceFieldPath: text, semantics: text }),
  resourceNode: projectedReference,
  resourceNodeProjected: projectedReference,
  possibleOutputs: Type.Object({
    resourceRanks: nullable(Type.Object({ available: boolean, count: integer, resource: projectedReference })),
    containerLootTables: nullable(Type.Array(nodeContainerRow)),
  }),
  containerTablesDataAvailable: boolean,
  containerTableCount: integer,
  containerTablesData: Type.Array(nodeContainerRow),
  effectsDataAvailable: boolean,
  effectCount: integer,
  effectsData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, effectID: nullable(integer), effect: projectedReference })])),
  questsDataAvailable: boolean,
  questsData: Type.Array(Type.Object({ ...nodeChance, questID: nullable(integer), quest: projectedReference })),
  skillsDataAvailable: boolean,
  skillCount: integer,
  skillsData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, skillID: nullable(integer), skill: projectedReference })])),
  abilitiesData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, abilityID: nullable(integer), ability: projectedReference })])),
  abilityCount: integer,
  treePointsData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, treePointID: nullable(integer), treePoint: projectedReference, amount: number })])),
  treePointCount: integer,
  skillExpData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, skillID: nullable(integer), skill: projectedReference, expAmount: number })])),
  skillExperienceCount: integer,
  taskData: Type.Array(Type.Union([actionUnavailable, Type.Object({ ...nodeChance, taskID: nullable(integer), task: projectedReference })])),
  taskCount: integer,
  classExperience: nullable(Type.Object({ expAmount: number, chance: number, chanceSemantics: text })),
  unsupportedUnityEvent: boolean,
  nodeRoles: Type.Object({ resource: boolean, container: boolean }),
});
const resourceProducer = Type.Union([
  oreSpawner,
  Type.Object({
    source: sourceEvidence,
    disposition: text,
    producerFamily: Type.Literal("interactiveNode"),
    role: text,
    roles: Type.Array(text),
    sourceIndex: integer,
    gatheringSkillID: nullable(integer),
    gatheringSkill: projectedReference,
    gatheringRole: Type.Object({ kind: text, skillID: nullable(integer), skill: projectedReference, sourceFieldPath: text, semantics: text }),
    resourceNode: projectedReference,
    projection: nodeProjection,
    authoredProducerIndependentOfObservation: boolean,
  }),
]);
const interaction = Type.Union([
  Type.Object({
    source: sourceEvidence,
    disposition: text,
    family: text,
    role: text,
    roles: Type.Array(text),
    roleSource: text,
    interactableName: nullableText,
    state: enumValue,
    actionsAvailable: boolean,
    actionCount: integer,
    actions: Type.Array(actionRow),
    requirementsTemplate: requirementTemplate,
    requirementsOwner: nullable(Type.Object({ ownerKind: text, sourceFieldPath: text, source: sourceEvidence })),
    resource: projectedReference,
    resourceID: nullable(integer),
    isPersistent: boolean,
    isTrigger: boolean,
    isClick: boolean,
    limitedUseAmount: boolean,
    maxUseAmount: number,
    maxActions: integer,
    cooldown: number,
    interactionTime: number,
    maxDistance: number,
    lootWindowGathering: boolean,
    allowNPCInteraction: boolean,
    requiredNPCRanksAvailable: boolean,
    requiredNPCRankCount: integer,
    requiredNPCRanks: Type.Array(nullableText),
  }),
  Type.Object({
    source: sourceEvidence,
    disposition: text,
    family: Type.Literal("chest"),
    role: text,
    roles: Type.Array(text),
    roleSource: text,
    interactableName: nullableText,
    projection: chestLootProjection,
  }),
  Type.Object({
    source: sourceEvidence,
    disposition: text,
    family: Type.Literal("interactiveNode"),
    role: text,
    roleEvidence: Type.Object({ resource: boolean, container: boolean, sourceRule: text }),
    projection: nodeProjection,
  }),
]);
const container = Type.Object({
  source: sourceEvidence,
  disposition: text,
  family: text,
  role: text,
  roles: Type.Array(text),
  roleSource: text,
  chestName: Type.Optional(nullableText),
  projection: Type.Union([chestLootProjection, nodeProjection]),
  interaction: Type.Optional(Type.Object({ interactionDistance: number, maxDrops: integer })),
});

const worldQuestReference = Type.Object({
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  quest: Type.Optional(projectedReference),
  availableDuration: Type.Optional(number),
  cooldownAfterExpiry: Type.Optional(number),
  cooldownAfterCompletion: Type.Optional(number),
  cooldownRandomJitter: Type.Optional(number),
  initialRollWindow: Type.Optional(number),
});
const questPoolRow = Type.Union([
  Type.Object({ sourceFieldPath: text, worldQuest: worldQuestReference }),
  actionUnavailable,
]);
const currentQuestObservation = Type.Union([
  Type.Object({ present: Type.Literal(false) }),
  Type.Object({ present: Type.Literal(true), worldQuest: worldQuestReference }),
  Type.Object({ present: Type.Literal(false), unavailable: text }),
]);
const questZone = Type.Object({
  source: sourceEvidence,
  disposition: text,
  family: Type.Literal("worldQuestZone"),
  role: text,
  roles: Type.Array(text),
  roleSource: text,
  selectionRule: text,
  worldQuest: nullable(worldQuestReference),
  possibleQuestsAvailable: boolean,
  possibleQuestCount: integer,
  possibleQuests: Type.Array(questPoolRow),
  zoneRespawnCooldown: number,
  currentQuestObservation,
});

const transition = Type.Object({
  source: sourceEvidence,
  disposition: text,
  transitionKind: text,
  role: Type.Literal("transition"),
  roles: Type.Array(text),
  roleSource: text,
  destinationSceneName: nullableText,
  destinationScene: nullable(canonicalReference),
  destinationReferenceStatus: text,
  destinationResolved: boolean,
});
const craftSkill = Type.Union([
  Type.Object({ sourceFieldPath: text, craftSkillID: integer, craftSkill: projectedReference, referenceStatus: text }),
  actionUnavailable,
]);
const craftingService = Type.Object({
  source: sourceEvidence,
  disposition: text,
  family: Type.Literal("craftingStation"),
  role: text,
  roles: Type.Array(text),
  roleSource: text,
  stationID: nullable(integer),
  station: projectedReference,
  stationReferenceStatus: text,
  useDistanceMax: number,
  interactableUIoffsetY: number,
  craftSkillsAvailable: boolean,
  craftSkillCount: integer,
  craftSkills: Type.Array(craftSkill),
});
const propertyService = Type.Object({
  source: sourceEvidence,
  disposition: text,
  family: Type.Literal("propertyForSaleSign"),
  role: text,
  roles: Type.Array(text),
  roleSource: text,
  propertyID: nullable(integer),
  property: projectedReference,
  propertyReferenceStatus: text,
  propertyType: enumValue,
  currencyID: nullable(integer),
  currency: projectedReference,
  currencyReferenceStatus: text,
  purchasePrice: nullable(integer),
  sellPrice: nullable(integer),
  incomeAmount: nullable(integer),
  maxInteractionDistance: number,
  uiOffsetY: number,
  signVisualObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
});
const service = Type.Union([craftingService, propertyService]);

const conditionCommon = {
  source: sourceEvidence,
  disposition: text,
  family: text,
  conditionKind: text,
  semantics: text,
};
const classEligibility = Type.Union([
  Type.Object({ sourceFieldPath: text, classID: integer, classReference: projectedReference, referenceStatus: text }),
  actionUnavailable,
]);
const raceEligibility = Type.Union([
  Type.Object({ sourceFieldPath: text, raceID: integer, race: projectedReference, referenceStatus: text }),
  actionUnavailable,
]);
const conditionSource = Type.Union([
  Type.Object({
    ...conditionCommon,
    family: Type.Literal("characterGraveyard"),
    requiredClassesAvailable: boolean,
    requiredClassCount: integer,
    requiredClasses: Type.Array(classEligibility),
    requiredRacesAvailable: boolean,
    requiredRaceCount: integer,
    requiredRaces: Type.Array(raceEligibility),
  }),
  Type.Object({
    ...conditionCommon,
    family: Type.Literal("enhancedInteractableObject"),
    targetObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    targetSource: nullable(sourceEvidence),
    activationRequirements: requirementTemplate,
    deactivationRequirements: requirementTemplate,
  }),
  Type.Object({
    ...conditionCommon,
    family: Type.Literal("activeRequirement"),
    targetObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    targetSource: nullable(sourceEvidence),
    requirementSource: enumValue,
    activationRequirement: requirementTemplate,
    requirementGroupsAvailable: boolean,
    requirementGroupCount: integer,
    requirementGroups: Type.Array(requirementGroup),
    checkEveryNFrames: integer,
  }),
  Type.Object({
    ...conditionCommon,
    family: Type.Literal("timedActiveRequirement"),
    targetObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    targetSource: nullable(sourceEvidence),
    activationRequirement: requirementTemplate,
    activationDurationSeconds: number,
  }),
  Type.Object({
    ...conditionCommon,
    family: Type.Literal("disableRequirement"),
    targetObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    targetSource: nullable(sourceEvidence),
    activationRequirement: requirementTemplate,
  }),
]);

const unsupportedSource = Type.Union([
  Type.Object({
    source: sourceEvidence,
    family: Type.Literal("randomActivator"),
    disposition: Type.Literal("unsupported"),
    targetCount: integer,
    numberToEnable: integer,
    targets: Type.Array(Type.Union([Type.Object({ sourceFieldPath: text, name: text, source: sourceEvidence, activeSelf: boolean, activeInHierarchy: boolean }), actionUnavailable])),
    reason: text,
  }),
  Type.Object({
    source: sourceEvidence,
    family: Type.Literal("interactiveZone"),
    disposition: Type.Literal("unsupported"),
    uiElement: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    reason: text,
  }),
  Type.Object({
    source: sourceEvidence,
    family: Type.Literal("heroicConsole"),
    disposition: Type.Literal("unsupported"),
    role: text,
    roles: Type.Array(text),
    maxInteractionDistance: number,
    uiOffsetY: number,
    activeVisualObject: nullable(Type.Object({ name: text, activeSelf: boolean, activeInHierarchy: boolean })),
    reason: text,
  }),
]);
const mapZone = Type.Object({
  source: sourceEvidence,
  disposition: text,
  zoneID: integer,
  map: nullable(Type.Object({ name: text, width: integer, height: integer, dimension: integer, textureType: text })),
  boxCollider: nullable(Type.Object({ center: Type.Object({ x: number, y: number, z: number }), size: Type.Object({ x: number, y: number, z: number }), boundsCenter: Type.Object({ x: number, y: number, z: number }), boundsExtents: Type.Object({ x: number, y: number, z: number }) })),
  calibration: nullable(Type.Object({ center: Type.Object({ x: number, y: number, z: number }), extents: Type.Object({ x: number, y: number }), size: Type.Object({ x: number, y: number }), rotation: number })),
  calibrationError: nullableText,
  captureBoundsValidated: boolean,
  captureBoundsNote: text,
});
const region = Type.Object({
  source: sourceEvidence,
  disposition: text,
  regionShape: enumValue,
  regionTemplate: nullable(canonicalReference),
  regionTemplateProjection: nullable(Type.Object({})),
  captureBoundsValidated: boolean,
});
const diagnostic = Type.Object({
  kind: text,
  detail: text,
  sourceFieldPath: Type.Optional(text),
  source: Type.Optional(sourceEvidence),
});
const sourceTotals = Type.Object({
  oreSpawners: integer,
  interactableObjects: integer,
  interactiveNodes: integer,
  chests: integer,
  worldQuestZones: integer,
  questScenePortals: integer,
  dungeonEntranceTriggers: integer,
  craftingStations: integer,
  propertyForSaleSigns: integer,
  heroicConsoles: integer,
  characterGraveyards: integer,
  enhancedInteractableObjects: integer,
  activeRequirements: integer,
  timedActiveRequirements: integer,
  disableRequirements: integer,
  randomActivators: integer,
  interactiveZones: integer,
  mapZones: integer,
  regions: integer,
});
const exportedTotals = Type.Object({
  resourceProducers: integer,
  interactions: integer,
  containers: integer,
  questZones: integer,
  transitions: integer,
  services: integer,
  conditionSources: integer,
  unsupportedSources: integer,
  mapZones: integer,
  regions: integer,
});

export const WorldSourcesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.world-sources.v5"),
  coverage: Type.Object({
    scope: text,
    fullGameCoverage: boolean,
    includesInactiveComponents: boolean,
    authoredCandidatesWithoutInstantiation: boolean,
    authoredCandidatesWithoutRolling: boolean,
    runtimeInstanceIdsOnlyObservation: boolean,
    componentIndexSemantics: Type.Literal("all-gameobject-components"),
    traversalPerformed: boolean,
    mapZoneCaptureBoundsValidated: boolean,
    sourceSceneNativeIdRule: text,
    unsupportedFamiliesRemainVisible: boolean,
    sourceDispositionVocabulary: Type.Array(text),
    note: text,
  }),
  nativeNamingUncertainties: Type.Array(text),
  resourceProducers: Type.Array(resourceProducer),
  interactions: Type.Array(interaction),
  containers: Type.Array(container),
  questZones: Type.Array(questZone),
  transitions: Type.Array(transition),
  mapZones: Type.Array(mapZone),
  regions: Type.Array(region),
  services: Type.Array(service),
  conditionSources: Type.Array(conditionSource),
  unsupportedSources: Type.Array(unsupportedSource),
  totals: Type.Object({ source: sourceTotals, exported: exportedTotals, unresolved: integer }),
  unresolved: Type.Array(diagnostic),
});
export type WorldSources = Static<typeof WorldSourcesSchema>;

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

export function validateWorldSources(value: Static<typeof WorldSourcesSchema>, reference: Reference): void {
  const artifact = value as unknown as AnyRecord;
  if (artifact.schemaVersion !== "compendium.world-sources.v5") throw new Error("World source schema version is invalid.");
  const totals = record(artifact.totals, "totals");
  const sourceTotalsValue = record(totals.source, "totals.source");
  const exportedTotalsValue = record(totals.exported, "totals.exported");
  const sourceArrays = {
    oreSpawners: artifact.resourceProducers.filter((row: AnyRecord) => row.producerFamily === "oreSpawner"),
    interactableObjects: artifact.interactions.filter((row: AnyRecord) => row.family === "interactableObject"),
    interactiveNodes: artifact.interactions.filter((row: AnyRecord) => row.family === "interactiveNode"),
    chests: artifact.containers.filter((row: AnyRecord) => row.family === "chest"),
    worldQuestZones: artifact.questZones.filter((row: AnyRecord) => row.family === "worldQuestZone"),
    questScenePortals: artifact.transitions.filter((row: AnyRecord) => row.transitionKind === "questScenePortal"),
    dungeonEntranceTriggers: artifact.transitions.filter((row: AnyRecord) => row.transitionKind === "dungeonEntranceTrigger"),
    craftingStations: artifact.services.filter((row: AnyRecord) => row.family === "craftingStation"),
    propertyForSaleSigns: artifact.services.filter((row: AnyRecord) => row.family === "propertyForSaleSign"),
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
  if (interactionRows.length !== sourceArrays.interactableObjects.length + sourceArrays.interactiveNodes.length + sourceArrays.chests.length) throw new Error("World interactions do not reconcile source families.");
  if (containerRows.some(row => row.family !== "chest" && row.family !== "interactiveNode")) throw new Error("World containers contain an unknown source family.");
  if (containerRows.filter(row => row.family === "interactiveNode").length !== interactionRows.filter(row => row.family === "interactiveNode" && row.roleEvidence?.container === true).length) throw new Error("World containers do not reconcile interactive-node container roles.");
  if (containerRows.length !== sourceArrays.chests.length + containerRows.filter(row => row.family === "interactiveNode").length) throw new Error("World containers do not reconcile source families.");
  if (questRows.some(row => row.family !== "worldQuestZone") || questRows.length !== sourceArrays.worldQuestZones.length) throw new Error("World quest zones do not reconcile source families.");
  if (transitionRows.some(row => row.transitionKind !== "questScenePortal" && row.transitionKind !== "dungeonEntranceTrigger") || transitionRows.length !== sourceArrays.questScenePortals.length + sourceArrays.dungeonEntranceTriggers.length) throw new Error("World transitions do not reconcile source families.");
  if (serviceRows.some(row => row.family !== "craftingStation" && row.family !== "propertyForSaleSign") || serviceRows.length !== sourceArrays.craftingStations.length + sourceArrays.propertyForSaleSigns.length) throw new Error("World services do not reconcile source families.");
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
