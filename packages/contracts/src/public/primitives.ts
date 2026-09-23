import { Type, type Static } from "typebox";

export const text = Type.String({ minLength: 1 });
export const number = Type.Number();
export const count = Type.Integer({ minimum: 0 });
export const point = Type.Object({ x: number, y: number }, { additionalProperties: false });
export const position = Type.Tuple([number, number]);
export const url = Type.String({ minLength: 1, pattern: "^(?!/)(?!.*\\.\\.)(?!.*:)[a-zA-Z0-9_./-]+$" });
export const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });

export const PUBLIC_MARKER_CATEGORY_VALUES = [
  "boss",
  "enemy",
  "neutral",
  "merchant",
  "auctioneer",
  "banker",
  "questGiver",
  "townsfolk",
  "corruptionAltar",
  "challengeStone",
  "craftingStation",
  "alchemyStation",
  "cookingStation",
  "smithingStation",
  "furnace",
  "tailoringStation",
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
] as const;
export type PublicMarkerCategory = typeof PUBLIC_MARKER_CATEGORY_VALUES[number];
export const PUBLIC_MARKER_CATEGORY_LABELS: Readonly<Record<PublicMarkerCategory, string>> = {
  boss: "Boss", enemy: "Enemy", neutral: "Neutral", merchant: "Merchant", auctioneer: "Auctioneer", banker: "Banker", questGiver: "Quest giver",
  townsfolk: "Townsfolk", craftingStation: "Crafting station", alchemyStation: "Alchemy station", cookingStation: "Cooking station", smithingStation: "Smithing station", furnace: "Furnace", tailoringStation: "Tailoring station", container: "Container", oreVein: "Ore Vein",
  herb: "Herb", mushroom: "Mushroom", fishingSpot: "Fishing Spot", interactiveObject: "Interactive object",
  town: "Town", fort: "Fort", camp: "Camp", property: "Property", dungeonEntrance: "Dungeon entrance",
  corruptionAltar: "Altar of corruption", challengeStone: "Challenge stone", graveyard: "Graveyard", flightPoint: "Flight point", travelPoint: "Travel point",
};
export const publicMarkerCategory = Type.Union([
  Type.Literal("boss"),
  Type.Literal("enemy"),
  Type.Literal("neutral"),
  Type.Literal("merchant"),
  Type.Literal("auctioneer"),
  Type.Literal("banker"),
  Type.Literal("questGiver"),
  Type.Literal("townsfolk"),
  Type.Literal("corruptionAltar"),
  Type.Literal("challengeStone"),
  Type.Literal("craftingStation"),
  Type.Literal("alchemyStation"),
  Type.Literal("cookingStation"),
  Type.Literal("smithingStation"),
  Type.Literal("furnace"),
  Type.Literal("tailoringStation"),
  Type.Literal("container"),
  Type.Literal("oreVein"),
  Type.Literal("herb"),
  Type.Literal("mushroom"),
  Type.Literal("fishingSpot"),
  Type.Literal("interactiveObject"),
  Type.Literal("town"),
  Type.Literal("fort"),
  Type.Literal("camp"),
  Type.Literal("property"),
  Type.Literal("dungeonEntrance"),
  Type.Literal("graveyard"),
  Type.Literal("flightPoint"),
  Type.Literal("travelPoint"),
]);

export const PublicLevelRangeSchema = Type.Object({
  min: count,
  max: count,
}, { additionalProperties: false });
export type PublicLevelRange = Static<typeof PublicLevelRangeSchema>;

export const StaticResourceIdentityFields = {
  buildId: text,
  catalogId: hash,
};

export const StaticResourceReferenceSchema = Type.Object({
  path: url,
  sha256: hash,
  bytes: count,
  schemaId: text,
}, { additionalProperties: false });
export type StaticResourceReference = Static<typeof StaticResourceReferenceSchema>;

export const resourceReference = (schemaId: string) => Type.Object({
  ...StaticResourceReferenceSchema.properties,
  schemaId: Type.Literal(schemaId),
}, { additionalProperties: false });
