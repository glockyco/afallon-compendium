import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import { ObservationContextSchema } from "./contracts";
import type { WorldInventory } from "./world-inventory";
import type { NpcProducers } from "./npc-extraction";
import type { WorldSources } from "./world-extraction";
import { buildCoverageEntries } from "./coverage-sources";
import { buildCoverageDiagnostics } from "./coverage-diagnostics";

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

type Observation = Static<typeof ObservationContextSchema> & { artifactSha256: string };
type ReferenceIssue = { source: string; targetKind: string; nativeId: number };
export type CoverageInput = {
  buildId: string;
  runId: string;
  inventory: WorldInventory;
  npcProducers: NpcProducers;
  worldSources: WorldSources;
  observations: Record<"world-inventory" | "npc-producers" | "world-sources", Observation>;
  validation: {
    artifactSha256: string;
    inventoryDiagnostics: { kind: string; sourceFieldPath: string; detail: string }[];
    unresolved: ReferenceIssue[];
    unset: ReferenceIssue[];
  };
};

const artifactRecord = Type.Object({ path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), observation: Type.Optional(ObservationContextSchema) });
export const CoverageLedgerSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.coverage.v1"),
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
    completeReleaseEligible: Type.Literal(false),
    reason: text,
  }),
});
export type CoverageLedger = Static<typeof CoverageLedgerSchema>;

