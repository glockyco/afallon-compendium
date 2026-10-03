import type { CatalogEndpoint, CatalogFacts } from "@afallon/contracts/catalog";
import { categoryLabel, collectRefs } from "@afallon/contracts/public";
import { itemTypeLabel } from "./item-type";
import { resolveCatalogEndpoint } from "./references";
import { levelText } from "./levels";
import { partitionStaticRecords } from "./resources";
import { isPublicPageKind } from "@afallon/contracts/public";
import type {
  ListRow,
  ListStat,
  PublicAbility,
  PublicClass,
  PublicCraftingStation,
  PublicCurrency,
  PublicDocument,
  PublicFaction,
  PublicGearSet,
  PublicStat,
  PublicEffect,
  PublicGatheringNode,
  PublicItem,
  PublicKindEntry,
  PublicNpc,
  PublicListKind,
  PublicPlace,
  PublicProperty,
  PublicQuest,
  PublicRace,
  PublicSkill,
  EntityRef,
  Ref,
  StaticKindList,
} from "@afallon/contracts/public";

function refName(ref: Ref | undefined): string | null {
  if (!ref) return null;
  return ref.key === null ? ref.label : ref.name;
}

function namedRelation(names: readonly string[], places: ReadonlyMap<string, EntityRef>): Ref[] {
  return names.map((name) => places.get(name) ?? { key: null, label: name });
}
function facetValue(value: string | null | undefined): string[] {
  return value ? [value] : [];
}

// Visibility depends on published ways to reach the entity, never on its level, rarity, or a maintained name list.
// Optional recovered fields allow a publication without that evidence to keep its entries behind the reveal.
type ItemSources = PublicItem & {
  startingGearOfAdventurers?: readonly Ref[];
  gainedFromItems?: readonly Ref[];
  lootTables?: readonly { name: string; source?: Ref; world?: boolean }[];
};
type NpcSources = PublicNpc & {
  summonedBy?: readonly Ref[];
  spawnedBy?: readonly { label: string; place: Ref }[];
  recruitedByActions?: readonly { label: string; owner?: Ref }[];
};
type AbilitySources = Omit<PublicAbility, "versions"> & {
  versions: (PublicAbility["versions"][number] & { unlockedByActions?: readonly { label: string; owner?: Ref }[] })[];
};

export function itemHasKnownWay(document: ItemSources): boolean {
  return Boolean(document.sourceSpotCount > 0 || document.droppedBy.length || document.soldBy.length
    || document.buys.length || document.gatheredFrom.length || document.inContainers.length
    || document.collectedFrom.length || document.rewardedBy.length || document.givenBy.length
    || document.crafting || document.startingGearOf.length || document.fromItems.length
    || document.clothDrop || document.questPickups.length || document.dungeonFinder
    || document.facts.dungeonRewards?.length || document.startingGearOfAdventurers?.length || document.gainedFromItems?.length
    || document.lootTables?.some((table) => table.source || table.world));
}

export function npcHasKnownWay(document: NpcSources, referencedByOtherPage: ReadonlySet<string>): boolean {
  return Boolean(document.locations.length || document.adventurer || document.summonedBy?.length
    || document.spawnedBy?.length || document.recruitedByActions?.length || referencedByOtherPage.has(document.ref.key));
}

export function abilityHasKnownWay(document: AbilitySources): boolean {
  return document.versions.some((version) => Boolean(version.learnedBy.length || version.usedBy.length
    || version.usedByItems.length || version.unlockedByActions?.length));
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
    values: { rarity: facts.rarity ?? null, type: itemTypeLabel(facts), itemPower: facts.itemPower ?? null,
      levelRequirement: facts.levelRequirement ?? null,
      damage: facts.weaponType && facts.minDamage !== undefined && facts.maxDamage !== undefined
        ? `${facts.minDamage}–${facts.maxDamage}` : null },
    facets: { class: usableBy, weapon: facetValue(facts.weaponType), armor: facetValue(facts.armorType), slot: facetValue(slot), itemType: facetValue(facts.itemType), rarity: facetValue(facts.rarity),
      material: [String(document.usedInRecipes.length > 0)], knownWay: [itemHasKnownWay(document) ? "known" : "unknown"] },
    ...(stats.length ? { stats } : {}),
  };
}

