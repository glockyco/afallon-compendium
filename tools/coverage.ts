import { Assert } from "typebox/value";
import { CoverageLedgerSchema, type CoverageDiagnostic, type CoverageEntry, type CoverageLedger, type NpcProducers, type ObservationContext, type WorldInventory, type WorldSources } from "@afallon/contracts"
import type { PlacementRoles } from "@afallon/contracts/catalog"
import { buildCoverageEntries } from "./coverage-sources";
import { buildCoverageDiagnostics } from "./coverage-diagnostics";

type Observation = ObservationContext & { artifactSha256: string };
type ReferenceIssue = { source: string; targetKind: string; nativeId: number };
export type CoverageInput = {
  buildId: string;
  runId: string;
  inventory: WorldInventory;
  npcProducers: NpcProducers;
  worldSources: WorldSources;
  placementRoles: { value: PlacementRoles; artifactSha256: string };
  observations: Record<"world-inventory" | "npc-producers" | "world-sources", Observation>;
  validation: {
    artifactSha256: string;
    inventoryDiagnostics: { kind: string; sourceFieldPath: string; detail: string }[];
    unresolved: ReferenceIssue[];
    unset: ReferenceIssue[];
  };
};

export function createCoverageLedger(input: CoverageInput): CoverageLedger {
  const roles = input.placementRoles.value;
  if (roles.buildId !== input.buildId) throw new Error("Placement role coverage requires the same game build.");
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
  artifacts["placement-roles"] = { path: "placement-roles.json", sha256: input.placementRoles.artifactSha256 };
  const ledger: CoverageLedger = {
    schemaVersion: "compendium.coverage.v2", buildId: input.buildId, runId: input.runId,
    identityScope: "artifact observations; not persistent placement identities", discoveryClosed: false,
    artifacts, entries, diagnostics,
    summary: {
      entries: entries.length, distinctSources: sources.size, reachability, extraction, imagery,
      diagnosticOccurrences, diagnosticGroups: diagnostics.length,
      unresolvedDiagnosticSources: unresolvedSources.size, unmappedDiagnosticSources: unmappedSources.size,
      roleResolution: {
        state: roles.unplacedSources.length > 0 || roles.unresolved.length > 0 ? "blocked" : "resolved",
        artifact: "placement-roles", unplacedSources: roles.unplacedSources.length, issueOccurrences: roles.unresolved.length,
      },
      completeReleaseEligible: false,
      reason: "This extraction observes loaded content. Full-build discovery, traversal, source classification, and project-owned imagery are not complete.",
    },
  };
  Assert(CoverageLedgerSchema, ledger);
  return ledger;
}
