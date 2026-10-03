import { Type, type Static } from "typebox";

export const text = Type.String({ minLength: 1 });
export const number = Type.Number();
export const count = Type.Integer({ minimum: 0 });
export const point = Type.Object({ x: number, y: number }, { additionalProperties: false });
export const position = Type.Tuple([number, number]);
export const url = Type.String({ minLength: 1, pattern: "^(?!/)(?!.*\\.\\.)(?!.*:)[a-zA-Z0-9_./-]+$" });
export const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
// A UTC day. `isCalendarDate` also rejects days that do not exist, such as 2026-02-30.
export const calendarDate = Type.String({ pattern: "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$" });
// The only external links that a publication carries: the public store articles of Steam news.
export const steamArticleUrl = Type.String({ pattern: "^https://store\\.steampowered\\.com/news/app/[1-9][0-9]*/view/[1-9][0-9]*$" });

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
  "heroicConsole",
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
// A category name reads in title case wherever it appears, as on the map.
export const PUBLIC_MARKER_CATEGORY_LABELS: Readonly<Record<PublicMarkerCategory, string>> = {
  boss: "Boss", enemy: "Enemy", neutral: "Neutral", merchant: "Merchant", auctioneer: "Auctioneer", banker: "Banker", questGiver: "Quest Giver",
  townsfolk: "Townsfolk", craftingStation: "Crafting Station", alchemyStation: "Alchemy Station", cookingStation: "Cooking Station", smithingStation: "Smithing Station", furnace: "Furnace", tailoringStation: "Tailoring Station", container: "Container", oreVein: "Ore Vein",
  herb: "Herb", mushroom: "Mushroom", fishingSpot: "Fishing Spot", interactiveObject: "Interactive Object",
  town: "Town", fort: "Fort", camp: "Camp", property: "Property", dungeonEntrance: "Dungeon Entrance",
  // Only flight master characters carry the flight point category, so the label names the character, as the map does.
  corruptionAltar: "Altar of Corruption", heroicConsole: "Heroic Console", challengeStone: "Challenge Stone", graveyard: "Graveyard", flightPoint: "Flight Master", travelPoint: "Travel Point",
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
  Type.Literal("heroicConsole"),
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

// The level that the game gives a creature at one placement. With `scales`, the game clamps the player's level into
// min..max and adds a small random offset, and an absent `max` means that no upper bound applies. Without `scales`,
// the game rolls a level from min to max.
export const PublicLevelSchema = Type.Object({
  min: count,
  max: Type.Optional(count),
  scales: Type.Boolean(),
}, { additionalProperties: false });
export type PublicLevel = Static<typeof PublicLevelSchema>;

// A RandomActivator choice that can disable a spawn. `chance` is the probability, in percent, that the game keeps the
// spawn active. `options` counts the random spots that the game picks one from, and 1 means an independent chance.
export const PublicAlternativeSchema = Type.Object({
  chance: Type.Number({ exclusiveMinimum: 0, maximum: 100 }),
  options: Type.Integer({ minimum: 1 }),
}, { additionalProperties: false });
export type PublicAlternative = Static<typeof PublicAlternativeSchema>;

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