function npcRow(document: PublicNpc, placesByName: ReadonlyMap<string, EntityRef>, referencedByOtherPage: ReadonlySet<string>): ListRow {
  const level = document.adventurer ? String(document.adventurer.startingLevel) : document.facts.level ? levelText(document.facts.level) : null;
  // The cell reads as text, so a Level filter needs the numbers behind it.
  const levelRange = document.adventurer ? { min: document.adventurer.startingLevel, max: document.adventurer.startingLevel }
    : document.facts.level ? { min: document.facts.level.min, ...(document.facts.level.max === undefined ? {} : { max: document.facts.level.max }) } : null;
  const places = new Set(document.locations.map((location) => location.label));
  const place = places.size === 1 ? places.values().next().value! : places.size > 1 ? `${places.size} places` : null;
  const faction = refName(document.facts.faction);
  const className = document.adventurer ? refName(document.adventurer.class) : null;
  const roles: string[] = document.facts.roles.includes("boss") ? document.facts.roles.filter((role) => role !== "enemy") : [...document.facts.roles];
  if (document.adventurer) roles.push("Adventurer", document.adventurer.role);
  return { ref: document.ref,
    values: { level, role: roles.join(", ") || null, place, faction, class: className, partyRole: document.adventurer?.role ?? null },
    // The column names one place or counts them. The filter offers each place, so an NPC in several places matches each.
    facets: { role: roles, places: [...places].sort(), faction: facetValue(faction), class: facetValue(className),
      partyRole: document.adventurer ? [document.adventurer.role] : [],
      knownWay: [npcHasKnownWay(document, referencedByOtherPage) ? "known" : "unknown"] },
    relations: { ...(place && places.size === 1 ? { place: namedRelation([place], placesByName) } : {}),
      ...(document.facts.faction ? { faction: [document.facts.faction] } : {}),
      ...(document.adventurer ? { class: [document.adventurer.class] } : {}) },
    ...(levelRange ? { ranges: { level: levelRange } } : {}) };
}

function questRow(document: PublicQuest, rewardTypes: readonly string[], placesByName: ReadonlyMap<string, EntityRef>): ListRow {
  const starts = document.starts;
  const types = [...new Set(starts.map((start) => start.kind))];
  const areas = [...new Set(starts.flatMap((start) => start.kind === "npc" ? start.areas : start.placements.map((placement) => placement.label)))].sort();
  const giver = starts.find((start) => start.kind === "npc");
  const range = document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null;
  return { ref: document.ref,
    values: { levelRange: range, chain: document.facts.chain?.name ?? null, area: areas.join(", ") || null,
      giver: giver?.kind === "npc" ? refName(giver.npc) : null },
    facets: { questType: [document.facts.worldQuest ? "World Quest" : "Other quest"], startType: types, area: areas, chain: facetValue(document.facts.chain?.name), repeatable: [String(document.facts.repeatable)], rewardType: [...rewardTypes] },
    relations: { ...(areas.length ? { area: namedRelation(areas, placesByName) } : {}),
      ...(giver?.kind === "npc" ? { giver: [giver.npc] } : {}) } };
}

function placeRow(document: PublicPlace): ListRow {
  const range = document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null;
  return { ref: document.ref, values: { placeType: document.facts.placeType, levelRange: range,
    creatures: document.creatures.length || null, quests: document.quests.length || null,
    bosses: document.facts.placeType === "dungeon" || document.bosses.length ? document.bosses.length : null },
    facets: { placeType: [document.facts.placeType], guideIncluded: [String(document.facts.guideIncluded)] } };
}

