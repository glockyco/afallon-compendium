import type { PublicKindEntry, PublicReferenceKind } from "@afallon/contracts/public";

const column = (id: string, label: string, numeric = false): PublicKindEntry["columns"][number] => ({ id, label, sortable: true, numeric });
const facet = (id: string, label: string, defaultHiddenValues?: string[]): PublicKindEntry["facets"][number] => ({ id, label, ...(defaultHiddenValues ? { defaultHiddenValues } : {}) });

const kindEntries = [
  { kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, list: true, searchable: true,
    // The name colour shows the rarity, so rarity is a filter and not a column. One Type column names what an item is,
    // and the weapon, armor, slot, and type filters keep each of those facts.
    columns: [column("type", "Type"), column("itemPower", "Item power", true), column("levelRequirement", "Level", true)],
    facets: [facet("class", "Usable by"), facet("weapon", "Weapon"), facet("armor", "Armor"), facet("slot", "Slot"), facet("itemType", "Type"), facet("rarity", "Rarity"), facet("material", "Used in crafting")] },
  { kind: "npcs", label: "NPC", plural: "NPCs", route: "npcs", icon: "npc", pages: true, list: true, searchable: true,
    columns: [column("level", "Level", true), column("role", "Role"), column("place", "Place"), column("faction", "Faction")],
    // Class and Party Role filter the adventurers of the world roster.
    facets: [facet("role", "Role"), facet("places", "Place"), facet("faction", "Faction"), facet("class", "Class"), facet("partyRole", "Party role")] },
  { kind: "quests", label: "Quest", plural: "Quests", route: "quests", icon: "quest", pages: true, list: true, searchable: true,
    columns: [column("levelRange", "Quest level"), column("chain", "Chain"),
      column("area", "Area"), column("giver", "Giver")],
    facets: [facet("rewardType", "Reward type"), facet("questType", "Quest type"), facet("startType", "Start type"), facet("area", "Area"), facet("chain", "Chain"), facet("repeatable", "Repeatable")] },
  { kind: "places", label: "Place", plural: "Places", route: "places", icon: "place", pages: true, list: true, searchable: true,
    columns: [column("placeType", "Type"), column("levelRange", "Level range"), column("bosses", "Bosses", true)],
    facets: [facet("placeType", "Type"), facet("guideIncluded", "In the Adventure Guide")] },
  { kind: "properties", label: "Property", plural: "Properties", route: "properties", icon: "property", pages: true, list: true, searchable: true,
    columns: [column("type", "Type"), column("place", "Place"), column("price", "Price", true), column("income", "Income", true)], facets: [facet("type", "Type"), facet("place", "Place")] },
  { kind: "abilities", label: "Ability", plural: "Abilities", route: "abilities", icon: "ability", pages: true, list: true, searchable: true,
    columns: [column("source", "Source")], facets: [facet("sourceKind", "Source", ["No Known Use"]), facet("class", "Class")] },
  { kind: "recipes", label: "Recipe", plural: "Recipes", route: "recipes", icon: "recipe", pages: false, list: true, searchable: false,
    // A recipe row links its product, so the product needs no column of its own.
    columns: [column("station", "Station"), column("skill", "Skill")],
    facets: [facet("station", "Station"), facet("skill", "Skill")] },
  // Only the classes that a race offers have pages. The references of the other classes read as text.
  { kind: "classes", label: "Class", plural: "Classes", route: "classes", icon: "class", pages: true, list: true, searchable: true,
    columns: [column("talentTrees", "Talent trees", true), column("abilities", "Abilities", true)], facets: [] },
  // A skill is a crafting, gathering, or weapon skill, and counts the recipes or gathering nodes that train it.
  { kind: "skills", label: "Skill", plural: "Skills", route: "skills", icon: "skill", pages: true, list: true, searchable: true,
    columns: [column("type", "Type"), column("highestLevel", "Highest level", true), column("recipes", "Recipes", true), column("gatheringNodes", "Gathering nodes", true)], facets: [] },
  // Mechanics topics explain game systems. Their keys belong to the publication, not to game records.
  { kind: "mechanics", label: "Mechanic", plural: "Mechanics", route: "mechanics", icon: "guide", pages: true, list: true, searchable: true, columns: [column("description", "About")], facets: [] },
  // Gathering nodes come from world objects, not from game records. Their keys belong to the catalog.
  { kind: "gatheringNodes", label: "Gathering Node", plural: "Gathering Nodes", route: "gathering-nodes", icon: "gathering-node", pages: true, list: true, searchable: true,
    columns: [column("skill", "Skill"), column("requiredLevel", "Required level", true), column("locations", "Locations", true)], facets: [facet("skill", "Skill")] },
  // Name a last-bonus threshold in the Pieces cell only when it differs from the set's size.
  { kind: "gearSets", label: "Gear Set", plural: "Gear Sets", route: "gear-sets", icon: "gear-set", pages: true, list: true, searchable: true,
    columns: [column("type", "Type"), column("pieces", "Pieces")], facets: [facet("type", "Type")] },
  { kind: "currencies", label: "Currency", plural: "Currencies", route: "currencies", icon: "currency", pages: true, list: true, searchable: true,
    columns: [column("purchases", "Items sold for it", true), column("rewards", "Quest rewards", true)], facets: [] },
  { kind: "stats", label: "Stat", plural: "Stats", route: "stats", icon: "stat", pages: true, list: true, searchable: true,
    defaultSort: { id: "occurrences", dir: "desc" },
    columns: [column("occurrences", "Sources", true), column("category", "Category"), column("items", "Items", true)],
    facets: [facet("proc", "On-hit effect"), facet("category", "Category")] },
  { kind: "factions", label: "Faction", plural: "Factions", route: "factions", icon: "faction", pages: true, list: true, searchable: true,
    columns: [column("members", "NPCs", true)], facets: [] },
  { kind: "races", label: "Race", plural: "Races", route: "races", icon: "race", pages: true, list: true, searchable: true,
    columns: [column("start", "Starting place"), column("classes", "Classes", true), column("adventurers", "Adventurers", true)], facets: [] },
  { kind: "enchantments", label: "Enchantment", plural: "Enchantments", route: "enchantments", icon: "enchantment", pages: false, list: false, searchable: false, columns: [], facets: [] },
  { kind: "effects", label: "Effect", plural: "Effects", route: "effects", icon: "effect", pages: true, list: true, searchable: true,
    columns: [column("type", "Type"), column("appliedBy", "Applied By", true), column("checkedBy", "Checked By", true)],
    facets: [facet("type", "Type")] },
  { kind: "species", label: "Species", plural: "Species", route: "species", icon: "species", pages: false, list: false, searchable: false, columns: [], facets: [] },
  { kind: "lootTables", label: "Loot Table", plural: "Loot Tables", route: "loot-tables", icon: "loot-table", pages: false, list: false, searchable: false, columns: [], facets: [] },
  { kind: "craftingStations", label: "Crafting Station", plural: "Crafting Stations", route: "crafting-stations", icon: "crafting-station", pages: true, list: true, searchable: true,
    columns: [column("skill", "Skill"), column("recipes", "Recipes", true), column("spots", "Map spots", true)], facets: [] },
] as const satisfies readonly PublicKindEntry[];

