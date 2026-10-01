import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogProgressionFact, CatalogRelations, CatalogRequirement, CatalogRequirementSpan, ProgressionAbility, ProgressionClass, ProgressionSkill, CatalogMechanicsRule } from "@afallon/contracts/catalog";
import type { PublicAbility, PublicClass, PublicItem, PublicSkill } from "@afallon/contracts/public";
import { readerCoverage } from "./coverage";
import { projectPublicDocuments } from "./documents";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({ entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [] });
const entities = [
  entity("classes", 0, "Shieldmaster"), entity("classes", 5, "Assassin"), entity("classes", 6, "Hunter"), entity("races", 1, "Dwarf"),
  entity("abilities", 0, "Cleave"), entity("abilities", 1, "Barbed Quarrel"), entity("abilities", 2, "Auto attack"),
  entity("skills", 0, "Alchemy"), entity("skills", 3, "Axes"), entity("skills", 11, "Savers"), entity("recipes", 81, "Elixir"), entity("items", 1, "Potion"),
  entity("stats", 121, "Mana"), entity("stats", 125, "Block chance"),
];
const ref = (key: string, label: string) => ({ entityKey: key, label });
const named = (value: number, name: string) => ({ value, name });
const emptyReferences: CatalogRequirement["references"] = { ability: null, bonus: null, recipe: null, resource: null, effect: null, npc: null, stat: null, faction: null, combo: null, race: null, levels: null, class: null, species: null, item: null, currency: null, point: null, talentTree: null, skill: null, spellbook: null, weaponTemplate: null, enchantment: null, gearSet: null, gameScene: null, quest: null, dialogue: null };
function requirement(type: string, spans: CatalogRequirementSpan[]): CatalogRequirement {
  const label = spans.map((span) => "text" in span ? span.text : span.endpoint.label ?? "").join("");
  return { type: { value: 0, name: type }, rule: { value: 0, name: "Mandatory" }, label, spans, references: emptyReferences, knowledge: null, state: null, comparison: null, value: null, ownership: null, itemCondition: null, progression: null, entity: null, pointType: null, dialogueNodeState: null, effectCondition: null, amountType: null, timeType: null, timeValue: null, effectType: null, questState: null, amounts: { primary: 0, secondary: 0, float: 0, isPercent: false }, flags: { consume: false, first: false, second: false, third: false }, subtypes: { effectTag: null, factionStance: null, itemType: null, weaponType: null, weaponSlot: null, armorType: null, armorSlot: null, gender: null, npcFamily: null, region: null }, dialogueNode: null, times: [null, null] };
}
const condition = (conditionId: string, type: string, spans: CatalogRequirementSpan[]) => ({ conditionId, semantics: "inline-requirements", scope: null, label: "", requirements: [{ mode: "all" as const, checkCount: false, requiredCount: null, requirements: [requirement(type, spans)] }] });