function propertyRow(document: PublicProperty): ListRow {
  const place = refName(document.place), type = document.facts.propertyType ?? null;
  const price = document.facts.price, income = document.facts.income;
  return { ref: document.ref, ...(document.art.artwork ? { artwork: document.art.artwork } : {}),
    values: { type, place, price: price?.amount ?? null, income: income?.amount ?? null, incomeInterval: document.facts.incomeInterval ?? null },
    facets: { type: facetValue(type), place: facetValue(place) },
    relations: { ...(document.place ? { place: [document.place] } : {}),
      ...(price ? { priceCurrency: [price.currency] } : {}),
      ...(income ? { incomeCurrency: [income.currency] } : {}) } };
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
  const actions = (document as AbilitySources).versions.flatMap((version) => version.unlockedByActions ?? []);
  const interactionNames = [...new Set(actions.map((action) => refName(action.owner) ?? action.label))].sort();
  const sourceKind = classes.length ? "Class" : creatures.length ? "Creature" : items.length ? "Item" : actions.length ? "Interaction" : null;
  const source = classes.length > 2 ? `${classes.length} classes` : classes.length ? classSources.join(", ")
    : creatures.length > 2 ? `${creatures.length} creatures` : creatures.length ? creatures.join(", ")
      : items.length ? items.join(", ") : interactionNames.join(", ") || null;
  const shownNames = classes.length ? classes : creatures.length ? creatures : items;
  const sourceRefs = classes.length ? learners.map((learner) => learner.class)
    : creatures.length ? document.versions.flatMap((version) => version.usedBy)
      : document.versions.flatMap((version) => version.usedByItems);
  const linked = shownNames.length <= 2 ? shownNames.map((name) => sourceRefs.find((ref) => refName(ref) === name)!) : [];
  const stats = [...new Map(document.versions.flatMap((version) => version.scalesWith)
    .map((stat) => [stat.key, stat] as const))].map(([, stat]) => stat)
    .sort((a, b) => (refName(a) ?? '').localeCompare(refName(b) ?? ''));
  return { ref: document.ref, values: { source, scalesWith: stats.map(refName).join(", ") || null },
    facets: { sourceKind: sourceKind ? [sourceKind] : [], class: classes, scalesWith: stats.flatMap((stat) => refName(stat) ? [refName(stat)!] : []), knownWay: [abilityHasKnownWay(document) ? "known" : "unknown"] },
    relations: { ...(linked.length ? { source: linked } : {}), ...(stats.length ? { scalesWith: stats } : {}) },
    ...(linked.length && classes.length ? { relationSuffixes: { source: classSources.map((value, index) => value.slice(classes[index]!.length)) } } : {}) };
}

function recipeRow(ref: EntityRef, station: Ref | undefined, skill: Ref | undefined): ListRow {
  const stationName = refName(station), skillName = refName(skill);
  return { ref, values: { station: stationName, skill: skillName },
    facets: { station: facetValue(stationName), skill: facetValue(skillName) },
    relations: { ...(station ? { station: [station] } : {}), ...(skill ? { skill: [skill] } : {}) } };
}

function isClass(document: PublicDocument): document is PublicClass { return document.ref.kind === "classes"; }
function isSkill(document: PublicDocument): document is PublicSkill { return document.ref.kind === "skills"; }

function classRow(document: PublicClass): ListRow {
  const abilities = document.trees.reduce((sum, tree) => sum + tree.rows.filter((row) => row.ability !== undefined).length, document.facts.autoAttack ? 1 : 0);
  return { ref: document.ref, values: { talentTrees: document.trees.length, abilities, description: document.description ?? null }, facets: {} };
}

// A skill's experience sources say what kind of skill it is. A count that does not apply to the skill stays blank.
function skillRow(document: PublicSkill): ListRow {
  const { experience } = document;
  const type = experience.crafting ? "Crafting" : experience.gathering ? "Gathering" : experience.autoAttack ? "Weapon" : null;
  return { ref: document.ref, values: { type, highestLevel: document.facts.highestLevel ?? null,
    recipes: document.recipes.length || null, gatheringNodes: document.gatheringNodes.length || null, automatic: document.facts.automatic ? "Starts learned" : null }, facets: {} };
}

function gatheringNodeRow(document: PublicGatheringNode): ListRow {
  const skill = refName(document.facts.skill);
  const locations = [...document.spawners, ...document.placed].reduce((sum, group) => sum + group.placementCount, 0);
  return { ref: document.ref, values: { skill, requiredLevel: document.facts.requiredLevel ?? null, locations }, facets: { skill: facetValue(skill) },
    ...(document.facts.skill ? { relations: { skill: [document.facts.skill] } } : {}) };
}

function gearSetRow(document: PublicGearSet): ListRow {
  const pieces = document.pieces.length;
  const lastBonus = document.tiers.length ? Math.max(...document.tiers.map((tier) => tier.equipped)) : undefined;
  return { ref: document.ref,
    values: { type: document.type ?? null, pieces, lastBonus: lastBonus === undefined || lastBonus === pieces ? null : lastBonus },
    facets: { type: facetValue(document.type) } };
}

function currencyRow(document: PublicCurrency): ListRow {
  return { ref: document.ref, values: { purchases: document.purchases.length || null, rewards: document.rewards.length || null }, facets: {} };
}

