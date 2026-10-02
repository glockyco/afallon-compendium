import type { CatalogEndpoint, CatalogFacts } from "@afallon/contracts/catalog";
import { categoryLabel } from "@afallon/contracts/public";
import { resolveCatalogEndpoint } from "./references";
import { levelText } from "./levels";
import { partitionStaticRecords } from "./resources";
import type {
  ListRow,
  ListStat,
  PublicAbility,
  PublicClass,
  PublicDocument,
  PublicGatheringNode,
  PublicItem,
  PublicKindEntry,
  PublicNpc,
  PublicListKind,
  PublicPlace,
  PublicProperty,
  PublicQuest,
  PublicSkill,
  EntityRef,
  Ref,
  StaticKindList,
} from "@afallon/contracts/public";

function refName(ref: Ref | undefined): string | null {
  if (!ref) return null;
  return ref.key === null ? ref.label : ref.name;
}

function facetValue(value: string | null | undefined): string[] {
  return value ? [value] : [];
}

/**
 * What an item is, from its most specific facts: the weapon type, the slot of jewelry, the armor type with its slot, or
 * the item type. A weapon type already names its hands, so the slot is left out.
 */
function itemTypeLabel(facts: PublicItem["facts"]): string | null {
  if (facts.weaponType) return categoryLabel(facts.weaponType);
  if (facts.armorType && facts.slot) return facts.armorType === "JEWELRY" ? categoryLabel(facts.slot) : `${categoryLabel(facts.armorType)} ${categoryLabel(facts.slot)}`;
  return facts.itemType ? categoryLabel(facts.itemType) : null;
}

function itemRow(document: PublicItem, classes: readonly PublicClass[]): ListRow {
  const facts = document.facts;
  const slot = facts.slot ?? facts.weaponSlot;
  // A weapon fits the classes whose weapon types include its type. The game sets no class rule for any other item.
  const weaponType = facts.weaponType === undefined ? undefined : categoryLabel(facts.weaponType);
  const usableBy = classes.filter((entry) => weaponType === undefined || entry.facts.weapons.includes(weaponType)).map((entry) => entry.ref.name).sort();
  // Class lists and items share weapon type names, not ids, so a renamed type would leave its weapons without a class.
  if (weaponType !== undefined && classes.length > 0 && usableBy.length === 0) throw new Error(`No offered class can use the weapon type ${weaponType} of ${document.ref.key}.`);
  const stats: ListStat[] = [
    ...facts.stats.flatMap((row) => { const name = refName(row.stat); return name ? [{ name, percent: row.isPercent, min: row.amount, max: row.amount }] : []; }),
    ...facts.randomStats.flatMap((row) => { const name = refName(row.stat); return name ? [{ name, percent: row.isPercent, min: row.min, max: row.max }] : []; }),
  ];
  return {
    ref: document.ref,
    // `rarity` colours the name.
    values: { rarity: facts.rarity ?? null, type: itemTypeLabel(facts), itemPower: facts.itemPower ?? null, levelRequirement: facts.levelRequirement ?? null },
    facets: { class: usableBy, weapon: facetValue(facts.weaponType), armor: facetValue(facts.armorType), slot: facetValue(slot), itemType: facetValue(facts.itemType), rarity: facetValue(facts.rarity),
      material: [String(document.usedInRecipes.length > 0)] },
    ...(stats.length ? { stats } : {}),
  };
}

function npcRow(document: PublicNpc): ListRow {
  const level = document.facts.level ? levelText(document.facts.level) : null;
  const places = new Set(document.locations.map((location) => location.label));
  const place = places.size === 1 ? places.values().next().value! : places.size > 1 ? `${places.size} places` : null;
  const faction = refName(document.facts.faction);
  return { ref: document.ref, values: { level, role: document.facts.roles.join(", ") || null, place, faction },
    // The column names one place or counts them. The filter offers each place, so an NPC in several places matches each.
    facets: { role: document.facts.roles, places: [...places].sort(), faction: facetValue(faction) } };
}

function questRow(document: PublicQuest, rewardTypes: readonly string[]): ListRow {
  const starts = document.starts;
  const types = [...new Set(starts.map((start) => start.kind))];
  const areas = [...new Set(starts.flatMap((start) => start.kind === "npc" ? start.areas : start.placements.map((placement) => placement.label)))].sort();
  const giver = starts.find((start) => start.kind === "npc");
  const range = document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null;
  return { ref: document.ref,
    values: { levelRange: range, chain: document.facts.chain?.name ?? null, area: areas.join(", ") || null,
      giver: giver?.kind === "npc" ? refName(giver.npc) : null },
    facets: { startType: types, area: areas, chain: facetValue(document.facts.chain?.name), repeatable: [String(document.facts.repeatable)], rewardType: [...rewardTypes] } };
}

function placeRow(document: PublicPlace): ListRow {
  const range = document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null;
  return { ref: document.ref, values: { placeType: document.facts.placeType, levelRange: range, bosses: document.bosses.length },
    facets: { placeType: [document.facts.placeType], guideIncluded: [String(document.facts.guideIncluded)] } };
}

function propertyRow(document: PublicProperty): ListRow {
  const place = refName(document.place), type = document.facts.propertyType ?? null;
  return { ref: document.ref, values: { type, place, price: document.facts.price?.amount ?? null, income: document.facts.income?.amount ?? null },
    facets: { type: facetValue(type), place: facetValue(place) } };
}

