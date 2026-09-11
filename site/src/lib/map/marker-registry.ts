import {
  CircleDot,
  Crown,
  Hammer,
  Hand,
  Package,
  PawPrint,
  Pickaxe,
  ScrollText,
  Shield,
  Skull,
  Store,
  User,
  type IconNode,
} from "lucide";
import type {
  PublicMarkerCategory,
  PublicPlacement,
} from "../../../../pipeline/public-contracts";

export type MarkerId = PublicMarkerCategory;

export const MARKER_IDS = [
  "enemy",
  "boss",
  "neutral",
  "ally",
  "npc",
  "merchant",
  "questGiver",
  "interactiveObject",
  "craftingStation",
  "resource",
  "container",
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

export type MarkerSectionId = "hostile" | "characters" | "gathering" | "travel";

export const MARKER_SECTION_ORDER = ["hostile", "characters", "gathering", "travel"] as const satisfies readonly MarkerSectionId[];

export const MARKER_SECTION_LABELS: Record<MarkerSectionId, string> = {
  hostile: "Hostile creatures",
  characters: "Characters & services",
  gathering: "Gathering & containers",
  travel: "Travel",
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

export const markerRegistry = {
  enemy: {
    id: "enemy",
    section: "hostile",
    label: "Enemy",
    pluralLabel: "Enemies",
    icon: Skull,
    color: [225, 29, 72],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 700,
    renderOrder: 700,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("enemy"),
  },
  boss: {
    id: "boss",
    section: "hostile",
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
    section: "characters",
    label: "Neutral",
    pluralLabel: "Neutrals",
    icon: PawPrint,
    color: [245, 158, 11],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 690,
    renderOrder: 690,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("neutral"),
  },
  ally: {
    id: "ally",
    section: "characters",
    label: "Ally",
    pluralLabel: "Allies",
    icon: Shield,
    color: [16, 185, 129],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 680,
    renderOrder: 680,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("ally"),
  },
  npc: {
    id: "npc",
    section: "characters",
    label: "NPC",
    pluralLabel: "NPCs",
    icon: User,
    color: [59, 130, 246],
    iconSize: { base: 20, min: 16, max: 42 },
    precedence: 500,
    renderOrder: 500,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("npc"),
  },
  merchant: {
    id: "merchant",
    section: "characters",
    label: "Merchant",
    pluralLabel: "Merchants",
    icon: Store,
    color: [6, 182, 212],
    iconSize: { base: 22, min: 17, max: 46 },
    precedence: 620,
    renderOrder: 620,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("merchant"),
  },
  questGiver: {
    id: "questGiver",
    section: "characters",
    label: "Quest Giver",
    pluralLabel: "Quest Givers",
    icon: ScrollText,
    color: [168, 85, 247],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 630,
    renderOrder: 630,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("questGiver"),
  },
  interactiveObject: {
    id: "interactiveObject",
    section: "gathering",
    label: "Interactive Object",
    pluralLabel: "Interactive Objects",
    icon: Hand,
    color: [148, 163, 184],
    iconSize: { base: 19, min: 15, max: 40 },
    precedence: 300,
    renderOrder: 300,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("interactiveObject"),
  },
  craftingStation: {
    id: "craftingStation",
    section: "gathering",
    label: "Crafting Station",
    pluralLabel: "Crafting Stations",
    icon: Hammer,
    color: [249, 115, 22],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 610,
    renderOrder: 610,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("craftingStation"),
  },
  resource: {
    id: "resource",
    section: "gathering",
    label: "Resource",
    pluralLabel: "Resources",
    icon: Pickaxe,
    color: [132, 204, 22],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 200,
    renderOrder: 200,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("resource"),
  },
  container: {
    id: "container",
    section: "gathering",
    label: "Container",
    pluralLabel: "Containers",
    icon: Package,
    color: [234, 179, 8],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 400,
    renderOrder: 400,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("container"),
  },
  travelPoint: {
    id: "travelPoint",
    section: "travel",
    label: "Travel Point",
    pluralLabel: "Travel Points",
    icon: CircleDot,
    color: [34, 197, 94],
    iconSize: { base: 23, min: 18, max: 48 },
    precedence: 550,
    renderOrder: 550,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("travelPoint"),
  },
} as const satisfies Record<MarkerId, MarkerDefinition>;

const allMarkers = Object.values(markerRegistry) as readonly MarkerDefinition[];
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