function craftingStationRow(document: PublicCraftingStation): ListRow {
  const spots = document.places.reduce((sum, place) => sum + place.spotCount, 0);
  return { ref: document.ref, values: { skill: document.skills.map(refName).join(", ") || null, recipes: document.recipes.length || null, spots: spots || null }, facets: {},
    ...(document.skills.length ? { relations: { skill: document.skills } } : {}) };
}

function raceRow(document: PublicRace): ListRow {
  return { ref: document.ref, values: { start: refName(document.start), classes: document.classes.length || null, adventurers: document.adventurers.length || null }, facets: {},
    ...(document.start ? { relations: { start: [document.start] } } : {}) };
}

function factionRow(document: PublicFaction): ListRow {
  return { ref: document.ref, values: { members: document.members, startingStance: document.newCharacter?.stance ?? null, shownInReputation: document.shownInReputation ? "Reputation" : null }, facets: {} };
}

function statRow(document: PublicStat): ListRow {
  const sources = document.sources;
  const items = new Set([...sources.fixedItems, ...sources.randomItems].flatMap((ref) => ref.key ? [ref.key] : []));
  return { ref: document.ref, values: {
    category: document.category ?? "Uncategorized", unit: document.unit === "percent" ? "Percent" : "Flat",
    items: items.size || null,
    otherSources: sources.sets.length + sources.talents.length + sources.effects.length + sources.classes.length + sources.enchantments.length || null,
    occurrences: items.size + sources.gems.length + sources.sets.length + sources.talents.length + sources.effects.length + sources.classes.length + sources.enchantments.length || null,
  }, facets: { category: [document.category ?? "Uncategorized"], proc: [document.onHit.length ? "On-hit trigger" : "Other stats"] } };
}

function effectRow(document: PublicEffect): ListRow {
  return { ref: document.ref, values: {
    type: document.type, appliedBy: document.appliedBy.length + document.worldSources.reduce((sum, row) => sum + row.sourceCount, 0) || null,
    checkedBy: document.checkedBy.length || null,
  }, facets: { type: [document.type] } };
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
  const placesByName = new Map([...documents.values()].filter((entry): entry is PublicPlace => entry.ref.kind === "places").map((entry) => [entry.ref.name, entry.ref]));
  // References elsewhere in the publication give otherwise unplaced NPCs a discoverable context.
  // Ignore a document's subject ref so the NPC does not qualify solely by publishing its own page.
  const referencedNpcs = new Set<string>();
  for (const document of documents.values()) {
    for (const ref of collectRefs(document)) {
      if (ref.kind === "npcs" && ref.key !== document.ref.key) referencedNpcs.add(ref.key);
    }
  }
  for (const document of documents.values()) {
    let row: ListRow;
    switch (document.ref.kind) {
      case "items": row = itemRow(document as PublicItem, classes); break;
      case "npcs": row = npcRow(document as PublicNpc, placesByName, referencedNpcs); break;
      case "quests": row = questRow(document as PublicQuest, questRewardTypes.get(document.ref.key) ?? [], placesByName); break;
      case "places": row = placeRow(document as PublicPlace); break;
      case "properties": row = propertyRow(document as PublicProperty); break;
      case "abilities": row = abilityRow(document as PublicAbility); break;
      case "classes": if (!isClass(document)) continue; row = classRow(document); break;
      case "skills": if (!isSkill(document)) continue; row = skillRow(document); break;
      case "mechanics": row = { ref: document.ref, values: { description: document.description }, facets: {} }; break;
      case "gatheringNodes": row = gatheringNodeRow(document as PublicGatheringNode); break;
      case "gearSets": row = gearSetRow(document as PublicGearSet); break;
      case "currencies": row = currencyRow(document as PublicCurrency); break;
      case "craftingStations": row = craftingStationRow(document as PublicCraftingStation); break;
      case "races": row = raceRow(document as PublicRace); break;
      case "factions": row = factionRow(document as PublicFaction); break;
      case "stats": row = statRow(document as PublicStat); break;
      case "effects": row = effectRow(document as PublicEffect); break;
      default: {
        if (isPublicPageKind(document.ref.kind)) {
          const unhandled: never = document.ref.kind;
          throw new Error(`No list projection for ${unhandled}`);
        }
        continue;
      }
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
      schemaVersion: "compendium.static-kind-list.v8", ...identity, kind, part, rows,
    })));
  }
  return result;
}
