import {
  Anvil,
  Castle,
  CookingPot,
  Crown,
  Flame,
  FlaskConical,
  Gavel,
  Hammer,
  Hand,
  House,
  Landmark,
  PawPrint,
  Scissors,
  ScrollText,
  Skull,
  Tent,
  User,
  type IconNode,
} from "lucide";
import { BuildingCommunity, BuildingMonument, BuildingTunnel, Coins, Diamonds, DoorExit, Dragon, Fish, Grave2, Leaf, Mushroom, Pick, TreasureChest } from "./tabler-icons";

import type { PublicMarkerCategory,
PublicPlacement, } from "@afallon/contracts/public"

export type MarkerId = PublicMarkerCategory;

export const MARKER_IDS = [
  "boss",
  "enemy",
  "neutral",
  "merchant",
  "banker",
  "auctioneer",
  "questGiver",
  "townsfolk",
  "corruptionAltar",
  "challengeStone",
  "alchemyStation",
  "cookingStation",
  "smithingStation",
  "furnace",
  "tailoringStation",
  "craftingStation",
  "container",
  "oreVein",
  "herb",
  "mushroom",
  "fishingSpot",
  "interactiveObject",
  "town",
  "fort",
  "camp",
  "property",
  "dungeonEntrance",
  "graveyard",
  "flightPoint",
  "travelPoint",
] as const satisfies readonly MarkerId[];
export type MarkerRow = Pick<PublicPlacement, "categories">;
export type RGB = readonly [number, number, number];

export interface IconSize {
  base: number;
  min: number;
  max: number;
}

export interface MarkerLayer {
  id: string;
  kind: "icon";
}

export type MarkerSectionId = "creatures" | "people" | "objects" | "resources" | "places";

export const MARKER_SECTION_ORDER = ["creatures", "people", "objects", "resources", "places"] as const satisfies readonly MarkerSectionId[];

export const MARKER_SECTION_LABELS: Record<MarkerSectionId, string> = {
  creatures: "Creatures",
  people: "People",
  objects: "Objects",
  resources: "Resources",
  places: "Places",
};

export interface MarkerDefinition {
  id: MarkerId;
  section: MarkerSectionId;
  label: string;
  pluralLabel: string;
  icon: IconNode;
  color: RGB;
  iconSize: IconSize;
  precedence: number;
  renderOrder: number;
  defaultVisible: boolean;
  layer: MarkerLayer;
  matches: (row: MarkerRow) => boolean;
}

const markerLayer: MarkerLayer = { id: "map-placement-markers", kind: "icon" };
export const MARKER_LAYER_ID = markerLayer.id;
export const MARKER_SIZE_RANGE = { min: 50, max: 200, default: 100, baseScale: 1.4 } as const;

export function markerSizeScale(percent: number): number {
  return percent / MARKER_SIZE_RANGE.default * MARKER_SIZE_RANGE.baseScale;
}