const classDetails = (autoAttack: string | null): ProgressionClass => ({ autoAttackAbility: autoAttack ? ref(autoAttack, "Auto attack") : null, levelTemplate: ref("levels:0", "ClassLevels"), stats: [], customStats: [], statListTemplate: null, skillBonuses: [], startItems: [{ item: ref("items:1", "Potion"), count: 2, equipped: false }], actionAbilities: [], allocationStatPoints: 0, allocatedStats: [] });
const skillDetails = (maxLevel: number): ProgressionSkill => ({ automaticallyAdded: maxLevel > 0, maxLevel, levelTemplate: ref("levels:3", "GatheringSkillProgression"), stats: [], customStats: [], statListTemplate: null, startItems: [], actionAbilities: [] });
const abilityDetails = (conditionId: string | null): ProgressionAbility => ({ abilityType: named(0, "Normal"), learnedByDefault: false, requiresRangedWeapon: false, ranks: [{ rank: 0, unlockCost: 0, activationType: named(0, "Instant"), castTime: 0, channelTime: 0, cooldown: 0, usesGlobalCooldown: true, minRange: 0, maxRange: 0, targetType: named(0, "Self"), areaRadius: 0, coneDegree: 0, coneRange: 0, projectileCount: 0, maxUnitsHit: 0, conditionId, effectsApplied: [], casterEffectsApplied: [] }] });
const bonusRank = (rank: number, amount: number) => ({ rank, unlockCost: 1, isEmpty: false, emptyTooltip: null, conditionId: null, statEffects: [{ stat: ref("stats:125", "Block chance"), amount, isPercent: false }], petStatEffects: [] });
const progressionFacts: CatalogProgressionFact[] = [
  { entityKey: "classes:0", name: "Shieldmaster", kind: "classes", details: classDetails("abilities:2") },
  { entityKey: "classes:5", name: "Assassin", kind: "classes", details: classDetails(null) },
  { entityKey: "classes:6", name: "Hunter", kind: "classes", details: classDetails(null) },
  { entityKey: "races:1", name: "Dwarf", kind: "races", details: { offeredClasses: [ref("classes:0", "Shieldmaster"), ref("classes:5", "Assassin")] } },
  { entityKey: "levels:0", name: null, kind: "levels", details: { levels: 3, baseExperience: 20, increaseAmount: 0, rows: [{ level: 1, name: null, experienceRequired: 20 }, { level: 2, name: null, experienceRequired: 40 }, { level: 3, name: null, experienceRequired: 50 }] } },
  { entityKey: "levels:3", name: null, kind: "levels", details: { levels: 3, baseExperience: 4, increaseAmount: 0, rows: [4, 8, 12].map((experienceRequired, index) => ({ level: 0, name: `Point ${index + 1}`, experienceRequired })) } },
  { entityKey: "treePoints:0", name: "Talent Points", kind: "treePoints", details: { startAmount: 1, maxPoints: 180, gainRules: [{ trigger: named(0, "characterLevelUp"), amount: 3, class: null, skill: null, item: null, itemCount: 0, npc: null, weaponTemplateId: null }] } },
  { entityKey: "talentTrees:0", name: "Bastion Breaker", kind: "talentTrees", details: { tiers: 9, treePoint: ref("treePoints:0", "Talent Points") } },
  { entityKey: "talentTrees:23", name: "Heroic Ascension", kind: "talentTrees", details: { tiers: 4, treePoint: null } },
  { entityKey: "talentTrees:27", name: "Heroic Ascension", kind: "talentTrees", details: { tiers: 4, treePoint: null } },
  { entityKey: "bonuses:288", name: "Weighted Strikes", kind: "bonuses", details: { learnedByDefault: false, ranks: [1, 2, 3, 4, 5].map((rank, index) => bonusRank(index, rank * 2)) } },
  { entityKey: "bonuses:103", name: "Heroic Might", kind: "bonuses", details: { learnedByDefault: false, ranks: [bonusRank(0, 1)] } },
  { entityKey: "bonuses:104", name: "Heroic Resolve", kind: "bonuses", details: { learnedByDefault: false, ranks: [bonusRank(0, 1)] } },
  { entityKey: "skills:0", name: "Alchemy", kind: "skills", details: skillDetails(2) },
  { entityKey: "skills:3", name: "Axes", kind: "skills", details: skillDetails(3) },
  { entityKey: "skills:11", name: "Savers", kind: "skills", details: skillDetails(0) },
  { entityKey: "abilities:0", name: "Cleave", kind: "abilities", details: abilityDetails(null) },
  { entityKey: "abilities:1", name: "Barbed Quarrel", kind: "abilities", details: abilityDetails("cost") },
  { entityKey: "abilities:2", name: "Auto attack", kind: "abilities", details: abilityDetails(null) },
];
const node = (tree: string, nodeIndex: number, nodeType: string, target: string, label: string, tier: number, row: number, conditionId: string | null = null) => ({ tree, nodeIndex, nodeType, target: ref(target, label), tier, row, conditionId });
const lines = [{ spans: [{ text: "Hits", tone: null, italic: false }] }];
// The recorded crafting rule and the weapon skill mapping, which recipe and skill pages read.
const craftingRule = (ruleId: string, operands: Record<string, number>, links: Array<{ entityKey: string; label: string }> = []): CatalogMechanicsRule => ({
  ruleId, topic: "crafting-and-gathering", section: "crafting", ordinal: 0, status: "verified", phrase: "Rule.", operands, links, placements: [],
  sources: [{ method: "CraftingDifficulty.GetScaledExperience", description: "Bounded decompilation", object: { sha256: "a".repeat(64), bytes: 1 } }],
});
const craftingRules: CatalogMechanicsRule[] = [
  craftingRule("recipe-rank-gate", { minimumRequiredLevel: 1 }), craftingRule("recipe-experience-bands", { secondFullFromLevels: 10, halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 }),
  craftingRule("recipe-experience-rounding", {}), craftingRule("weapon-skill-hit", { hitExperience: 2 }), craftingRule("weapon-skills", {}, [{ entityKey: "skills:11", label: "Axes" }]),
];
const facts: CatalogFacts = {
  entities, items: [], npcs: [], quests: [], tasks: [], places: [], properties: [], gearSets: [], gatheringNodes: [],
  abilities: ["abilities:0", "abilities:1", "abilities:2"].map((entityKey) => ({ entityKey, ranks: [{ rankIndex: 0, lines }] })),
  recipes: [{ entityKey: "recipes:81", skill: ref("skills:0", "Alchemy"), station: null, learnedByDefault: true, ranks: [] }],
  progression: {
    facts: progressionFacts,
    links: [
      { owner: "classes:0", linkIndex: 0, linkKind: "talentTree", target: ref("talentTrees:0", "Bastion Breaker") },
      { owner: "classes:0", linkIndex: 1, linkKind: "talentTree", target: ref("talentTrees:23", "Heroic Ascension") },
      { owner: "classes:5", linkIndex: 0, linkKind: "talentTree", target: ref("talentTrees:27", "Heroic Ascension") },
    ],
    talentNodes: [
      node("talentTrees:0", 0, "ability", "abilities:0", "Cleave", 1, 2),
      node("talentTrees:0", 2, "bonus", "bonuses:104", "Heroic Resolve", 3, 1, "needs-strikes"),
      node("talentTrees:0", 1, "bonus", "bonuses:288", "Weighted Strikes", 2, 1),
      node("talentTrees:23", 0, "bonus", "bonuses:103", "Heroic Might", 1, 1),
      node("talentTrees:27", 0, "bonus", "bonuses:103", "Heroic Might", 1, 1),
      node("talentTrees:27", 1, "bonus", "bonuses:104", "Heroic Resolve", 2, 1, "needs-might"),
    ],
    spellbookNodes: [],
    learners: [
      { ability: "abilities:0", owner: ref("classes:0", "Shieldmaster"), via: "talentTree", source: ref("talentTrees:0", "Bastion Breaker"), level: null, tier: 1, row: 2 },
      { ability: "abilities:1", owner: ref("classes:6", "Hunter"), via: "talentTree", source: ref("talentTrees:40", "Trailcraft"), level: null, tier: 1, row: 1 },
      { ability: "abilities:2", owner: ref("classes:0", "Shieldmaster"), via: "autoAttack", source: null, level: null, tier: null, row: null },
    ],
    unlocks: [], appliers: [], offeredClasses: ["classes:0", "classes:5"], mechanicsRules: craftingRules,
  },
};
const relations: CatalogRelations = {
  drops: [], vendors: [], gathers: [], containers: [], interactions: [], quests: [], placements: [], transitions: [], gatedSources: [],
  recipes: [{ recipe: ref("recipes:81", "Elixir"), item: ref("items:1", "Potion"), role: "product", count: 1, chance: 100, rank: 0 }],
  conditions: [
    condition("needs-strikes", "Bonus", [{ endpoint: ref("bonuses:288", "Weighted Strikes") }, { text: " rank 4 or higher" }]),
    condition("needs-might", "Bonus", [{ endpoint: ref("bonuses:103", "Heroic Might") }, { text: " learned" }]),
    condition("cost", "StatCost", [{ text: "costs 9 " }, { endpoint: ref("stats:121", "Mana") }]),
  ],
};

