import type { PublicKindEntry, PublicReferenceKind } from "@afallon/contracts/public";

const column = (id: string, label: string, numeric = false): PublicKindEntry["columns"][number] => ({ id, label, sortable: true, numeric });
const facet = (id: string, label: string): PublicKindEntry["facets"][number] => ({ id, label });

export const PUBLIC_KIND_REGISTRY: readonly PublicKindEntry[] = Object.freeze([
  { kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, searchable: true,
    columns: [column("rarity", "Rarity"), column("itemType", "Type"), column("slot", "Slot"), column("itemPower", "Item power", true),
      column("damagePerSecond", "Damage per second", true), column("levelRequirement", "Level", true), column("sellPrice", "Sell price", true)],
    facets: [facet("slot", "Slot"), facet("itemType", "Type"), facet("rarity", "Rarity"), facet("sourceKind", "Source")] },
  { kind: "npcs", label: "NPC", plural: "NPCs", route: "npcs", icon: "npc", pages: true, searchable: true,
    columns: [column("level", "Level", true), column("role", "Role"), column("place", "Place"), column("faction", "Faction")],
    facets: [facet("role", "Role"), facet("place", "Place"), facet("faction", "Faction")] },
  { kind: "quests", label: "Quest", plural: "Quests", route: "quests", icon: "quest", pages: true, searchable: true,
    columns: [column("chain", "Chain"), column("levelRequirement", "Level", true), column("giver", "Giver")],
    facets: [facet("chain", "Chain"), facet("repeatable", "Repeatable"), facet("giverPlace", "Giver place")] },
  { kind: "places", label: "Place", plural: "Places", route: "places", icon: "place", pages: true, searchable: true,
    columns: [column("placeType", "Type"), column("levelRange", "Level range"), column("bosses", "Bosses", true)],
    facets: [facet("placeType", "Type"), facet("guideIncluded", "Guide included")] },
  { kind: "properties", label: "Property", plural: "Properties", route: "properties", icon: "property", pages: true, searchable: true,
    columns: [column("place", "Place"), column("income", "Income", true)], facets: [facet("place", "Place")] },
  { kind: "abilities", label: "Ability", plural: "Abilities", route: "abilities", icon: "ability", pages: true, searchable: true,
    columns: [column("usedBy", "Used by")], facets: [] },
  { kind: "recipes", label: "Recipe", plural: "Recipes", route: "recipes", icon: "recipe", pages: true, searchable: true,
    columns: [column("station", "Station"), column("skill", "Skill"), column("product", "Product")],
    facets: [facet("station", "Station"), facet("skill", "Skill")] },
  { kind: "currencies", label: "Currency", plural: "Currencies", route: "currencies", icon: "currency", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "stats", label: "Stat", plural: "Stats", route: "stats", icon: "stat", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "factions", label: "Faction", plural: "Factions", route: "factions", icon: "faction", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "skills", label: "Skill", plural: "Skills", route: "skills", icon: "skill", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "classes", label: "Class", plural: "Classes", route: "classes", icon: "class", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "races", label: "Race", plural: "Races", route: "races", icon: "race", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "enchantments", label: "Enchantment", plural: "Enchantments", route: "enchantments", icon: "enchantment", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "gearSets", label: "Gear set", plural: "Gear sets", route: "gear-sets", icon: "gear-set", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "effects", label: "Effect", plural: "Effects", route: "effects", icon: "effect", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "species", label: "Species", plural: "Species", route: "species", icon: "species", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "lootTables", label: "Loot table", plural: "Loot tables", route: "loot-tables", icon: "loot-table", pages: false, searchable: false, columns: [], facets: [] },
  { kind: "craftingStations", label: "Crafting station", plural: "Crafting stations", route: "crafting-stations", icon: "crafting-station", pages: false, searchable: false, columns: [], facets: [] },
] satisfies PublicKindEntry[]);

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
