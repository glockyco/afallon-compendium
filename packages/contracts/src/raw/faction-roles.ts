import { Type, type Static } from "typebox";

const integer = Type.Integer();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const alignment = Type.Object({ value: integer, name: text });
const nullableAlignment = Type.Union([alignment, Type.Null()]);
const stance = Type.Union([Type.Object({ nativeId: integer, name: nullableText, instanceId: integer }), Type.Null()]);
const unavailable = Type.Object({ sourceIndex: integer, unavailable: text });
export const FactionRolesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.faction-roles.v1"), frame: integer,
  player: Type.Object({ character: text, factionId: integer, standing: Type.Object({ available: Type.Boolean(), count: integer, entries: Type.Array(Type.Union([unavailable, Type.Object({ sourceIndex: integer, factionId: integer, currentStance: nullableText, stanceIndex: integer, currentPoints: integer })])) }) }),
  playerStateUnchanged: Type.Literal(true), sourceFactionCount: integer,
  factions: Type.Array(Type.Object({
    nativeId: integer, name: nullableText, stancesAvailable: Type.Boolean(), stanceCount: integer,
    stances: Type.Array(Type.Union([unavailable, Type.Object({ sourceIndex: integer, stance, legacyStance: nullableText, pointsRequired: integer, legacyPlayerAlignment: alignment, alignment, nativeAlignment: nullableAlignment, error: nullableText })])),
    interactionsAvailable: Type.Boolean(), interactionCount: integer,
    interactions: Type.Array(Type.Union([unavailable, Type.Object({ sourceIndex: integer, targetFactionId: integer, defaultStance: stance, legacyDefaultStance: nullableText, startingPoints: integer })])),
    observed: Type.Object({ playerStance: stance, playerToNpcAlignment: nullableAlignment, playerAlignmentError: nullableText, npcToPlayerAlignment: nullableAlignment, npcAlignmentError: nullableText, selectedInteractionIndex: Type.Union([integer, Type.Null()]), defaultStanceToPlayer: stance, nullStanceAlignment: nullableAlignment, nullAlignmentError: nullableText }),
  })),
  observations: Type.Array(Type.Object({ componentInstanceId: integer, npcId: Type.Union([integer, Type.Null()]), factionId: integer, playerToNpcAlignment: nullableAlignment, npcToPlayerAlignment: nullableAlignment, error: nullableText })),
});
export type FactionRoles = Static<typeof FactionRolesSchema>;