// A new reference kind must be given presentation metadata, even when it has no page.
const allKindsRegistered: Exclude<PublicReferenceKind, (typeof kindEntries)[number]["kind"]> extends never ? true : never = true;
void allKindsRegistered;
export const PUBLIC_KIND_REGISTRY: readonly PublicKindEntry[] = Object.freeze(kindEntries);

export const PUBLIC_KIND_BY_KIND: Readonly<Record<PublicReferenceKind, PublicKindEntry>> = Object.freeze(
  Object.fromEntries(PUBLIC_KIND_REGISTRY.map((entry) => [entry.kind, entry])) as Record<PublicReferenceKind, PublicKindEntry>,
);

const CATALOG_KIND_ALIASES: Readonly<Record<string, PublicReferenceKind>> = {
  items: "items", npcs: "npcs", quests: "quests", scenes: "places", regions: "places", places: "places", properties: "properties",
  abilities: "abilities", recipes: "recipes", currencies: "currencies", stats: "stats", factions: "factions", skills: "skills",
  classes: "classes", races: "races", enchantments: "enchantments", gearSets: "gearSets", effects: "effects", species: "species",
  lootTables: "lootTables", craftingStations: "craftingStations",
};

export function publicKindForCatalogKind(kind: string): PublicReferenceKind | null {
  return CATALOG_KIND_ALIASES[kind] ?? null;
}
