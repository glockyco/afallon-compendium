import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import type { PlacementIdentityResult } from "../raw/placement";
import type { SpatialResolution } from "../spatial/reviewed";
import type { RoleScope } from "./roles";
import type { TooltipLine } from "./tooltip";

export const NORMALIZED_PLAN_SCHEMA_VERSION = "compendium.normalization-plan.v1" as const;
export const NORMALIZED_OUTPUT_SCHEMA_VERSION = "compendium.normalized-output.v5" as const;

const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
const text = Type.String({ minLength: 1 });
const nullableText = Type.Union([text, Type.Null()]);
const id = Type.Integer();
const coordinate = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });

export const ArtifactReferenceSchema = Type.Object({
  path: text,
  sha256: hash,
  bytes: Type.Optional(Type.Integer({ minimum: 0 })),
  artifact: Type.Optional(text),
  kind: Type.Optional(text),
}, { additionalProperties: false });
export type ArtifactReference = Static<typeof ArtifactReferenceSchema>;

export const SceneSnapshotReferenceSchema = Type.Object({
  manifest: ArtifactReferenceSchema,
  prefix: Type.Optional(text),
}, { additionalProperties: false });
export type SceneSnapshotReference = Static<typeof SceneSnapshotReferenceSchema>;

export const NormalizationPlanSchema = Type.Object({
  schemaVersion: Type.Literal(NORMALIZED_PLAN_SCHEMA_VERSION),
  buildId: text,
  canonicalManifest: ArtifactReferenceSchema,
  mapSpaceProfile: ArtifactReferenceSchema,
  sceneSnapshots: Type.Array(SceneSnapshotReferenceSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type NormalizationPlan = Static<typeof NormalizationPlanSchema>;

export type CanonicalKind = "items" | "npcs" | "quests" | "lootTables" | "scenes" | "resources" | string;
export type ProvenanceReference = ArtifactReference & { pointer?: string };

export interface CatalogDerivation {
  factKind: string;
  factKey: string;
  rule: string;
  version: number;
  inputs: ProvenanceReference[];
}

export interface CatalogImageryRow {
  assetId: string;
  mapSpaceId: string;
  kind: "game-map" | "captured";
  sha256: string;
  bytes: number;
  metadata: unknown;
  provenance: ProvenanceReference[];
}

export interface NormalizedReference { entityKey: string | null; label: string }
export interface NormalizedContextualAbilityReference { ability: NormalizedReference; rankIndex: number; sourceIndex: number }
export interface NormalizedAbilityRank { rankIndex: number; lines: TooltipLine[]; provenance: ProvenanceReference[] }
export interface NormalizedItemFact {
  entityKey: string; rarity: string | null; itemType: string | null; armorSlot: string | null; weaponSlot: string | null; weaponType: string | null; armorType: string | null;
  attackSpeed: number | null; minDamage: number | null; maxDamage: number | null; randomStatsMax: number; gemType: string | null; enchantment: NormalizedReference | null;
  sellPrice: number | null; sellCurrency: NormalizedReference | null; buyPrice: number | null; buyCurrency: NormalizedReference | null; stackLimit: number; questDropOnly: boolean; corruptionToken: boolean;
  levelRequirement: number | null; actionAbilities: NormalizedContextualAbilityReference[]; useLines: TooltipLine[]; conditionIds: string[]; provenance: ProvenanceReference[];
}
export interface NormalizedItemStat { entityKey: string; statIndex: number; stat: NormalizedReference; amount: number; isPercent: boolean; provenance: ProvenanceReference[] }
export interface NormalizedItemRandomStat { entityKey: string; statIndex: number; stat: NormalizedReference; min: number; max: number; isPercent: boolean; whole: boolean; chance: number | null; provenance: ProvenanceReference[] }
export interface NormalizedItemGemStat { entityKey: string; statIndex: number; stat: NormalizedReference; amount: number; isPercent: boolean; provenance: ProvenanceReference[] }
export interface NormalizedItemSocket { entityKey: string; socketIndex: number; socketType: string | null; gemType: string | null; provenance: ProvenanceReference[] }
export interface NormalizedNpcAdventurer {
  class: NormalizedReference | null; race: NormalizedReference | null; preferredTree: NormalizedReference | null; keepPhaseAbilities: boolean; aiLogicTemplateKey: string | null;
  specialization: { class: NormalizedReference | null; role: string; preferredTree: NormalizedReference | null; behaviorName: string | null; priorityAbilities: NormalizedReference[]; blockedAbilities: NormalizedReference[]; blockedBonuses: number[]; allowedForms: number[] } | null;
}
export interface NormalizedNpcFlightNetwork {
  resourcePath: string | null; stopId: string | null; interactionDistance: number | null; networkId: string; sceneName: string; mapWorldBounds: { x: number; y: number; width: number; height: number }; minimumFlyoverHeight: number; currency: NormalizedReference | null;
  stops: Array<{ id: string; name: string; landingPosition: { x: number; y: number; z: number }; landingYaw: number; knownInitially: boolean; resolution: SpatialResolution }>;
  routes: Array<{ from: string; to: string; bidirectional: boolean; fare: number; speed: number; departureCruiseWaypoint: number; arrivalCruiseWaypoint: number; waypoints: Array<{ x: number; y: number; z: number }> }>;
}
export interface NormalizedNpcFact {
  entityKey: string; minLevel: number | null; maxLevel: number | null; scalesWithPlayer: boolean; npcType: string | null; creatureType: string | null; family: string | null;
  faction: NormalizedReference | null; species: NormalizedReference | null; isMerchant: boolean; isQuestGiver: boolean; isCombatEnabled: boolean; isAuctioneer: boolean; isBanker: boolean; isFlightMaster: boolean; minRespawn: number | null; maxRespawn: number | null;
  minExperience: number | null; maxExperience: number | null; immuneToStun: boolean; immuneToSlow: boolean; aggroRange: number | null; linkedNpc: NormalizedReference | null;
  hunterTamable: boolean; hunterBeastRole: string | null; equipmentAppearanceSelections: string | null; adventurer: NormalizedNpcAdventurer | null; flightNetwork: NormalizedNpcFlightNetwork | null;
  lootSpecialization: { armorType: string | null; weaponTypes: string[]; stat: NormalizedReference | null } | null; provenance: ProvenanceReference[];
}
export interface NormalizedNpcStat { entityKey: string; statIndex: number; stat: NormalizedReference; amount: number; isPercent: boolean; provenance: ProvenanceReference[] }
export interface NormalizedNpcAbilityPhase { entityKey: string; phaseIndex: number; name: string | null; requirement: string | null; provenance: ProvenanceReference[] }
export interface NormalizedNpcPhaseAbility { entityKey: string; phaseIndex: number; abilityIndex: number; sourceIndex: number; ability: NormalizedReference; rankIndex: number; provenance: ProvenanceReference[] }
export interface NormalizedNpcFactionReward { entityKey: string; rewardIndex: number; faction: NormalizedReference; amount: number; provenance: ProvenanceReference[] }
export interface NormalizedQuestFact { entityKey: string; chainName: string | null; chainOrder: number | null; repeatable: boolean; turnInWithoutNpc: boolean; completedDescription: string | null; objectiveText: string | null; levelRequirement: number | null; experience: number | null; conditionIds: string[]; provenance: ProvenanceReference[] }
export interface NormalizedQuestObjective { questEntityKey: string; objectiveIndex: number; taskType: string; task: NormalizedReference; target: NormalizedReference | null; count: number | null; keepItems: boolean | null; sceneName: string | null; provenance: ProvenanceReference[] }
export interface NormalizedQuestReward { questEntityKey: string; rewardSet: "given" | "pick" | "itemGiven"; rewardIndex: number; rewardType: string; target: NormalizedReference | null; count: number | null; experience: number | null; provenance: ProvenanceReference[] }
export interface NormalizedPlaceFact { entityKey: string; placeType: "dungeon" | "zone" | "region" | "interior"; guideIncluded: boolean; guideDescription: string | null; levelMin: number | null; levelMax: number | null; mapSpaceIds: string[]; bosses: NormalizedReference[]; parentSceneKey: string | null; provenance: ProvenanceReference[] }
export interface NormalizedPropertyFact { entityKey: string; income: number | null; purchasePrice: number | null; sellPrice: number | null; currency: NormalizedReference | null; propertyType: string | null; provenance: ProvenanceReference[] }
export interface NormalizedTaskFact { entityKey: string; taskType: string; target: NormalizedReference | null; count: number | null; keepItems: boolean | null; sceneName: string | null; provenance: ProvenanceReference[] }
export interface NormalizedAbilityFact { entityKey: string; ranks: NormalizedAbilityRank[]; provenance: ProvenanceReference[] }
export interface NormalizedRecipeFact { entityKey: string; skill: NormalizedReference | null; station: NormalizedReference | null; learnedByDefault: boolean; provenance: ProvenanceReference[] }
export interface NormalizedRecipeRank { entityKey: string; rank: number; unlockCost: number; experience: number; craftTime: number; provenance: ProvenanceReference[] }
export interface NormalizedRecipeProduct { entityKey: string; rank: number; productIndex: number; item: NormalizedReference; count: number; chance: number; provenance: ProvenanceReference[] }
export interface NormalizedRecipeMaterial { entityKey: string; rank: number; materialIndex: number; item: NormalizedReference; count: number; provenance: ProvenanceReference[] }
export interface NormalizedCraftingStationFact { entityKey: string; maxDistance: number; skillRefs: NormalizedReference[]; provenance: ProvenanceReference[] }
export interface NormalizedGearSetFact { entityKey: string; provenance: ProvenanceReference[] }
export interface NormalizedGearSetMember { entityKey: string; memberIndex: number; item: NormalizedReference; provenance: ProvenanceReference[] }
export interface NormalizedGearSetTier { entityKey: string; tierIndex: number; equipped: number; provenance: ProvenanceReference[] }
export interface NormalizedGearSetTierStat { entityKey: string; tierIndex: number; statIndex: number; stat: NormalizedReference; amount: number; isPercent: boolean; provenance: ProvenanceReference[] }
export interface NormalizedArtworkAsset { assetId: string; sha256: string; bytes: number; width: number; height: number; sourceName: string; provenance: ProvenanceReference[] }
export interface NormalizedArtworkBinding { entityKey: string; role: "icon" | "portrait" | "artwork"; assetId: string; provenance: ProvenanceReference[] }

export interface NormalizedEntity {
  entityKey: string;
  buildId: string;
  kind: CanonicalKind;
  nativeId: number;
  name: string | null;
  internalName: string | null;
  description: string | null;
  sourceKey: number | null;
  publicData: { localization: unknown | null; gameplay: unknown | null; icon: unknown | null };
  provenance: ProvenanceReference[];
}

export interface NormalizedPlacementIdentity {
  sceneSourceSha256: string;
  sourceSha256: string;
  serializedFile: string;
  gameObjectPathId: string;
  origin: "scene" | "streamed-prefab";
  loaderSourceId: string | null;
}

export type NormalizedRegionGeometry =
  | { kind: "box"; corners: [[number, number], [number, number], [number, number], [number, number]] }
  | { kind: "sphere"; center: [number, number]; radius: number };

export interface NormalizedRegion {
  regionId: string;
  buildId: string;
  sceneNativeId: number;
  scenePath: string;
  name: string;
  internalName: string | null;
  shape: "box" | "sphere";
  worldGeometry: NormalizedRegionGeometry;
  mapSpaceId: string | null;
  mapGeometry: NormalizedRegionGeometry | null;
  provenance: ProvenanceReference[];
}

export interface NormalizedPlacement {
  placementId: string;
  buildId: string;
  sceneNativeId: number;
  scenePath: string;
  identity: NormalizedPlacementIdentity | null;
  label?: string | null;
  mapSpaceId: string | null;
  worldPosition: { x: number; y: number; z: number };
  mapPosition: { x: number; y: number } | null;
  sourceIds: string[];
  roles: Array<{ role: string; npcId: number | null; scope: RoleScope; sourceIds: string[] }>;
  shape: Record<string, unknown> | null;
  provenance: ProvenanceReference[];
}

export interface NormalizedCondition {
  conditionId: string;
  ownerType: string;
  ownerKey: string;
  ordinal: number;
  semantics: string;
  scope: "equipment" | "use" | null;
  sourceFieldPath: string | null;
  payload: unknown;
  provenance: ProvenanceReference[];
}

export interface NormalizedSource {
  sourceId: string;
  placementId: string;
  buildId: string;
  componentType: string | null;
  componentInstanceId: number;
  gameObjectInstanceId: number;
  sceneSourceSha256: string;
  sourceSha256: string;
  serializedFile: string;
  gameObjectPathId: string;
  componentPathId: string;
  assembly: string;
  origin: "scene" | "streamed-prefab";
  loaderSourceId: string | null;
  families: string[];
  provenance: ProvenanceReference[];
}

export interface NormalizedSpawnCandidate {
  sourceId: string;
  candidateIndex: number;
  npcId: number | null;
  minCount: number | null;
  maxCount: number | null;
  rawChance: number | null;
  chanceSemantics: string;
  payload: unknown;
  provenance: ProvenanceReference[];
}

export interface NormalizedPatrolPath {
  sceneNativeId: number;
  scenePath: string;
  name: string;
  looping: boolean;
  groupPatrol: boolean;
  groupSpacing: number;
  poiRadius: number;
  worldPoints: Array<{ x: number; y: number; z: number }>;
  provenance: ProvenanceReference[];
}

export interface NormalizedSourceDetail {
  sourceId: string;
  placementId: string;
  family: string;
  data: Record<string, unknown>;
}

// Where the first entry into a scene lands the player: the RPGWorldPosition record that the
// scene's startPositionID names. Later entries land where the player last left the scene.
export interface NormalizedSceneSpawn {
  sceneNativeId: number;
  startPositionId: number;
  position: { x: number; y: number; z: number };
}

export interface CategoryMetadata {
  category: string;
  label: string;
  placementIds: string[];
  entityKeys: string[];
  roleCount: number;
}

export interface EntityRelationshipProjection {
  merchantStock: Array<{ merchantTableId: number | null; stockIndex: number | null; itemId: number | null; currencyId: number | null; cost: number | null; ownerNativeIds: number[] }>;
  lootBindings: Array<{ context: "npc" | "world"; ownerNativeId: number | null; lootTableId: number | null; bindingIndex: number | null; rawRate: number | null; conditionId: string | null }>;
  lootEntries: Array<{ lootTableId: number | null; entryIndex: number | null; itemId: number | null; min: number | null; max: number | null; rawRate: number | null }>;
  resourceYields: Array<{ yieldId: string; sourceId: string | null; resourceId: number | null; itemId: number | null; rank: number | null; min: number | null; max: number | null }>;
  questAssociations: Array<{ associationId: string; associationKind: string; ownerNativeId: number | null; questId: number | null; taskId: number | null; itemId: number | null; context: Record<string, unknown> }>;
  transitions: Array<{ transitionId: string; sourceSceneNativeId: number | null; destinationSceneNativeId: number | null; transitionKind: string }>;
  conditions: NormalizedCondition[];
}

export interface EntityDetail {
  entityKey: string;
  kind: string;
  nativeId: number;
  name: string | null;
  internalName: string | null;
  description: string | null;
  publicData: { localization: unknown | null; gameplay: unknown | null; icon: unknown | null };
  roles: string[];
  placementIds: string[];
  sources: Array<{ sourceKind: string; sourceKey: string; placementIds: string[]; conditionIds: string[]; context: Record<string, unknown> }>;
  relationships: EntityRelationshipProjection;
  provenance: ProvenanceReference[];
}

export interface ItemSource {
  itemKey: string;
  itemId: number;
  sources: Array<{
    sourceKind: "merchant" | "npc-loot" | "world-loot" | "container" | "resource" | "quest" | "npc-start-item";
    sourceKey: string;
    placementIds: string[];
    conditionIds: string[];
    context: Record<string, unknown>;
    probability: null;
  }>;
}

export interface CatalogCoverageState {
  complete: false;
  blockers: Array<{ kind: string; key: string; detail: string; provenance: ProvenanceReference[] }>;
  // A reviewed domain box decides what a map shows. A placement outside every box of its scene's
  // bindings is a deliberate, evidence-backed exclusion, not an unresolved gap.
  exclusions: Array<{ kind: "outside-reviewed-domain"; key: string; detail: string; mapSpaceIds: string[]; provenance: ProvenanceReference[] }>;
  unresolved: { unplacedSources: number; unresolvedIssues: number; missingReferences: number };
}

export interface NormalizedOutput {
  schemaVersion: typeof NORMALIZED_OUTPUT_SCHEMA_VERSION;
  buildId: string;
  runId: string;
  manifest: string;
  directory: string;
  database: string;
  counts: {
    entities: number;
    placements: number;
    regions: number;
    sources: number;
    roles: number;
    conditions: number;
    domainRelations: number;
    blockers: number;
  };
  coverage: Pick<CatalogCoverageState, "complete" | "unresolved">;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export interface NormalizedDatabaseInput {
  buildId: string;
  sourceRunId?: string;
  sourceRunIds?: Record<string, string[]>;
  derivations?: CatalogDerivation[];
  imagery?: CatalogImageryRow[];
  itemFacts?: NormalizedItemFact[];
  itemStats?: NormalizedItemStat[];
  itemRandomStats?: NormalizedItemRandomStat[];
  itemGemStats?: NormalizedItemGemStat[];
  itemSockets?: NormalizedItemSocket[];
  npcFacts?: NormalizedNpcFact[];
  npcStats?: NormalizedNpcStat[];
  npcAbilityPhases?: NormalizedNpcAbilityPhase[];
  npcPhaseAbilities?: NormalizedNpcPhaseAbility[];
  npcFactionRewards?: NormalizedNpcFactionReward[];
  questFacts?: NormalizedQuestFact[];
  questObjectives?: NormalizedQuestObjective[];
  questRewards?: NormalizedQuestReward[];
  placeFacts?: NormalizedPlaceFact[];
  propertyFacts?: NormalizedPropertyFact[];
  taskFacts?: NormalizedTaskFact[];
  abilityFacts?: NormalizedAbilityFact[];
  recipeFacts?: NormalizedRecipeFact[];
  recipeRanks?: NormalizedRecipeRank[];
  recipeProducts?: NormalizedRecipeProduct[];
  recipeMaterials?: NormalizedRecipeMaterial[];
  craftingStationFacts?: NormalizedCraftingStationFact[];
  gearSetFacts?: NormalizedGearSetFact[];
  gearSetMembers?: NormalizedGearSetMember[];
  gearSetTiers?: NormalizedGearSetTier[];
  gearSetTierStats?: NormalizedGearSetTierStat[];
  artworkAssets?: NormalizedArtworkAsset[];
  artworkBindings?: NormalizedArtworkBinding[];
  identityResults: Array<{ runId: string; snapshotId: string; snapshotPrefix: string; snapshotSha256: string; character: string; sceneHandle: number; result: PlacementIdentityResult }>;
  entities: NormalizedEntity[];
  scenes: Array<{ nativeId: number; path: string; name: string | null }>;
  mapSpaces: Array<{ id: string; label: string }>;
  bindings: Array<{ id: string; mapSpaceId: string; sceneNativeId: number; scenePath: string; frame: unknown; domain: { kind: "scene" } | { kind: "boxes"; boxes: unknown } }>;
  placements: NormalizedPlacement[];
  sources: NormalizedSource[];
  roles: Array<{ placementId: string; sourceId: string; role: string; npcId: number | null; scope: RoleScope; evidence: ProvenanceReference[] }>;
  regions: NormalizedRegion[];
  conditions: NormalizedCondition[];
  spawnCandidates: NormalizedSpawnCandidate[];
  merchantTables: Array<Record<string, unknown>>;
  merchantBindings: Array<Record<string, unknown>>;
  merchantStock: Array<Record<string, unknown>>;
  lootTables: Array<Record<string, unknown>>;
  lootBindings: Array<Record<string, unknown>>;
  lootEntries: Array<Record<string, unknown>>;
  linkedNpcRules: Array<Record<string, unknown>>;
  resourceYields: Array<Record<string, unknown>>;
  questAssociations: Array<Record<string, unknown>>;
  transitions: Array<Record<string, unknown>>;
  itemSources: ItemSource[];
  entityDetails: EntityDetail[];
  sourceDetails: NormalizedSourceDetail[];
  patrolPaths: NormalizedPatrolPath[];
  sceneSpawns: NormalizedSceneSpawn[];
  blockers: CatalogCoverageState["blockers"];
  coverageOccurrences: Array<{
    runId: string;
    kind: string;
    subjectKey: string;
    semanticDiscriminator: string;
    artifactHash: string;
    sourceKey: string;
    recordPath: string;
    evidence: unknown;
  }>;
  exclusions: CatalogCoverageState["exclusions"];
  inputCoverage: unknown | null;
  provenance: { plan: ArtifactReference; profile: ArtifactReference; sources: ArtifactReference[] };
}

export function entityKey(kind: string, nativeId: number): string {
  return `${kind}:${nativeId}`;
}

export function assertNormalizationPlan(value: unknown): asserts value is NormalizationPlan {
  Assert(NormalizationPlanSchema, value);
  const plan = value as NormalizationPlan;
  if (plan.schemaVersion !== NORMALIZED_PLAN_SCHEMA_VERSION) throw new TypeError(`Normalization plan schemaVersion must be ${NORMALIZED_PLAN_SCHEMA_VERSION}.`);
  if (plan.buildId.length === 0) throw new TypeError("Normalization plan buildId is required.");
  if (plan.sceneSnapshots?.some((snapshot) => Object.keys(snapshot).length === 0)) throw new TypeError("Every scene snapshot must select at least one source artifact.");
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
}

export function publicEntityDetails(row: { name?: unknown; internalName?: unknown; description?: unknown }): { name: string | null; internalName: string | null; description: string | null } {
  const textOrNull = (value: unknown): string | null => typeof value === "string" ? value : null;
  return { name: textOrNull(row.name), internalName: textOrNull(row.internalName), description: textOrNull(row.description) };
}

export type NormalizedOutputStatic = Pick<NormalizedOutput, "schemaVersion" | "buildId" | "runId" | "manifest" | "directory" | "database">;

export const PublicationPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-plan.v2"),
  buildId: text,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  normalized: ArtifactReferenceSchema,
  pyramids: Type.Array(ArtifactReferenceSchema, { minItems: 1 }),
  illustrations: Type.Array(ArtifactReferenceSchema),
  worldOffsets: ArtifactReferenceSchema,
}, { additionalProperties: false });
export type PublicationPlan = Static<typeof PublicationPlanSchema>;
