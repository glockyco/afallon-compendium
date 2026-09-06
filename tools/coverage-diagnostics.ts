import type { CoverageDiagnostic, CoverageEntry, CoverageInput } from "./coverage";

type Artifact = CoverageDiagnostic["evidence"][number]["artifact"];
type Category = CoverageDiagnostic["category"];
type EntryMap = Map<string, CoverageEntry[]>;
type EntryIndexes = { native: Map<Artifact, EntryMap>; raw: Map<Artifact, EntryMap> };

type GroupState = {
  sourceKey: string;
  issueType: string;
  category: Category;
  occurrences: number;
  sourceEntryIds: Set<string>;
  details: Map<string, number>;
  evidence: Map<string, { artifact: Artifact; collection: string; ranges: { start: number; end: number }[] }>;
};

type Match = {
  entries: CoverageEntry[];
  prefixLength: number;
};

/* Native diagnostic kinds are classified only when the extractor gives them a known meaning. */
const nativeCategories: Record<string, Category> = {
  worldPositionSceneDestination: "unverified-semantics",
  "unverified-scene-semantics": "unverified-semantics",
  npcProducerFamily: "unverified-semantics",
  npcProducerRequirementsTemplate: "unverified-semantics",
  activeRequirementTarget: "unverified-semantics",
  activeRequirementTemplate: "unverified-semantics",
  interactableActionReference: "unresolved-reference",
  randomActivatorTarget: "unresolved-reference",
  unsupportedInteractableAction: "unsupported",
  unsupportedWorldService: "unsupported",
  unsupportedWorldSourceFamily: "unsupported",
};

const npcReferenceAliases: readonly [string, string][] = [
  ["producer", "producers"],
  ["adventurerProducer", "adventurerProducers"],
  ["adventurerPopulationManager", "adventurerPopulationManagers"],
];

const worldReferenceRoots: Record<string, true> = {
  resourceProducers: true,
  interactions: true,
  containers: true,
  questZones: true,
  transitions: true,
  services: true,
  conditionSources: true,
  unsupportedSources: true,
  mapZones: true,
  regions: true,
};

function addIndex(index: EntryMap, path: string, ref: CoverageEntry): void {
  if (path.length === 0) return;
  const values = index.get(path);
  if (values === undefined) index.set(path, [ref]);
  else values.push(ref);
}

function buildEntryIndexes(entries: readonly CoverageEntry[]): EntryIndexes {
  const native = new Map<Artifact, EntryMap>();
  const raw = new Map<Artifact, EntryMap>();
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]!;
    let nativeMap = native.get(entry.evidence.artifact);
    if (nativeMap === undefined) {
      nativeMap = new Map();
      native.set(entry.evidence.artifact, nativeMap);
    }
    let rawMap = raw.get(entry.evidence.artifact);
    if (rawMap === undefined) {
      rawMap = new Map();
      raw.set(entry.evidence.artifact, rawMap);
    }
    addIndex(nativeMap, entry.sourceFieldPath, entry);
    addIndex(rawMap, entry.evidence.path, entry);
  }
  return { native, raw };
}

/* A prefix is valid only at a path delimiter. This prevents name or substring matches. */
function longestPrefix(index: EntryMap | undefined, path: string): Match | null {
  if (index === undefined || path.length === 0) return null;
  for (let end = path.length; end > 0; end--) {
    if (end !== path.length && path[end] !== "." && path[end] !== "[") continue;
    const entries = index.get(path.slice(0, end));
    if (entries !== undefined) return { entries, prefixLength: end };
  }
  return null;
}

function nativeMatch(indexes: EntryIndexes, artifact: Artifact, sourceFieldPath: string): Match | null {
  return longestPrefix(indexes.native.get(artifact), sourceFieldPath);
}

function rawMatch(indexes: EntryIndexes, artifact: Artifact, rawPath: string): Match | null {
  return longestPrefix(indexes.raw.get(artifact), rawPath);
}

