type ConditionReferenceField = readonly [field: string, targetKind: string];

const conditionReferenceFields: readonly ConditionReferenceField[] = [
  ["abilityID", "abilities"],
  ["bonusID", "bonuses"],
  ["recipeID", "recipes"],
  ["resourceID", "resources"],
  ["effectID", "effects"],
  ["NPCID", "npcs"],
  ["statID", "stats"],
  ["factionID", "factions"],
  ["comboID", "combos"],
  ["raceID", "races"],
  ["levelsID", "levels"],
  ["classID", "classes"],
  ["speciesID", "species"],
  ["itemID", "items"],
  ["currencyID", "currencies"],
  ["pointID", "treePoints"],
  ["talentTreeID", "talentTrees"],
  ["skillID", "skills"],
  ["spellbookID", "spellbooks"],
  ["weaponTemplateID", "weaponTemplates"],
  ["enchantmentID", "enchantments"],
  ["gearSetID", "gearSets"],
  ["gameSceneID", "scenes"],
  ["questID", "quests"],
  ["dialogueID", "dialogues"],
];

const conditionReferenceFieldsByType: Record<string, ConditionReferenceField[]> = {
  Ability: [["abilityID", "abilities"]],
  Bonus: [["bonusID", "bonuses"]],
  Recipe: [["recipeID", "recipes"]],
  Resource: [["resourceID", "resources"]],
  Effect: [["effectID", "effects"]],
  NPCKilled: [["NPCID", "npcs"]],
  NPCFamily: [],
  Stat: [["statID", "stats"]],
  StatCost: [["statID", "stats"]],
  Faction: [["factionID", "factions"]],
  FactionStance: [],
  Combo: [["comboID", "combos"]],
  Race: [["raceID", "races"]],
  Level: [["levelsID", "levels"]],
  Gender: [],
  Class: [["classID", "classes"]],
  Species: [["speciesID", "species"]],
  Item: [["itemID", "items"]],
  Currency: [["currencyID", "currencies"]],
  Point: [["pointID", "treePoints"]],
  TalentTree: [["talentTreeID", "talentTrees"]],
  Skill: [["skillID", "skills"]],
  Spellbook: [["spellbookID", "spellbooks"]],
  WeaponTemplate: [["weaponTemplateID", "weaponTemplates"]],
  Enchantment: [["enchantmentID", "enchantments"]],
  GearSet: [["gearSetID", "gearSets"]],
  GameScene: [["gameSceneID", "scenes"]],
  Quest: [["questID", "quests"]],
  DialogueNode: [["dialogueID", "dialogues"]],
  Region: [],
  CombatState: [],
  Stealth: [],
  Mounted: [],
  Grounded: [],
  Time: [],
};

export function applicableConditionReferenceFields(requirementType: unknown): readonly ConditionReferenceField[] {
  // Unknown discriminators keep every candidate field in scope until native
  // applicability is established; callers must not silently discard uncertainty.
  if (typeof requirementType !== "string") return conditionReferenceFields;
  if (!Object.prototype.hasOwnProperty.call(conditionReferenceFieldsByType, requirementType)) return conditionReferenceFields;
  return conditionReferenceFieldsByType[requirementType]!;
}