export function createCoverageLedger(input: CoverageInput): CoverageLedger {
  const entries = buildCoverageEntries(input);
  const expected: Record<string, number> = {
    "build-scene": input.inventory.sourceTotals.buildScenes,
    "database-scene": input.inventory.sourceTotals.databaseScenes,
    "destination-reference": input.inventory.sourceTotals.referencedDestinations + input.inventory.sourceTotals.loadedTransitions,
    "loaded-scene": input.inventory.sourceTotals.loadedScenes,
    "streamed-source": input.inventory.sourceTotals.addressableSources,
    "component-family": input.inventory.sourceTotals.componentFamilies,
    "behaviour-type": input.inventory.sourceTotals.behaviourTypes,
    "npc-producer": input.npcProducers.exportedTotals.producers,
    "adventurer-zone": input.npcProducers.exportedTotals.adventurerSpawnZones,
    "adventurer-manager": input.npcProducers.exportedTotals.adventurerPopulationManagers,
    "runtime-observation": input.npcProducers.exportedTotals.allObservations,
    "requirement-template": input.npcProducers.requirementTemplates.length,
    "world-source": Object.values(input.worldSources.totals.exported).reduce((sum, value) => sum + value, 0),
  };
  const actual: Record<string, number> = {};
  const ids = new Map<string, CoverageEntry>();
  const sources = new Set<string>();
  const reachability: Record<string, number> = {};
  const extraction: Record<string, number> = {};
  const imagery: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.id !== `${entry.evidence.artifact}:${entry.evidence.path}`) throw new Error(`Coverage entry identity disagrees with its evidence: ${entry.id}`);
    actual[entry.kind] = (actual[entry.kind] ?? 0) + 1;
    if (ids.has(entry.id)) throw new Error(`Duplicate coverage entry: ${entry.id}`);
    ids.set(entry.id, entry);
    sources.add(entry.sourceKey);
  }
  for (const [kind, count] of Object.entries(expected)) {
    if ((actual[kind] ?? 0) !== count) throw new Error(`Coverage lost ${kind} records: expected ${count}, received ${actual[kind] ?? 0}.`);
  }
  const diagnostics = buildCoverageDiagnostics(input, entries);
  const diagnosticRows = new Map<string, Uint8Array>([
    ["validation:worldInventory.diagnostics", new Uint8Array(input.validation.inventoryDiagnostics.length)],
    ["validation:unresolved", new Uint8Array(input.validation.unresolved.length)],
    ["validation:unset", new Uint8Array(input.validation.unset.length)],
    ["npc-producers:unresolved", new Uint8Array(input.npcProducers.unresolved.length)],
    ["world-sources:unresolved", new Uint8Array(input.worldSources.unresolved.length)],
  ]);
  const unresolvedSources = new Set<string>();
  const unmappedSources = new Set<string>();
  let diagnosticOccurrences = 0;
  for (const group of diagnostics) {
    diagnosticOccurrences += group.occurrences;
    if (group.category !== "unset") {
      unresolvedSources.add(group.sourceKey);
      if (group.sourceResolution === "unmapped") unmappedSources.add(group.sourceKey);
    }
    let evidenceOccurrences = 0;
    for (const evidence of group.evidence) {
      const rows = diagnosticRows.get(`${evidence.artifact}:${evidence.collection}`);
      if (!rows) throw new Error(`Unknown diagnostic evidence collection: ${evidence.artifact}:${evidence.collection}`);
      let previousEnd = -2;
      for (const range of evidence.ranges) {
        if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end < range.start || range.end >= rows.length || range.start <= previousEnd + 1) throw new Error(`Invalid or uncoalesced diagnostic evidence range for ${group.sourceKey}.`);
        for (let index = range.start; index <= range.end; index++) {
          if (rows[index]) throw new Error(`Diagnostic evidence row was counted twice: ${evidence.artifact}:${evidence.collection}[${index}]`);
          rows[index] = 1;
        }
        evidenceOccurrences += range.end - range.start + 1;
        previousEnd = range.end;
      }
    }
    if (evidenceOccurrences !== group.occurrences || group.details.reduce((sum, detail) => sum + detail.occurrences, 0) !== group.occurrences) throw new Error(`Diagnostic counts disagree with evidence for ${group.sourceKey}.`);
    if ((group.sourceResolution === "entry") !== (group.sourceEntryIds.length > 0)) throw new Error(`Diagnostic source resolution disagrees with its entries: ${group.sourceKey}.`);
    for (const id of group.sourceEntryIds) {
      const entry = ids.get(id);
      if (!entry || entry.sourceKey !== group.sourceKey) throw new Error(`Diagnostic refers to an absent or different source entry: ${id}`);
      if (group.category === "failed" || (group.category === "unsupported" && entry.extraction.state !== "failed")) {
        entry.extraction = { state: group.category, reason: `The source reports ${group.issueType}; its diagnostic evidence retains the unhandled or failed payload.` };
      }
    }
  }
  for (const [collection, rows] of diagnosticRows) {
    if (rows.includes(0)) throw new Error(`Coverage diagnostics omit evidence from ${collection}.`);
  }
  for (const entry of entries) {
    reachability[entry.reachability.state] = (reachability[entry.reachability.state] ?? 0) + 1;
    extraction[entry.extraction.state] = (extraction[entry.extraction.state] ?? 0) + 1;
    imagery[entry.imagery.state] = (imagery[entry.imagery.state] ?? 0) + 1;
  }
  const artifacts: CoverageLedger["artifacts"] = {};
  for (const name of ["world-inventory", "npc-producers", "world-sources"] as const) {
    const { artifactSha256, ...observation } = input.observations[name];
    artifacts[name] = { path: `raw/${name}.json`, sha256: artifactSha256, observation };
  }
  artifacts.validation = { path: "validation.json", sha256: input.validation.artifactSha256 };
  const ledger: CoverageLedger = {
    schemaVersion: "compendium.coverage.v1", buildId: input.buildId, runId: input.runId,
    identityScope: "artifact observations; not persistent placement identities", discoveryClosed: false,
    artifacts, entries, diagnostics,
    summary: {
      entries: entries.length, distinctSources: sources.size, reachability, extraction, imagery,
      diagnosticOccurrences, diagnosticGroups: diagnostics.length,
      unresolvedDiagnosticSources: unresolvedSources.size, unmappedDiagnosticSources: unmappedSources.size,
      completeReleaseEligible: false,
      reason: "This extraction observes loaded content. Full-build discovery, traversal, source classification, and project-owned imagery are not complete.",
    },
  };
  Assert(CoverageLedgerSchema, ledger);
  return ledger;
}
