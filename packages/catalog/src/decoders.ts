import { Type, type Static, type TSchema } from "typebox";
import { decodeContract, schemaRegistry, type Canonical, type Relationships } from "@afallon/contracts";
import type { ArtifactReference } from "@afallon/contracts/catalog";

const integer = Type.Integer();
const number = Type.Number();
const boolean = Type.Boolean();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const optional = <T extends TSchema>(schema: T) => Type.Optional(schema);
const MovementSchema = Type.Union([
  Type.Null(),
  Type.Object({ kind: Type.Literal("roaming"), roamDistance: number, roamAroundSpawner: boolean, usePOIs: boolean, poiPathName: text, poiRoamRadius: number }),
  Type.Object({ kind: Type.Literal("patrol"), patrolPathName: text, patrolPathNames: Type.Array(text), randomPath: boolean, pauseAtFirstPointSeconds: number, pauseAtLastPointSeconds: number, pauseAtPointSeconds: number }),
]);
const BehaviorSchema = Type.Object({ behaviorIndex: integer, chance: number, name: text, defaultStateType: Type.Union([text, Type.Null()]), defaultStateTemplateType: Type.Union([text, Type.Null()]), movement: MovementSchema });
export const SupportedGameplaySchema = Type.Object({
  isMerchant: optional(boolean), isQuestGiver: optional(boolean), startPositionId: optional(integer),
  minLevel: optional(integer), maxLevel: optional(integer), includedInAdventureGuide: optional(boolean),
  dungeonLevelMin: optional(integer), dungeonLevelMax: optional(integer), levelRangeMin: optional(integer), levelRangeMax: optional(integer),
  adventureGuideDescription: optional(nullableText), income: optional(number), isPercentStat: optional(boolean),
  adventureGuideBosses: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), npcId: integer }))),
  aiPhases: optional(Type.Array(Type.Object({ phaseIndex: integer, name: nullableText, requirement: optional(nullableText), abilityIds: Type.Array(integer), behaviors: optional(Type.Array(BehaviorSchema)) }))),
  guideStats: optional(Type.Array(Type.Object({ statId: integer, value: number }))),
});
export type SupportedGameplay = Static<typeof SupportedGameplaySchema>;

const RequirementSchema = Type.Object({
  sourceFieldPath: optional(text), groupIndex: optional(integer), requirementIndex: optional(integer),
  requirementType: optional(text), requirementTypeValue: optional(integer), conditionRule: optional(text), conditionRuleValue: optional(integer),
  evaluation: optional(text), amount1: optional(number), amount2: optional(number), float1: optional(number), consume: optional(boolean),
  abilityID: optional(integer), bonusID: optional(integer), recipeID: optional(integer), resourceID: optional(integer), effectID: optional(integer), NPCID: optional(integer), statID: optional(integer), factionID: optional(integer), comboID: optional(integer), raceID: optional(integer), levelsID: optional(integer), classID: optional(integer), speciesID: optional(integer), itemID: optional(integer), currencyID: optional(integer), pointID: optional(integer), talentTreeID: optional(integer), skillID: optional(integer), spellbookID: optional(integer), weaponTemplateID: optional(integer), enchantmentID: optional(integer), gearSetID: optional(integer), gameSceneID: optional(integer), questID: optional(integer), dialogueID: optional(integer),
});
const RequirementGroupSchema = Type.Object({ nativeRequirementCount: integer, checkCount: optional(boolean), requiredCount: optional(integer), requirements: Type.Array(Type.Union([RequirementSchema, Type.Null()])) });
export const RequirementTemplateSchema = Type.Union([Type.Null(), Type.Object({ nativeId: integer, sourceName: Type.Union([text, Type.Null()]), groups: Type.Array(Type.Union([RequirementGroupSchema, Type.Null()])) })]);
export const RelationshipExtrasSchema = Type.Object({ sourceFieldPath: optional(text), dropRateSemantics: optional(text), rewardSource: optional(text), rewardIndex: optional(integer), itemIndex: optional(integer), count: optional(number), useRequirementsTemplate: optional(boolean) });

schemaRegistry.register("compendium.catalog-supported-gameplay.v1", SupportedGameplaySchema);
schemaRegistry.register("compendium.catalog-requirement-template.v1", RequirementTemplateSchema);
schemaRegistry.register("compendium.catalog-relationship-extras.v1", RelationshipExtrasSchema);

export function decodeGameplay(value: unknown, reference: ArtifactReference, pointer: string): SupportedGameplay {
  return decodeContract(SupportedGameplaySchema, value, { objectId: reference.sha256, target: `canonical${pointer}/gameplay` });
}

export function validateSupportedSemantics(canonical: Canonical, relationships: Relationships, canonicalReference: ArtifactReference, relationshipReference: ArtifactReference) {
  const gameplay = new Map<string, SupportedGameplay>();
  for (const kind of ["items", "npcs", "quests", "lootTables", "scenes", "resources", "stats", "regions", "properties"] as const) {
    for (const [index, row] of canonical[kind].entries()) gameplay.set(`${kind}:${row.nativeId}`, decodeGameplay(row.gameplay, canonicalReference, `/${kind}/${index}`));
  }
  for (const [family, rows] of Object.entries(relationships)) {
    if (!Array.isArray(rows)) continue;
    for (const [index, row] of rows.entries()) {
      if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
      decodeContract(RelationshipExtrasSchema, row, { objectId: relationshipReference.sha256, target: `relationships/${family}/${index}` });
      if ("requirementsTemplate" in row) decodeContract(RequirementTemplateSchema, row.requirementsTemplate, { objectId: relationshipReference.sha256, target: `relationships/${family}/${index}/requirementsTemplate` });
    }
  }
  return gameplay;
}