function project() {
  const references = buildEntityReferences(entities, { facts, relations });
  const documents = projectPublicDocuments({ entities, facts, relations, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map(), npcLevels: new Map(), placementIdsByKey: new Map(), classWeapons: new Map([["classes:0", ["Shield"]]]) });
  return { refs: references.refs, documents };
}

test("only classes that a race offers get a page", () => {
  const { refs, documents } = project();
  expect(refs.get("classes:0")?.slug).toBe("shieldmaster");
  expect(refs.get("classes:6")?.slug).toBeUndefined();
  expect(documents.has("classes:6")).toBe(false);
});

test("a class page shows its trees in order, talent ranks, requirements, and progression", () => {
  const shieldmaster = project().documents.get("classes:0") as PublicClass;
  expect(shieldmaster.facts).toEqual({ races: ["Dwarf"], weapons: ["Shield"], autoAttack: { key: "abilities:2", kind: "abilities", name: "Auto Attack", slug: "auto-attack" }, talentPoints: [{ name: "Talent Points", start: 1, max: 180, gains: [{ trigger: "characterLevelUp", amount: 3 }] }], highestLevel: 3 });
  const [breaker, heroic] = shieldmaster.trees;
  expect([breaker?.name, breaker?.points, heroic?.name, heroic?.points]).toEqual(["Bastion Breaker", "Talent Points", "Heroic Ascension", undefined]);
  expect(breaker?.rows.map((row) => [row.tier, row.name, row.anchor])).toEqual([[1, "Cleave", "talent-0-0"], [2, "Weighted Strikes", "talent-0-1"], [3, "Heroic Resolve", "talent-0-2"]]);
  const strikes = breaker!.rows[1]!;
  expect([strikes.ranks, strikes.first?.rank, strikes.first?.stats[0]?.amount, strikes.last?.rank, strikes.last?.stats[0]?.amount]).toEqual([5, 1, 2, 5, 10]);
  expect(breaker!.rows[2]!.requirements[0]?.requirements[0]?.spans[0]).toEqual({ ref: { key: "classes:0", kind: "classes", name: "Weighted Strikes", slug: "shieldmaster", variant: "talent-0-1" } });
  expect(shieldmaster.startingGear).toEqual([{ item: { key: "items:1", kind: "items", name: "Potion", slug: "potion" }, count: 2, equipped: false }]);
  expect("experience" in shieldmaster).toBe(false);
});

