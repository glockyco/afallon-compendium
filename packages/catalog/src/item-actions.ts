import type { NormalizedItemGameAction, NormalizedReference, ProvenanceReference } from "@afallon/contracts/catalog";
import type { Blocker } from "./context";
import type { ItemGameplay } from "./decoders";

type Targets = Extract<NonNullable<ItemGameplay["gameActions"]>["actions"][number], { targets: unknown }>["targets"];
type Resolve = (kind: string, nativeId: number, label: string, path: string, provenance: ProvenanceReference[]) => NormalizedReference | null;

// The target field that GameActionsManager reads for each action type, and the catalog kind of that target. A null kind
// is a target that the scan does not capture as a record.
const TARGETS: Readonly<Record<string, { field: keyof Targets; kind: string | null; label: string }>> = {
  Ability: { field: "abilityId", kind: "abilities", label: "Ability" },
  Bonus: { field: "bonusId", kind: "bonuses", label: "Bonus" },
  Recipe: { field: "recipeId", kind: "recipes", label: "Recipe" },
  Resource: { field: "resourceId", kind: "resources", label: "Resource" },
  Effect: { field: "effectId", kind: "effects", label: "Effect" },
  NPC: { field: "npcId", kind: "npcs", label: "NPC" },
  Faction: { field: "factionId", kind: "factions", label: "Faction" },
  Item: { field: "itemId", kind: "items", label: "Item" },
  Currency: { field: "currencyId", kind: "currencies", label: "Currency" },
  Point: { field: "pointId", kind: "treePoints", label: "Point" },
  Skill: { field: "skillId", kind: "skills", label: "Skill" },
  TalentTree: { field: "talentTreeId", kind: "talentTrees", label: "Talent tree" },
  WeaponTemplate: { field: "weaponTemplateId", kind: null, label: "Weapon template" },
  Quest: { field: "questId", kind: "quests", label: "Quest" },
  Dialogue: { field: "dialogueId", kind: null, label: "Dialogue" },
  LootTable: { field: "lootTableId", kind: "lootTables", label: "Loot table" },
};
// Action types without a target identifier. A Teleport action names a scene only for a GameScene teleport.
const UNTARGETED = new Set(["DialogueNode", "CombatState", "Dismount", "GameObject", "TriggerVisualEffect", "TriggerAnimation", "TriggerSound", "SaveCharacter", "Death", "ResetSprint", "ResetBlocking", "Time"]);

/**
 * Decodes the game actions of one item in the order that the game reads them. Each action keeps its type, chance, node
 * action, amount, and target. A target that is unset, not captured, or missing from the catalog becomes a coverage issue.
 */
export function itemGameActions(entityKey: string, gameActions: ItemGameplay["gameActions"], path: string, provenance: ProvenanceReference[], resolve: Resolve, blockers: Blocker[]): NormalizedItemGameAction[] {
  if (!gameActions) return [];
  const template = gameActions.template === null ? null : { nativeId: gameActions.template.nativeId, name: gameActions.template.internalName };
  return gameActions.actions.flatMap((action) => {
    const actionPath = `${path}/gameActions/actions/${action.sourceIndex}`;
    if ("unavailable" in action) { blockers.push({ kind: "unavailable-game-action", key: `${entityKey}:${action.sourceIndex}`, detail: action.unavailable, provenance }); return []; }
    const type = action.type.name, teleport = type === "Teleport";
    const spec = teleport ? (action.teleportType.name === "GameScene" ? { field: "gameSceneId" as const, kind: "scenes", label: "Scene" } : null) : TARGETS[type] ?? null;
    if (spec === null && !teleport && !UNTARGETED.has(type)) blockers.push({ kind: "unsupported-game-action", key: `${entityKey}:${action.sourceIndex}`, detail: `Game action type ${type} has no known target rule.`, provenance });
    let target: NormalizedReference | null = null;
    if (spec !== null) {
      const nativeId = action.targets[spec.field];
      if (nativeId < 0) blockers.push({ kind: "unset-game-action-target", key: `${entityKey}:${action.sourceIndex}`, detail: `${type} action has no ${spec.label.toLowerCase()} identifier.`, provenance });
      else if (spec.kind === null) { target = { entityKey: null, label: `${spec.label} ${nativeId}` }; blockers.push({ kind: "uncaptured-game-action-target", key: `${entityKey}:${action.sourceIndex}`, detail: `The scan does not capture ${spec.label.toLowerCase()} records.`, provenance }); }
      else target = resolve(spec.kind, nativeId, `${spec.label} ${nativeId}`, `${actionPath}/targets/${spec.field}`, provenance);
    }
    return [{ entityKey, actionIndex: action.sourceIndex, template, type, chance: action.chance, nodeAction: action.nodeAction.name, progressionType: action.progressionType.name, teleportType: action.teleportType.name, amount: action.amount, target, provenance }];
  });
}