function abilityRow(document: PublicAbility): ListRow {
  const learners = document.versions.flatMap((version) => version.learnedBy);
  const classes = [...new Set(learners.map((learner) => refName(learner.class)).filter((name): name is string => name !== null))].sort();
  // A class that grants its auto attack through a tree is still one source, not two comma-separated entries.
  const classSources = classes.map((name) => {
    const trees = [...new Set(learners.filter((learner) => refName(learner.class) === name).map((learner) => learner.tree).filter((tree): tree is string => Boolean(tree)))].sort();
    return [name, ...trees].join(" · ");
  });
  const creatures = [...new Set(document.versions.flatMap((version) => version.usedBy).map((ref) => refName(ref)).filter((name): name is string => name !== null))].sort();
  const items = [...new Set(document.versions.flatMap((version) => version.usedByItems).map((ref) => refName(ref)).filter((name): name is string => name !== null))].sort();
  const sourceKind = classes.length ? "Class" : creatures.length ? "Creature" : items.length ? "Item" : "No Known Use";
  const source = classes.length > 2 ? `${classes.length} classes` : classes.length ? classSources.join(", ") : creatures.length > 2 ? `${creatures.length} creatures` : creatures.length ? creatures.join(", ") : items.join(", ") || "No Known Use";
  return { ref: document.ref, values: { source }, facets: { sourceKind: [sourceKind], class: classes } };
}

function recipeRow(ref: EntityRef, station: Ref | undefined, skill: Ref | undefined): ListRow {
  const stationName = refName(station), skillName = refName(skill);
  return { ref, values: { station: stationName, skill: skillName },
    facets: { station: facetValue(stationName), skill: facetValue(skillName) } };
}

function isClass(document: PublicDocument): document is PublicClass { return document.ref.kind === "classes"; }
function isSkill(document: PublicDocument): document is PublicSkill { return document.ref.kind === "skills"; }

function classRow(document: PublicClass): ListRow {
  const abilities = document.trees.reduce((sum, tree) => sum + tree.rows.filter((row) => row.ability !== undefined).length, document.facts.autoAttack ? 1 : 0);
  return { ref: document.ref, values: { talentTrees: document.trees.length, abilities }, facets: {} };
}

function skillRow(document: PublicSkill): ListRow {
  return { ref: document.ref, values: { highestLevel: document.facts.highestLevel ?? null, recipes: document.recipes.length }, facets: {} };
}

function gatheringNodeRow(document: PublicGatheringNode): ListRow {
  const skill = refName(document.facts.skill);
  const locations = [...document.spawners, ...document.placed].reduce((sum, group) => sum + group.placementCount, 0);
  return { ref: document.ref, values: { skill, requiredLevel: document.facts.requiredLevel ?? null, locations }, facets: { skill: facetValue(skill) } };
}

export function buildKindLists(
  identity: { buildId: string; catalogId: string },
  registry: readonly PublicKindEntry[],
  documents: ReadonlyMap<string, PublicDocument>,
  facts?: CatalogFacts,
  refs?: ReadonlyMap<string, EntityRef>,
  excluded?: ReadonlySet<string>,
  questRewardTypes: ReadonlyMap<string, readonly string[]> = new Map(),
): ReadonlyMap<string, StaticKindList[]> {
  const rowsByKind = new Map<string, ListRow[]>();
  const classes = [...documents.values()].filter(isClass);
  for (const document of documents.values()) {
    let row: ListRow;
    switch (document.ref.kind) {
      case "items": row = itemRow(document as PublicItem, classes); break;
      case "npcs": row = npcRow(document as PublicNpc); break;
      case "quests": row = questRow(document as PublicQuest, questRewardTypes.get(document.ref.key) ?? []); break;
      case "places": row = placeRow(document as PublicPlace); break;
      case "properties": row = propertyRow(document as PublicProperty); break;
      case "abilities": row = abilityRow(document as PublicAbility); break;
      case "classes": if (!isClass(document)) continue; row = classRow(document); break;
      case "skills": if (!isSkill(document)) continue; row = skillRow(document); break;
      case "mechanics": row = { ref: document.ref, values: {}, facets: {} }; break;
      case "gatheringNodes": row = gatheringNodeRow(document as PublicGatheringNode); break;
      default: continue;
    }
    const rows = rowsByKind.get(document.ref.kind) ?? [];
    rows.push(row);
    rowsByKind.set(document.ref.kind, rows);
  }
  if (facts && refs) {
    for (const recipe of facts.recipes) {
      if (excluded?.has(recipe.entityKey)) continue;
      const ref = refs.get(recipe.entityKey);
      if (!ref) continue;
      const endpointRef = (endpoint: CatalogEndpoint | null) => endpoint ? resolveCatalogEndpoint(refs, endpoint) : undefined;
      const row = recipeRow(ref, endpointRef(recipe.station), endpointRef(recipe.skill));
      const rows = rowsByKind.get("recipes") ?? [];
      rows.push(row);
      rowsByKind.set("recipes", rows);
    }
  }
  const result = new Map<string, StaticKindList[]>();
  for (const entry of registry) {
    if (!entry.list) continue;
    const kind = entry.kind as PublicListKind;
    result.set(kind, partitionStaticRecords(rowsByKind.get(kind) ?? [], (rows, part): StaticKindList => ({
      schemaVersion: "compendium.static-kind-list.v6", ...identity, kind, part, rows,
    })));
  }
  return result;
}