test("an item names the offered classes that start with it, and coverage counts them as a source", () => {
  const uncrafted = { ...relations, recipes: [] };
  const references = buildEntityReferences(entities, { facts, relations: uncrafted });
  const documents = projectPublicDocuments({ entities, facts, relations: uncrafted, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map(), npcLevels: new Map(), placementIdsByKey: new Map(), classWeapons: new Map() });
  const potion = documents.get("items:1") as PublicItem;
  // Hunter also starts with the potion, but no race offers Hunter, so it has no page.
  expect(potion.startingGearOf).toEqual([{ class: references.refs.get("classes:0")! }, { class: references.refs.get("classes:5")! }]);
  const withoutSource = (document: PublicItem) => readerCoverage([document]).gaps.some((gap) => gap.gap === "itemWithoutSource");
  expect(withoutSource(potion)).toBe(false);
  expect(withoutSource({ ...potion, startingGearOf: [] })).toBe(true);
});

test("a talent shared by several trees resolves to the row of the class that owns the page", () => {
  const assassin = project().documents.get("classes:5") as PublicClass;
  expect(assassin.trees[0]!.rows[1]!.requirements[0]?.requirements[0]?.spans[0]).toEqual({ ref: { key: "classes:5", kind: "classes", name: "Heroic Might", slug: "assassin", variant: "talent-27-0" } });
});

test("skill pages show recipes, their highest level, and their level curve", () => {
  const { documents } = project();
  const alchemy = documents.get("skills:0") as PublicSkill, axes = documents.get("skills:3") as PublicSkill, savers = documents.get("skills:11") as PublicSkill;
  expect(alchemy.recipes).toEqual([{ recipe: { key: "recipes:81", name: "Elixir" }, anchor: "recipe-elixir",
    product: { key: "items:1", kind: "items", name: "Potion", slug: "potion", variant: "crafting" } }]);
  expect([alchemy.facts.highestLevel, axes.recipes.length, axes.facts.highestLevel]).toEqual([2, 0, 3]);
  expect(savers.facts).toEqual({ automatic: false });
  // Skill templates store level 0 in every row, so a row takes its level from its position. The curve ends at the highest level.
  expect(alchemy.curve).toEqual({ template: "Skill levels", cap: 2, rows: [{ level: 1, toNext: 4 }] });
  expect([axes.curve?.rows.map((row) => row.toNext), savers.curve]).toEqual([[4, 8], undefined]);
});

test("ability pages name the classes that learn them and their use requirements", () => {
  const { documents } = project();
  const cleave = (documents.get("abilities:0") as PublicAbility).versions[0]!, quarrel = (documents.get("abilities:1") as PublicAbility).versions[0]!, auto = (documents.get("abilities:2") as PublicAbility).versions[0]!;
  expect(cleave.learnedBy).toEqual([{ class: { key: "classes:0", kind: "classes", name: "Shieldmaster", slug: "shieldmaster" }, via: "talentTree", tree: "Bastion Breaker", tier: 1, talent: { key: "classes:0", kind: "classes", name: "Shieldmaster", slug: "shieldmaster", variant: "talent-0-0" }, requirements: [] }]);
  expect(quarrel.learnedBy).toEqual([]);
  expect(quarrel.useRequirements[0]?.requirements[0]?.label).toBe("costs 9 Mana");
  expect(auto.learnedBy.map((row) => row.via)).toEqual(["autoAttack"]);
});

test("class and skill lists count trees, abilities, and recipes", () => {
  const { documents, refs } = project();
  const lists = buildKindLists({ buildId: "b", catalogId: "c" }, PUBLIC_KIND_REGISTRY, documents, facts, relations, refs);
  expect(lists.get("classes")?.[0]?.rows.map((row) => [row.ref.name, row.values])).toEqual([["Shieldmaster", { talentTrees: 2, abilities: 2 }], ["Assassin", { talentTrees: 1, abilities: 0 }]]);
  expect(lists.get("recipes")?.[0]?.rows).toEqual([{ ref: { key: "items:1", kind: "items", name: "Elixir", slug: "potion", variant: "crafting" },
    values: { station: null, skill: "Alchemy", product: "Potion" }, facets: { station: [], skill: ["Alchemy"] } }]);
  expect(lists.get("skills")?.[0]?.rows.find((row) => row.ref.name === "Alchemy")?.values).toEqual({ highestLevel: 2, recipes: 1 });
});
