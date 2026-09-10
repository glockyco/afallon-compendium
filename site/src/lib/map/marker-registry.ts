import {
  CircleDot,
  Crown,
  Hammer,
  MapPin,
  MousePointerClick,
  Package,
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

export interface MarkerDefinition {
  id: MarkerId;
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
    label: "Enemy",
    pluralLabel: "Enemies",
    icon: Skull,
    color: [183, 60, 52],
    iconSize: { base: 22, min: 16, max: 44 },
    precedence: 700,
    renderOrder: 700,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("enemy"),
  },
  boss: {
    id: "boss",
    label: "Boss",
    pluralLabel: "Bosses",
    icon: Crown,
    color: [208, 148, 46],
    iconSize: { base: 25, min: 18, max: 50 },
    precedence: 800,
    renderOrder: 800,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("boss"),
  },
  neutral: {
    id: "neutral",
    label: "Neutral",
    pluralLabel: "Neutrals",
    icon: CircleDot,
    color: [176, 134, 56],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 690,
    renderOrder: 690,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("neutral"),
  },
  ally: {
    id: "ally",
    label: "Ally",
    pluralLabel: "Allies",
    icon: Shield,
    color: [58, 127, 91],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 680,
    renderOrder: 680,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("ally"),
  },
  npc: {
    id: "npc",
    label: "NPC",
    pluralLabel: "NPCs",
    icon: User,
    color: [112, 112, 112],
    iconSize: { base: 20, min: 16, max: 42 },
    precedence: 500,
    renderOrder: 500,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("npc"),
  },
  merchant: {
    id: "merchant",
    label: "Merchant",
    pluralLabel: "Merchants",
    icon: Store,
    color: [35, 104, 176],
    iconSize: { base: 22, min: 17, max: 44 },
    precedence: 620,
    renderOrder: 620,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("merchant"),
  },
  questGiver: {
    id: "questGiver",
    label: "Quest Giver",
    pluralLabel: "Quest Givers",
    icon: ScrollText,
    color: [138, 75, 150],
    iconSize: { base: 22, min: 17, max: 44 },
    precedence: 630,
    renderOrder: 630,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("questGiver"),
  },
  interactiveObject: {
    id: "interactiveObject",
    label: "Interactive Object",
    pluralLabel: "Interactive Objects",
    icon: MousePointerClick,
    color: [35, 112, 116],
    iconSize: { base: 20, min: 16, max: 42 },
    precedence: 300,
    renderOrder: 300,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("interactiveObject"),
  },
  craftingStation: {
    id: "craftingStation",
    label: "Crafting Station",
    pluralLabel: "Crafting Stations",
    icon: Hammer,
    color: [190, 119, 49],
    iconSize: { base: 21, min: 16, max: 44 },
    precedence: 610,
    renderOrder: 610,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("craftingStation"),
  },
  resource: {
    id: "resource",
    label: "Resource",
    pluralLabel: "Resources",
    icon: Pickaxe,
    color: [35, 125, 74],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 200,
    renderOrder: 200,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("resource"),
  },
  container: {
    id: "container",
    label: "Container",
    pluralLabel: "Containers",
    icon: Package,
    color: [154, 99, 26],
    iconSize: { base: 20, min: 15, max: 42 },
    precedence: 400,
    renderOrder: 400,
    defaultVisible: true,
    layer: markerLayer,
    matches: (row) => row.categories.includes("container"),
  },
  travelPoint: {
    id: "travelPoint",
    label: "Travel Point",
    pluralLabel: "Travel Points",
    icon: MapPin,
    color: [35, 112, 116],
    iconSize: { base: 22, min: 17, max: 44 },
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
