import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const id = Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" });
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
const count = Type.Integer({ minimum: 0 });
const dimension = Type.Integer({ minimum: 1 });
const pixel = Type.Object({ x: Type.Number(), y: Type.Number() });
const affineFrame = Type.Object({
  origin: pixel,
  xAxis: pixel,
  yAxis: pixel,
});

export const IllustrationEvidenceInputSchema = Type.Object({
  path: text,
  sha256: hash,
  pointer: Type.Optional(Type.String({ pattern: "^(?:/.*)?$" })),
});
export type IllustrationEvidenceInput = Static<typeof IllustrationEvidenceInputSchema>;

const illustrationAsset = Type.Object({
  path: text,
  sha256: hash,
}, { additionalProperties: false });

const landmarkControl = Type.Object({
  id,
  pixel,
  map: pixel,
  reviewed: Type.Literal(true),
});

const orientationOnlyRegistration = Type.Object({
  kind: Type.Literal("orientation-only"),
  reason: text,
  reviewEvidence: Type.Array(IllustrationEvidenceInputSchema, { minItems: 1, maxItems: 64 }),
});

const calibratedRegistration = Type.Object({
  kind: Type.Literal("calibrated"),
  mapFromPixelEdge: affineFrame,
  landmarks: Type.Array(landmarkControl, { minItems: 4, maxItems: 256 }),
  maximumResidualPixels: Type.Number({ exclusiveMinimum: 0, maximum: 0.25 }),
  reviewEvidence: Type.Array(IllustrationEvidenceInputSchema, { minItems: 1, maxItems: 64 }),
});

export const IllustrationRegistrationInputSchema = Type.Union([
  orientationOnlyRegistration,
  calibratedRegistration,
]);
export type IllustrationRegistrationInput = Static<typeof IllustrationRegistrationInputSchema>;

export const IllustrationPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.illustration-plan.v2"),
  buildId: text,
  layerId: id,
  mapSpaceId: id,
  role: Type.Literal("illustration"),
  image: illustrationAsset,
  mapSpaceProfile: Type.Optional(illustrationAsset),
  registration: IllustrationRegistrationInputSchema,
});
export type IllustrationPlan = Static<typeof IllustrationPlanSchema>;

const evidenceOutput = Type.Object({
  path: text,
  sha256: hash,
  bytes: count,
  pointer: Type.Optional(Type.String({ pattern: "^(?:/.*)?$" })),
});

const controlOutput = Type.Object({
  id,
  pixel,
  map: pixel,
  reviewed: Type.Literal(true),
});

const residualCheck = Type.Object({
  controlId: id,
  expectedPixel: pixel,
  projectedPixel: pixel,
  residualPixels: Type.Number({ minimum: 0, maximum: 0.25 }),
  independentProjectedPixel: pixel,
  independentResidualPixels: Type.Number({ minimum: 0, maximum: 0.25 }),
});

const orientationOnlyOutput = Type.Object({
  kind: Type.Literal("orientation-only"),
  reason: text,
  reviewEvidence: Type.Array(evidenceOutput, { minItems: 1, maxItems: 64 }),
});

const calibratedOutput = Type.Object({
  kind: Type.Literal("calibrated"),
  mapFromPixelEdge: affineFrame,
  landmarks: Type.Array(controlOutput, { minItems: 4, maxItems: 256 }),
  maximumResidualPixels: Type.Number({ exclusiveMinimum: 0, maximum: 0.25 }),
  residualChecks: Type.Array(residualCheck, { minItems: 4, maxItems: 256 }),
  reviewEvidence: Type.Array(evidenceOutput, { minItems: 1, maxItems: 64 }),
});

export const IllustrationRegistrationOutputSchema = Type.Union([
  orientationOnlyOutput,
  calibratedOutput,
]);
export type IllustrationRegistrationOutput = Static<typeof IllustrationRegistrationOutputSchema>;

const imageOutput = Type.Object({
  path: text,
  sha256: hash,
  bytes: count,
  width: dimension,
  height: dimension,
  mediaType: text,
});

export const IllustrationOutputSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.illustration.v1"),
  buildId: text,
  layerId: id,
  mapSpaceId: id,
  role: Type.Literal("illustration"),
  primaryImagery: Type.Literal(false),
  completeImagery: Type.Literal(false),
  image: imageOutput,
  mapSpaceProfile: evidenceOutput,
  registration: IllustrationRegistrationOutputSchema,
});
export type IllustrationOutput = Static<typeof IllustrationOutputSchema>;

