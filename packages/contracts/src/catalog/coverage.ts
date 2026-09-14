import { Type, type Static } from "typebox";
import { ObservationContextSchema } from "../raw/database";

const text = Type.String({ minLength: 1 });
const count = Type.Integer({ minimum: 0 });
const nullableBoolean = Type.Union([Type.Boolean(), Type.Null()]);
const artifact = Type.Union([Type.Literal("world-inventory"), Type.Literal("npc-producers"), Type.Literal("world-sources"), Type.Literal("validation")]);

export const CoverageEntrySchema = Type.Object({
  id: text,
  sourceKey: text,
  kind: Type.Union([Type.Literal("build-scene"), Type.Literal("database-scene"), Type.Literal("destination-reference"), Type.Literal("loaded-scene"), Type.Literal("streamed-source"), Type.Literal("component-family"), Type.Literal("behaviour-type"), Type.Literal("npc-producer"), Type.Literal("adventurer-zone"), Type.Literal("adventurer-manager"), Type.Literal("world-source"), Type.Literal("runtime-observation"), Type.Literal("requirement-template")]),
  evidence: Type.Object({ artifact, path: text }),
  sourceFieldPath: text,
  sceneNativeId: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  relevance: Type.Object({ state: Type.Union([Type.Literal("relevant"), Type.Literal("unknown"), Type.Literal("not-relevant")]), reason: text }),
  reachability: Type.Object({ state: Type.Union([Type.Literal("unknown"), Type.Literal("reachable"), Type.Literal("unreachable"), Type.Literal("unused")]), reason: text }),
  runtimeAvailability: Type.Object({
    loadState: Type.Union([Type.Literal("unloaded"), Type.Literal("loading"), Type.Literal("loaded"), Type.Literal("unknown")]),
    activeSelf: nullableBoolean,
    activeInHierarchy: nullableBoolean,
    enabled: nullableBoolean,
    loadedOrLoading: nullableBoolean,
    geometryReadiness: Type.Literal("unverified"),
    reason: text,
  }),
  extraction: Type.Object({ state: Type.Union([Type.Literal("pending"), Type.Literal("extracted"), Type.Literal("unsupported"), Type.Literal("failed")]), reason: text }),
  imagery: Type.Object({ state: Type.Union([Type.Literal("pending"), Type.Literal("captured"), Type.Literal("validated"), Type.Literal("failed"), Type.Literal("not-applicable")]), reason: text }),
});
export type CoverageEntry = Static<typeof CoverageEntrySchema>;

export const CoverageDiagnosticSchema = Type.Object({
  sourceKey: text,
  issueType: text,
  category: Type.Union([Type.Literal("unset"), Type.Literal("unresolved-reference"), Type.Literal("unverified-semantics"), Type.Literal("unsupported"), Type.Literal("failed"), Type.Literal("unclassified")]),
  occurrences: Type.Integer({ minimum: 1 }),
  sourceEntryIds: Type.Array(text),
  sourceResolution: Type.Union([Type.Literal("entry"), Type.Literal("unmapped")]),
  details: Type.Array(Type.Object({ detail: text, occurrences: Type.Integer({ minimum: 1 }) })),
  evidence: Type.Array(Type.Object({ artifact, collection: text, ranges: Type.Array(Type.Object({ start: count, end: count })) })),
});
export type CoverageDiagnostic = Static<typeof CoverageDiagnosticSchema>;

const artifactRecord = Type.Object({ path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), observation: Type.Optional(ObservationContextSchema) });
export const CoverageLedgerSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.coverage.v2"),
  buildId: text,
  runId: text,
  identityScope: Type.Literal("artifact observations; not persistent placement identities"),
  discoveryClosed: Type.Literal(false),
  artifacts: Type.Record(text, artifactRecord),
  entries: Type.Array(CoverageEntrySchema),
  diagnostics: Type.Array(CoverageDiagnosticSchema),
  summary: Type.Object({
    entries: count,
    distinctSources: count,
    reachability: Type.Record(text, count),
    extraction: Type.Record(text, count),
    imagery: Type.Record(text, count),
    diagnosticOccurrences: count,
    diagnosticGroups: count,
    unresolvedDiagnosticSources: count,
    unmappedDiagnosticSources: count,
    roleResolution: Type.Object({
      state: Type.Union([Type.Literal("resolved"), Type.Literal("blocked")]),
      artifact: Type.Literal("placement-roles"),
      unplacedSources: count,
      issueOccurrences: count,
    }),
    completeReleaseEligible: Type.Literal(false),
    reason: text,
  }),
});
export type CoverageLedger = Static<typeof CoverageLedgerSchema>;