export const markerRegistry = {
  enemy: {
    id: "enemy",
    section: "creatures",
    label: "Enemy",
    pluralLabel: "Enemies",
    icon: Skull,
    color: [225, 29, 72],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 700,
    renderOrder: 180,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("enemy"),
  },
  boss: {
    id: "boss",
    section: "creatures",
    label: "Boss",
    pluralLabel: "Bosses",
    icon: Crown,
    color: [109, 40, 217],
    iconSize: { base: 27, min: 20, max: 54 },
    precedence: 800,
    renderOrder: 800,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("boss"),
  },
  neutral: {
    id: "neutral",
    section: "creatures",
    label: "Neutral",
    pluralLabel: "Neutrals",
    icon: PawPrint,
    color: [245, 158, 11],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 690,
    renderOrder: 150,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("neutral"),
  },
  merchant: {
    id: "merchant",
    section: "people",
    label: "Merchant",
    pluralLabel: "Merchants",
    icon: Coins,
    color: [6, 182, 212],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 620,
    renderOrder: 620,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("merchant"),
  },
  auctioneer: {
    id: "auctioneer",
    section: "people",
    label: "Auctioneer",
    pluralLabel: "Auctioneers",
    icon: Gavel,
    color: [244, 114, 182],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 634,
    renderOrder: 634,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("auctioneer"),
  },
  banker: {
    id: "banker",
    section: "people",
    label: "Banker",
    pluralLabel: "Bankers",
    icon: Landmark,
    color: [250, 204, 21],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 635,
    renderOrder: 635,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("banker"),
  },
  questGiver: {
    id: "questGiver",
    section: "people",
    label: "Quest Giver",
    pluralLabel: "Quest Givers",
    icon: ScrollText,
    color: [168, 85, 247],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 630,
    renderOrder: 630,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("questGiver"),
  },
  townsfolk: {
    id: "townsfolk",
    section: "people",
    label: "Townsfolk",
    pluralLabel: "Townsfolk",
    icon: User,
    color: [59, 130, 246],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 500,
    renderOrder: 500,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("townsfolk"),
  },
  interactiveObject: {
    id: "interactiveObject",
    section: "objects",
    label: "Interactive Object",
    pluralLabel: "Interactive Objects",
    icon: Hand,
    color: [148, 163, 184],
    iconSize: { base: 19, min: 15, max: 40 },
    precedence: 300,
    renderOrder: 300,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("interactiveObject"),
  },
  alchemyStation: {
    id: "alchemyStation",
    section: "objects",
    label: "Alchemy Station",
    pluralLabel: "Alchemy Stations",
    icon: FlaskConical,
    color: [139, 92, 246],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 654,
    renderOrder: 654,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("alchemyStation"),
  },
  cookingStation: {
    id: "cookingStation",
    section: "objects",
    label: "Cooking Station",
    pluralLabel: "Cooking Stations",
    icon: CookingPot,
    color: [234, 88, 12],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 653,
    renderOrder: 653,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("cookingStation"),
  },
  smithingStation: {
    id: "smithingStation",
    section: "objects",
    label: "Smithing Station",
    pluralLabel: "Smithing Stations",
    icon: Anvil,
    color: [71, 85, 105],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 652,
    renderOrder: 652,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("smithingStation"),
  },
  furnace: {
    id: "furnace",
    section: "objects",
    label: "Furnace",
    pluralLabel: "Furnaces",
    icon: Flame,
    color: [239, 68, 68],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 651,
    renderOrder: 651,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("furnace"),
  },
  tailoringStation: {
    id: "tailoringStation",
    section: "objects",
    label: "Tailoring Station",
    pluralLabel: "Tailoring Stations",
    icon: Scissors,
    color: [236, 72, 153],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 650,
    renderOrder: 650,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("tailoringStation"),
  },
  craftingStation: {
    id: "craftingStation",
    section: "objects",
    label: "Crafting Station",
    pluralLabel: "Crafting Stations",
    icon: Hammer,
    color: [249, 115, 22],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 610,
    renderOrder: 610,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("craftingStation"),
  },
  oreVein: {
    id: "oreVein",
    section: "resources",
    label: "Ore Vein",
    pluralLabel: "Ore Veins",
    icon: Pick,
    color: [120, 120, 130],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 103,
    renderOrder: 103,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("oreVein"),
  },
  herb: {
    id: "herb",
    section: "resources",
    label: "Herb",
    pluralLabel: "Herbs",
    icon: Leaf,
    color: [132, 204, 22],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 102,
    renderOrder: 102,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("herb"),
  },
  mushroom: {
    id: "mushroom",
    section: "resources",
    label: "Mushroom",
    pluralLabel: "Mushrooms",
    icon: Mushroom,
    color: [217, 119, 6],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 101,
    renderOrder: 101,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("mushroom"),
  },
  fishingSpot: {
    id: "fishingSpot",
    section: "resources",
    label: "Fishing Spot",
    pluralLabel: "Fishing Spots",
    icon: Fish,
    color: [14, 165, 233],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 100,
    renderOrder: 100,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("fishingSpot"),
  },
  container: {
    id: "container",
    section: "objects",
    label: "Container",
    pluralLabel: "Containers",
    icon: TreasureChest,
    color: [234, 179, 8],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 400,
    renderOrder: 400,
    defaultVisible: false,
    layer: markerLayer,
    matches: (row) => row.categories.includes("container"),
  },
  flightPoint: {
    id: "flightPoint",
    section: "places",
    label: "Flight Point",
    pluralLabel: "Flight Points",
    icon: Dragon,
    color: [56, 189, 248],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 640,
    renderOrder: 640,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("flightPoint"),
  },
  travelPoint: {
    id: "travelPoint",
    section: "places",
    label: "Travel Point",
    pluralLabel: "Travel Points",
    icon: DoorExit,
    color: [34, 197, 94],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 550,
    renderOrder: 550,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("travelPoint"),
  },
  town: {
    id: "town",
    section: "places",
    label: "Town",
    pluralLabel: "Towns",
    icon: BuildingCommunity,
    color: [245, 158, 11],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 560,
    renderOrder: 590,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("town"),
  },
  fort: {
    id: "fort",
    section: "places",
    label: "Fort",
    pluralLabel: "Forts",
    icon: Castle,
    color: [100, 116, 139],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 570,
    renderOrder: 585,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("fort"),
  },
  camp: {
    id: "camp",
    section: "places",
    label: "Camp",
    pluralLabel: "Camps",
    icon: Tent,
    color: [132, 204, 22],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 530,
    renderOrder: 580,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("camp"),
  },
  dungeonEntrance: {
    id: "dungeonEntrance",
    section: "places",
    label: "Dungeon Entrance",
    pluralLabel: "Dungeon Entrances",
    icon: BuildingTunnel,
    color: [168, 85, 247],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 580,
    renderOrder: 570,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("dungeonEntrance"),
  },
  challengeStone: {
    id: "challengeStone",
    section: "objects",
    label: "Challenge Stone",
    pluralLabel: "Challenge Stones",
    icon: BuildingMonument,
    color: [14, 165, 233],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 540,
    renderOrder: 560,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("challengeStone"),
  },
  graveyard: {
    id: "graveyard",
    section: "places",
    label: "Graveyard",
    pluralLabel: "Graveyards",
    icon: Grave2,
    color: [148, 163, 184],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 548,
    renderOrder: 555,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("graveyard"),
  },
  corruptionAltar: {
    id: "corruptionAltar",
    section: "objects",
    label: "Altar of Corruption",
    pluralLabel: "Altars of Corruption",
    icon: Diamonds,
    color: [220, 38, 38],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 547,
    renderOrder: 565,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("corruptionAltar"),
  },
  property: {
    id: "property",
    section: "places",
    label: "Property",
    pluralLabel: "Properties",
    icon: House,
    color: [217, 119, 6],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 545,
    renderOrder: 575,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("property"),
  },
} as const satisfies Record<MarkerId, MarkerDefinition>;

const allMarkers = Object.values(markerRegistry) as readonly MarkerDefinition[];
// The atlas opens with place markers, bosses, key services, and rare crafting stations.
// Common cooking stations and other optional categories remain available in the filters.
export const DEFAULT_MARKER_IDS: readonly MarkerId[] = allMarkers.filter((marker) => marker.defaultVisible).map((marker) => marker.id);
const markersByPrecedence = [...allMarkers].sort((left, right) => right.precedence - left.precedence);

export function markerFor(id: MarkerId): MarkerDefinition {
  return markerRegistry[id];
}

export function resolveMarker(row: MarkerRow): MarkerId | null {
  const matches = markersByPrecedence.filter((marker) => marker.matches(row));
  const first = matches[0];
  if (!first) return null;
  if (matches[1]?.precedence === first.precedence) {
    throw new Error(`Marker precedence tie: ${first.id} and ${matches[1].id}`);
  }
  return first.id;
}

export function markerColorCss(marker: MarkerDefinition): string {
  return `rgb(${marker.color.join(",")})`;
}
