import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const nullableNumber = Type.Union([Type.Number(), Type.Null()]);
const nullableInteger = Type.Union([Type.Integer(), Type.Null()]);
const bonus = Type.Object({ statId: Type.Integer({ minimum: 0 }), amountPerLevel: Type.Number(), isPercent: Type.Boolean(), sourceFieldPath: text });
const bonusList = Type.Union([Type.Array(bonus), Type.Null()]);
const reference = Type.Object({ id: Type.Integer({ minimum: 0 }), sourceFieldPath: text });
const nullableReference = Type.Union([reference, Type.Null()]);

export const CorruptionCaptureSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.corruption-capture.v3"),
  combat: Type.Object({
    maxLevel: nullableInteger,
    gearAllStatsPercentPerLevel: nullableNumber,
    gearStatBonuses: bonusList,
    mobStatBonuses: bonusList,
    sourceFieldPath: text,
  }),
  affixSettings: Type.Object({
    affixesPerToken: nullableInteger,
    disabledAffixes: Type.Union([Type.Array(Type.Integer({ minimum: 0 })), Type.Null()]),
    npcRequirements: Type.Union([Type.Array(Type.Object({ id: Type.Integer({ minimum: 0 }), npcId: Type.Integer(), sourceFieldPath: text })), Type.Null()]),
    sourceFieldPath: text,
  }),
  affixes: Type.Union([Type.Array(Type.Object({ id: Type.Integer({ minimum: 0 }), name: text, description: text, sourceFieldPath: text })), Type.Null()]),
  timer: Type.Union([Type.Null(), Type.Object({
    scenePath: text, sourceFieldPath: text, totalSeconds: nullableNumber,
    firstRemainingSeconds: nullableNumber, secondRemainingSeconds: nullableNumber,
    maxLootItems: nullableInteger, bosses: Type.Union([Type.Array(reference), Type.Null()]),
    lootTables: Type.Union([Type.Array(reference), Type.Null()]), token: nullableReference,
  })]),
  dungeonFinder: Type.Union([
    Type.Object({ unavailable: text, sourceFieldPath: text, assetCount: Type.Integer({ minimum: 0 }) }),
    Type.Object({
      supplyPackId: nullableInteger,
      enabledSceneIds: Type.Array(Type.Integer({ minimum: 0 })),
      sourceFieldPath: text,
      tankItemPowerShare: Type.Number(), tankGearPieces: Type.Integer(),
      tankSourceFieldPaths: Type.Object({ tankItemPowerShare: text, tankGearPieces: text }),
    }),
  ]),
}, { additionalProperties: false });
export const CorruptionCaptureV2Schema = Type.Object({
  ...CorruptionCaptureSchema.properties,
  schemaVersion: Type.Literal("compendium.corruption-capture.v2"),
  dungeonFinder: Type.Object({
    supplyPackId: nullableInteger,
    enabledSceneIds: Type.Array(Type.Integer({ minimum: 0 })),
    sourceFieldPath: text,
  }),
}, { additionalProperties: false });
const { dungeonFinder: _finder, ...legacyCorruption } = CorruptionCaptureV2Schema.properties;
export const CorruptionCaptureV1Schema = Type.Object({ ...legacyCorruption, schemaVersion: Type.Literal("compendium.corruption-capture.v1") }, { additionalProperties: false });
export type CorruptionCapture = Static<typeof CorruptionCaptureSchema>;
