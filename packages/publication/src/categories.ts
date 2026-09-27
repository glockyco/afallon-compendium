import { PUBLIC_MARKER_CATEGORY_VALUES, type PublicMarkerCategory } from "@afallon/contracts/public";

// Player-facing categories come from placement roles. Hostility roles come from the faction standing of the research
// character, so `friendly` shows as townsfolk unless the creature offers a service.
const ROLE_CATEGORIES: Readonly<Record<string, PublicMarkerCategory | null>> = {
  enemy: "enemy", boss: "boss", elite: "enemy", neutral: "neutral", friendly: "townsfolk", npc: null,
  merchant: "merchant", questGiver: "questGiver", resourceProducer: null, oreVein: "oreVein", herb: "herb",
  mushroom: "mushroom", fishingHole: "fishingSpot", container: "container", storage: "container",
  transition: "travelPoint", respawnDestination: "graveyard", usefulInteraction: "interactiveObject",
  questLocation: "interactiveObject", craftingService: "craftingStation", propertyPurchaseService: "property",
  corruptionAltar: "corruptionAltar", combatant: null, dialogue: null, inspect: null, trade: null,
  adventurerProducer: null, adventurerPopulationManager: null,
};
const MAP_ICON_CATEGORIES: Readonly<Record<string, PublicMarkerCategory>> = {
  town: "town", fort: "fort", camp: "camp", dungeon: "dungeonEntrance", challengeStone: "challengeStone",
};

/** Authored services of a creature that no placement role carries. */
export interface CreatureServices { isAuctioneer: boolean; isBanker: boolean; isFlightMaster: boolean }

const SERVICE_CATEGORIES: readonly PublicMarkerCategory[] = ["merchant", "questGiver", "auctioneer", "banker", "flightPoint"];

/**
 * The categories to show, in marker order. A creature that offers a service shows the service instead of townsfolk,
 * and a travel point or a container is not also an interactive object.
 */
export function shownCategories(found: ReadonlySet<PublicMarkerCategory>): PublicMarkerCategory[] {
  const service = SERVICE_CATEGORIES.some((category) => found.has(category));
  const passage = found.has("travelPoint") || found.has("container");
  return PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => found.has(category) && !(category === "townsfolk" && service) && !(category === "interactiveObject" && passage));
}

/** The marker categories of a placement, from its roles and the services of the creatures that stand there. */
export function markerCategories(roles: readonly { role: string; scope: string }[], services: readonly CreatureServices[] = []): PublicMarkerCategory[] {
  const found = new Set<PublicMarkerCategory>();
  if (!roles.some((role) => role.role === "adventurer")) for (const role of roles) {
    const category = role.role === "mapIcon" ? MAP_ICON_CATEGORIES[role.scope] : ROLE_CATEGORIES[role.role];
    if (category) found.add(category);
  }
  if (services.some((service) => service.isAuctioneer)) found.add("auctioneer");
  if (services.some((service) => service.isBanker)) found.add("banker");
  if (services.some((service) => service.isFlightMaster)) found.add("flightPoint");
  return shownCategories(found);
}