function aliasNpcPath(source: string): string | null {
  for (const [singular, plural] of npcReferenceAliases) {
    if (source === singular || source.startsWith(`${singular}[`)) return `${plural}${source.slice(singular.length)}`;
  }
  return null;
}

function referenceMatches(indexes: EntryIndexes, source: string): Match[] {
  const matches: Match[] = [];
  if (source.startsWith("observations.")) {
    const match = rawMatch(indexes, "npc-producers", source);
    if (match !== null) matches.push(match);
  }
  const npcAlias = aliasNpcPath(source);
  if (npcAlias !== null) {
    const match = rawMatch(indexes, "npc-producers", npcAlias);
    if (match !== null) matches.push(match);
  }

  const root = /^[^.\[]+/.exec(source)?.[0] ?? source;
  if (worldReferenceRoots[root] === true) {
    const match = rawMatch(indexes, "world-sources", source);
    if (match !== null) matches.push(match);
  }

  if (source.startsWith("requirementTemplate:")) {
    const templateSource = source.slice("requirementTemplate:".length);
    const match = nativeMatch(indexes, "npc-producers", templateSource);
    if (match !== null) matches.push(match);
  } else {
    const npcMatch = nativeMatch(indexes, "npc-producers", source);
    if (npcMatch !== null) matches.push(npcMatch);
    const worldMatch = nativeMatch(indexes, "world-sources", source);
    if (worldMatch !== null) matches.push(worldMatch);
  }
  return matches;
}

function bestMatch(matches: readonly Match[]): Match | null {
  let best: Match | null = null;
  for (const match of matches) {
    if (best === null || match.prefixLength > best.prefixLength) best = match;
  }
  return best;
}

function fallbackSourceKey(artifact: Artifact, source: string, issueType: string): string {
  const exactSource = source.length > 0 ? source : `unmapped:${issueType}`;
  return `${artifact}:${exactSource}`;
}

function resolvedSource(
  indexes: EntryIndexes,
  artifact: Artifact,
  source: string,
  issueType: string,
): { sourceKey: string; entries: CoverageEntry[] } {
  const match = artifact === "validation" ? bestMatch(referenceMatches(indexes, source)) : nativeMatch(indexes, artifact, source);
  if (match === null || match.entries.length === 0) {
    return { sourceKey: fallbackSourceKey(artifact, source, issueType), entries: [] };
  }
  return { sourceKey: match.entries[0]!.sourceKey, entries: match.entries };
}

type WorldDiagnostic = CoverageInput["worldSources"]["unresolved"][number];

function worldDiagnosticSource(row: WorldDiagnostic, index: number): string {
  if (row.source !== undefined) return `${row.source.source.componentType}[${row.source.source.observationIndex}]`;
  if (row.sourceFieldPath !== undefined && row.sourceFieldPath.length > 0) return row.sourceFieldPath;
  return `unmapped:worldSources.unresolved[${index}]`;
}

function addEvidence(group: GroupState, artifact: Artifact, collection: string, index: number): void {
  const key = `${artifact}\u0000${collection}`;
  let evidence = group.evidence.get(key);
  if (evidence === undefined) {
    evidence = { artifact, collection, ranges: [] };
    group.evidence.set(key, evidence);
  }
  const previous = evidence.ranges[evidence.ranges.length - 1];
  if (previous !== undefined && previous.end + 1 >= index) previous.end = index;
  else evidence.ranges.push({ start: index, end: index });
}

function addOccurrence(
  groups: Map<string, GroupState>,
  indexes: EntryIndexes,
  matchArtifact: Artifact,
  evidenceArtifact: Artifact,
  collection: string,
  rowIndex: number,
  issueType: string,
  category: Category,
  source: string,
  detail: string,
): void {
  const resolved = resolvedSource(indexes, matchArtifact, source, issueType);
  const groupKey = `${resolved.sourceKey}\u0000${issueType}\u0000${category}`;

  let group = groups.get(groupKey);
  if (group === undefined) {
    group = {
      sourceKey: resolved.sourceKey,
      issueType,
      category,
      occurrences: 0,
      sourceEntryIds: new Set(),
      details: new Map(),
      evidence: new Map(),
    };
    groups.set(groupKey, group);
  }
  group.occurrences++;
  group.details.set(detail, (group.details.get(detail) ?? 0) + 1);
  for (const entry of resolved.entries) {
    group.sourceEntryIds.add(entry.id);
  }
  addEvidence(group, evidenceArtifact, collection, rowIndex);
}

function finalize(groups: Iterable<GroupState>): CoverageDiagnostic[] {
  const diagnostics: CoverageDiagnostic[] = [];
  for (const group of groups) {
    const evidence = [...group.evidence.values()]
      .sort((left, right) => left.artifact.localeCompare(right.artifact) || left.collection.localeCompare(right.collection))
      .map((value) => ({ artifact: value.artifact, collection: value.collection, ranges: value.ranges }));
    const details = [...group.details.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([detail, occurrences]) => ({ detail, occurrences }));
    diagnostics.push({
      sourceKey: group.sourceKey,
      issueType: group.issueType,
      category: group.category,
      occurrences: group.occurrences,
      sourceEntryIds: [...group.sourceEntryIds].sort(),
      sourceResolution: group.sourceEntryIds.size > 0 ? "entry" : "unmapped",
      details,
      evidence,
    });
  }
  return diagnostics;
}

export function buildCoverageDiagnostics(input: CoverageInput, entries: readonly CoverageEntry[]): CoverageDiagnostic[] {
  const indexes = buildEntryIndexes(entries);
  const groups = new Map<string, GroupState>();

  for (let index = 0; index < input.validation.inventoryDiagnostics.length; index++) {
    const row = input.validation.inventoryDiagnostics[index]!;
    const category = nativeCategories[row.kind] ?? "unclassified";
    const source = row.sourceFieldPath.length > 0 ? row.sourceFieldPath : `unmapped:worldInventory.diagnostics[${index}]`;
    addOccurrence(groups, indexes, "world-inventory", "validation", "worldInventory.diagnostics", index, row.kind, category, source, row.detail.length > 0 ? row.detail : "No detail supplied.");
  }
  for (let index = 0; index < input.npcProducers.unresolved.length; index++) {
    const row = input.npcProducers.unresolved[index]!;
    const category = nativeCategories[row.kind] ?? "unclassified";
    const source = row.sourceFieldPath.length > 0 ? row.sourceFieldPath : `unmapped:npc-producers.unresolved[${index}]`;
    addOccurrence(groups, indexes, "npc-producers", "npc-producers", "unresolved", index, row.kind, category, source, row.detail.length > 0 ? row.detail : "No detail supplied.");
  }
  for (let index = 0; index < input.worldSources.unresolved.length; index++) {
    const row = input.worldSources.unresolved[index]!;
    const category = nativeCategories[row.kind] ?? "unclassified";
    addOccurrence(groups, indexes, "world-sources", "world-sources", "unresolved", index, row.kind, category, worldDiagnosticSource(row, index), row.detail.length > 0 ? row.detail : "No detail supplied.");
  }
  for (let index = 0; index < input.validation.unresolved.length; index++) {
    const row = input.validation.unresolved[index]!;
    const issueType = `reference:${row.targetKind}`;
    addOccurrence(groups, indexes, "validation", "validation", "unresolved", index, issueType, "unresolved-reference", row.source, `targetKind=${row.targetKind}; nativeId=${row.nativeId}`);
  }
  for (let index = 0; index < input.validation.unset.length; index++) {
    const row = input.validation.unset[index]!;
    const issueType = `reference:${row.targetKind}`;
    addOccurrence(groups, indexes, "validation", "validation", "unset", index, issueType, "unset", row.source, `targetKind=${row.targetKind}; nativeId=${row.nativeId}`);
  }

  return finalize(groups.values());
}
