import type { Database } from "bun:sqlite";
import { canonicalJson, canonicalJsonSha256, decodeContract, type ContentIdentity } from "@afallon/contracts";
import {
  CoveragePolicySchema, CoverageReviewSchema, REQUIRED_GAMEPLAY_COVERAGE_FAMILIES,
  type CoverageAccounting, type CoverageAccountingInput, type CoverageDisposition,
  type CoverageDispositionState, type CoverageEvidencePointer, type CoverageFamily,
  type CoverageObligation, type CoveragePolicy, type VerifiedCoverageEvidence, type VerifiedCoverageInventory,
} from "@afallon/contracts/catalog";
import type { WorldInventory } from "@afallon/contracts";

export const COVERAGE_ACCOUNTING_SQL = `
CREATE TABLE IF NOT EXISTS coverage_policies (
  policy_hash TEXT PRIMARY KEY NOT NULL CHECK(length(policy_hash) = 64),
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
  document_json TEXT NOT NULL CHECK(json_valid(document_json))
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_reviews (
  review_hash TEXT PRIMARY KEY NOT NULL CHECK(length(review_hash) = 64),
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  build_id TEXT NOT NULL UNIQUE REFERENCES normalized_builds(build_id),
  policy_hash TEXT NOT NULL REFERENCES coverage_policies(policy_hash),
  closure_identity TEXT NOT NULL CHECK(length(closure_identity) = 64),
  closure_valid INTEGER NOT NULL CHECK(closure_valid IN (0,1)),
  closure_failures_json TEXT NOT NULL CHECK(json_valid(closure_failures_json)),
  document_json TEXT NOT NULL CHECK(json_valid(document_json))
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_evidence (
  artifact_hash TEXT NOT NULL CHECK(length(artifact_hash) = 64),
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
  manifest_hash TEXT NOT NULL CHECK(length(manifest_hash) = 64),
  manifest_bytes INTEGER NOT NULL CHECK(manifest_bytes >= 0),
  run_id TEXT NOT NULL,
  target_identity TEXT NOT NULL,
  family TEXT NOT NULL,
  subject_keys_json TEXT NOT NULL CHECK(json_valid(subject_keys_json)),
  PRIMARY KEY(artifact_hash,run_id,target_identity)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_inventories (
  inventory_hash TEXT PRIMARY KEY NOT NULL CHECK(length(inventory_hash) = 64),
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  build_id TEXT NOT NULL REFERENCES normalized_builds(build_id)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_subjects (
  build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
  subject_key TEXT NOT NULL,
  gameplay INTEGER NOT NULL CHECK(gameplay IN (0,1)),
  reachable INTEGER NOT NULL CHECK(reachable IN (0,1)),
  families_json TEXT NOT NULL CHECK(json_valid(families_json)),
  PRIMARY KEY(build_id,subject_key)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_inventory_subjects (
  inventory_hash TEXT NOT NULL REFERENCES coverage_inventories(inventory_hash),
  build_id TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  PRIMARY KEY(inventory_hash,subject_key),
  FOREIGN KEY(build_id,subject_key) REFERENCES coverage_subjects(build_id,subject_key)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_obligations (
  obligation_id TEXT PRIMARY KEY NOT NULL CHECK(length(obligation_id) = 64),
  build_id TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  family TEXT NOT NULL,
  discriminator TEXT NOT NULL,
  required INTEGER NOT NULL CHECK(required IN (0,1)),
  gameplay INTEGER NOT NULL CHECK(gameplay IN (0,1)),
  reachable INTEGER NOT NULL CHECK(reachable IN (0,1)),
  UNIQUE(build_id,subject_key,family,discriminator),
  FOREIGN KEY(build_id,subject_key) REFERENCES coverage_subjects(build_id,subject_key)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_obligation_origins (
  obligation_id TEXT NOT NULL REFERENCES coverage_obligations(obligation_id),
  artifact_hash TEXT NOT NULL,
  run_id TEXT NOT NULL,
  target_identity TEXT NOT NULL,
  record_path TEXT NOT NULL,
  PRIMARY KEY(obligation_id,artifact_hash,run_id,target_identity,record_path),
  FOREIGN KEY(artifact_hash,run_id,target_identity) REFERENCES coverage_evidence(artifact_hash,run_id,target_identity)
) STRICT;
CREATE TABLE IF NOT EXISTS coverage_dispositions (
  disposition_id TEXT PRIMARY KEY NOT NULL CHECK(length(disposition_id) = 64),
  obligation_id TEXT NOT NULL REFERENCES coverage_obligations(obligation_id),
  review_hash TEXT NOT NULL REFERENCES coverage_reviews(review_hash),
  state TEXT NOT NULL CHECK(state IN ('verified','not-applicable','reviewed-excluded','unsupported','unreachable','failed','not-attempted')),
  reason TEXT NOT NULL,
  accepted INTEGER NOT NULL CHECK(accepted IN (0,1)),
  effective INTEGER NOT NULL CHECK(effective IN (0,1)),
  outside_required_universe INTEGER NOT NULL CHECK(outside_required_universe IN (0,1))
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS coverage_effective_disposition ON coverage_dispositions(obligation_id) WHERE effective = 1;
CREATE TABLE IF NOT EXISTS coverage_disposition_evidence (
  disposition_id TEXT NOT NULL REFERENCES coverage_dispositions(disposition_id),
  artifact_hash TEXT NOT NULL,
  run_id TEXT NOT NULL,
  target_identity TEXT NOT NULL,
  record_path TEXT NOT NULL,
  PRIMARY KEY(disposition_id,artifact_hash,run_id,target_identity,record_path),
  FOREIGN KEY(artifact_hash,run_id,target_identity) REFERENCES coverage_evidence(artifact_hash,run_id,target_identity)
) STRICT;
`;

export interface CoverageInventorySubject {
  subjectKey: string;
  families: CoverageFamily[];
  gameplay: boolean;
  reachable: boolean;
  recordPath: string;
  state: CoverageDispositionState;
}

const sceneFamilies: CoverageFamily[] = [...REQUIRED_GAMEPLAY_COVERAGE_FAMILIES, "capture"];
const sourceFamilies: CoverageFamily[] = REQUIRED_GAMEPLAY_COVERAGE_FAMILIES.filter((family) => family !== "game-map");
const refKey = (reference: ContentIdentity): string => `${reference.sha256}:${reference.bytes}`;
const evidenceKey = (evidence: Pick<VerifiedCoverageEvidence, "reference" | "runId" | "targetIdentity">): string => canonicalJson([refKey(evidence.reference), evidence.runId, evidence.targetIdentity]);
const pointerKey = (pointer: CoverageEvidencePointer): string => evidenceKey({ reference: pointer.artifact, runId: pointer.runId, targetIdentity: pointer.targetIdentity });

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function componentIdentity(owner: unknown, fallback: unknown): unknown {
  const value = record(owner);
  const scene = record(value.scene);
  return typeof value.hierarchyPath === "string" && value.hierarchyPath.length > 0
    ? [scene.path, value.hierarchyNodes ?? value.hierarchyPath, value.runtimeType]
    : [value.runtimeType ?? value.nativeType ?? null, fallback];
}

function inventoryDiscrepancies(inventory: WorldInventory): string[] {
  const actual: WorldInventory["exportedTotals"] = {
    buildScenes: inventory.buildScenes.length, databaseScenes: inventory.databaseScenes.length,
    worldPositions: inventory.referencedDestinations.filter((row) => row.destinationType === "worldPosition").length,
    gameSceneStartPositionReferences: inventory.referencedDestinations.filter((row) => row.destinationType === "gameScene.startPositionID").length,
    taskSceneReferences: inventory.referencedDestinations.filter((row) => row.destinationType === "task.sceneName").length,
    loadedScenes: inventory.loadedScenes.length, addressableSources: inventory.addressableSources.length,
    loadedTransitions: inventory.transitions.length, referencedDestinations: inventory.referencedDestinations.length,
    componentFamilies: inventory.componentFamilies.length, behaviourTypes: inventory.behaviourTypes.length,
    behaviourComponents: inventory.behaviourTypes.reduce((sum, row) => sum + row.includeInactiveCount, 0),
  };
  const discrepancies = new Set<string>((Object.keys(actual) as (keyof typeof actual)[]).filter((key) => inventory.sourceTotals[key] < 0 || inventory.sourceTotals[key] !== actual[key] || inventory.exportedTotals[key] !== actual[key]));
  if (inventory.runtime.buildSceneCount !== actual.buildScenes) discrepancies.add("buildScenes");
  if (inventory.runtime.loadedSceneCount !== actual.loadedScenes || !inventory.loadedScenes.some((row) => row.scene.path === inventory.coverage.activeScene.path && row.scene.handle === inventory.coverage.activeScene.handle)) discrepancies.add("loadedScenes");
  return [...discrepancies];
}

/** Enumerate records, not inventory totals or a caller-selected target list. */
export function coverageInventorySubjects(inventory: WorldInventory): CoverageInventorySubject[] {
  const subjects: CoverageInventorySubject[] = [];
  const add = (collection: string, index: number, key: string, families: CoverageFamily[], gameplay: boolean, disposition: unknown) => {
    subjects.push({
      subjectKey: key, families, gameplay, reachable: disposition === "extracted" || disposition === "currently-loaded", recordPath: `/${collection}/${index}`,
      state: disposition === "unsupported" || disposition === "unreachable" || disposition === "failed" ? disposition : "not-attempted",
    });
  };
  inventory.buildScenes.forEach((value, index) => add("buildScenes", index, `build-scene:${value.path || `index:${value.buildIndex}`}`, sceneFamilies, false, value.disposition));
  inventory.databaseScenes.forEach((value, index) => add("databaseScenes", index, `database-scene:${value.nativeId ?? `source:${value.sourceKey}`}`, sceneFamilies, value.nativeId !== null, value.disposition));
  inventory.loadedScenes.forEach((value, index) => add("loadedScenes", index, `loaded-scene:${value.scene.path || `build:${value.scene.buildIndex}`}`, sceneFamilies, value.scene.currentGameSceneNativeId !== null, value.disposition));
  inventory.addressableSources.forEach((value, index) => {
    const key = value.sourceKey ?? ("assetGuid" in value ? value.assetGuid : null);
    add("addressableSources", index, `streamed-source:${key ?? canonicalJsonSha256(componentIdentity(value.owner, "unresolved-owner"))}`, sourceFamilies, false, value.disposition);
  });
  inventory.referencedDestinations.forEach((value, index) => {
    const fields = record(value);
    add("referencedDestinations", index, `destination:${canonicalJsonSha256([fields.destinationType, componentIdentity(value.owner, [fields.sourceKey ?? null, fields.ownerNativeId ?? null, fields.nativeId ?? null]), fields.targetNativeId ?? null])}`, ["relationships"], true, value.disposition);
  });
  inventory.transitions.forEach((value, index) => add("transitions", index, `transition:${canonicalJsonSha256([value.transitionType, componentIdentity(value.owner, "unresolved-owner")])}`, ["relationships"], true, value.disposition));
  inventory.componentFamilies.forEach((value, index) => add("componentFamilies", index, `component-family:${value.family}:${value.runtimeType}`, ["inventory"], false, value.disposition));
  inventory.behaviourTypes.forEach((value, index) => add("behaviourTypes", index, `behaviour-type:${value.nativeType}`, ["coverage"], false, "not-traversed"));
  inventory.unresolved.forEach((value, index) => add("unresolved", index, `inventory-diagnostic:${canonicalJsonSha256([value.kind, value.sourceFieldPath, value.ownerNativeId ?? null, value.sourceKey ?? null, value.runtimeType ?? null, value.transitionType ?? null])}`, ["coverage"], false, "unsupported"));
  for (const key of inventoryDiscrepancies(inventory)) subjects.push({ subjectKey: `inventory-total:${key}`, families: ["inventory"], gameplay: false, reachable: false, recordPath: `/sourceTotals/${key}`, state: "failed" });
  return subjects;
}

export function coverageTargetSubjects(inventory: WorldInventory, sceneNativeId: number, scenePath: string, sourceKey: string | null): string[] {
  const paths = new Set<string>();
  inventory.buildScenes.forEach((row, index) => { if (row.path === scenePath) paths.add(`/buildScenes/${index}`); });
  inventory.databaseScenes.forEach((row, index) => { if (row.nativeId === sceneNativeId) paths.add(`/databaseScenes/${index}`); });
  inventory.loadedScenes.forEach((row, index) => { if (row.scene.path === scenePath && row.scene.currentGameSceneNativeId === sceneNativeId) paths.add(`/loadedScenes/${index}`); });
  inventory.addressableSources.forEach((row, index) => { if (sourceKey !== null && row.sourceKey === sourceKey && "scene" in row.owner && row.owner.scene.currentGameSceneNativeId === sceneNativeId) paths.add(`/addressableSources/${index}`); });
  inventory.transitions.forEach((row, index) => { if ("scene" in row.owner && row.owner.scene.path === scenePath && row.owner.scene.currentGameSceneNativeId === sceneNativeId) paths.add(`/transitions/${index}`); });
  inventory.referencedDestinations.forEach((row, index) => {
    if (("scene" in row.owner && row.owner.scene.path === scenePath && row.owner.scene.currentGameSceneNativeId === sceneNativeId) || (row.destinationType === "gameScene.startPositionID" && row.ownerNativeId === sceneNativeId)) paths.add(`/referencedDestinations/${index}`);
  });
  return coverageInventorySubjects(inventory).filter((subject) => paths.has(subject.recordPath)).map((subject) => subject.subjectKey);
}

export function coverageObligationId(buildId: string, subjectKey: string, family: CoverageFamily, discriminator = "family"): string {
  return canonicalJsonSha256([buildId, subjectKey, family, discriminator]);
}

function identitiesEqual(left: readonly ContentIdentity[], right: readonly ContentIdentity[]): boolean {
  return canonicalJson([...new Set(left.map(refKey))].sort()) === canonicalJson([...new Set(right.map(refKey))].sort());
}

function resolvePointer(document: unknown, path: string): void {
  let value = document;
  if (path === "") return;
  if (!path.startsWith("/") || /~(?:[^01]|$)/.test(path)) throw new Error(`Invalid coverage evidence pointer: ${path}`);
  for (const encoded of path.slice(1).split("/")) {
    const key = encoded.replace(/~1/g, "/").replace(/~0/g, "~");
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, key)) throw new Error(`Coverage evidence pointer does not resolve: ${path}`);
    value = (value as Record<string, unknown>)[key];
  }
}

function acceptable(policy: CoveragePolicy, obligation: Pick<CoverageObligation, "gameplay" | "reachable">, state: CoverageDispositionState, outside: boolean, evidenceCount: number): boolean {
  if (!policy.acceptedDispositions.some((candidate) => candidate === state) || evidenceCount === 0) return false;
  if (state === "reviewed-excluded") return outside && !(obligation.gameplay && obligation.reachable);
  return state === "verified" || state === "not-applicable";
}

function closureIdentity(buildId: string, policy: ContentIdentity, inventories: readonly ContentIdentity[], subjects: readonly string[]): string {
  return canonicalJsonSha256(["compendium.coverage-closure.v1", buildId, policy, [...new Map(inventories.map((item) => [refKey(item), item])).values()].sort((a, b) => refKey(a).localeCompare(refKey(b))), [...new Set(subjects)].sort()]);
}

export function computeCoverageAccounting(input: CoverageAccountingInput): CoverageAccounting {
  const review = decodeContract(CoverageReviewSchema, input.review.document, { objectId: input.review.reference.sha256, target: "coverage review" });
  const policy = decodeContract(CoveragePolicySchema, input.policy.document, { objectId: input.policy.reference.sha256, target: "coverage policy" });
  if (review.buildId !== input.buildId || policy.buildId !== input.buildId) throw new Error("Coverage review and policy must match the catalog build.");
  if (refKey(review.policy) !== refKey(input.policy.reference)) throw new Error("Coverage review policy identity does not match the admitted policy.");
  if (REQUIRED_GAMEPLAY_COVERAGE_FAMILIES.some((family) => !policy.requiredFamilies.includes(family))) throw new Error("Coverage policy cannot omit required gameplay families.");
  if (policy.requiredFamilies.includes("capture") !== policy.requireCaptures) throw new Error("Coverage capture policy and required families disagree.");
  const evidence = new Map<string, VerifiedCoverageEvidence>();
  for (const item of [...input.evidence, ...input.inventories.map(({ inventory, ...item }) => ({ ...item, family: "inventory" as const, subjectKeys: coverageInventorySubjects(inventory).map((subject) => subject.subjectKey), document: inventory }))]) {
    if (item.runId.length === 0 || item.targetIdentity.length === 0) throw new Error("Coverage evidence requires an originating run and target.");
    const key = evidenceKey(item);
    const prior = evidence.get(key);
    if (prior && (refKey(prior.manifest) !== refKey(item.manifest) || prior.family !== item.family)) throw new Error("Coverage evidence has conflicting immutable attribution.");
    evidence.set(key, item);
  }
  const verifyPointers = (pointers: readonly CoverageEvidencePointer[]) => {
    const seen = new Set<string>();
    for (const pointer of pointers) {
      const admitted = evidence.get(pointerKey(pointer));
      if (!admitted) throw new Error(`Coverage evidence is not registered for run ${pointer.runId}, target ${pointer.targetIdentity}: ${pointer.artifact.sha256}`);
      resolvePointer(admitted.document, pointer.recordPath);
      const key = canonicalJson(pointer);
      if (seen.has(key)) throw new Error("Coverage evidence contains a duplicate pointer.");
      seen.add(key);
    }
  };
  verifyPointers(review.closure.evidence);
  const obligations = new Map<string, CoverageObligation>();
  const observed = new Map<string, CoverageDisposition[]>();
  for (const inventory of input.inventories) {
    for (const subject of coverageInventorySubjects(inventory.inventory)) {
      const origin: CoverageEvidencePointer = { artifact: inventory.reference, runId: inventory.runId, targetIdentity: inventory.targetIdentity, recordPath: subject.recordPath };
      for (const family of subject.families) {
        const obligationId = coverageObligationId(input.buildId, subject.subjectKey, family);
        const obligation = obligations.get(obligationId) ?? {
          obligationId, buildId: input.buildId, subjectKey: subject.subjectKey, family, discriminator: "family",
          required: policy.requiredFamilies.includes(family), gameplay: false, reachable: false, inventoryReferences: [], origins: [],
        };
        obligation.gameplay ||= subject.gameplay;
        obligation.reachable ||= subject.reachable;
        if (!obligation.inventoryReferences.some((reference) => refKey(reference) === refKey(inventory.reference))) obligation.inventoryReferences.push(inventory.reference);
        if (!obligation.origins.some((pointer) => canonicalJson(pointer) === canonicalJson(origin))) obligation.origins.push(origin);
        obligations.set(obligationId, obligation);
        const disposition: CoverageDisposition = {
          dispositionId: canonicalJsonSha256([obligationId, subject.state, origin]), obligationId, state: subject.state,
          reason: "Inventory discovery does not prove family extraction or reviewed applicability.", evidence: [origin],
          review: input.review.reference, accepted: false, effective: false, outsideRequiredUniverse: false,
        };
        const history = observed.get(obligationId) ?? [];
        if (!history.some((item) => item.dispositionId === disposition.dispositionId)) history.push(disposition);
        observed.set(obligationId, history);
      }
    }
  }
  for (const subject of input.discoveredSubjects ?? []) {
    const obligationId = coverageObligationId(input.buildId, subject.subjectKey, subject.family);
    if (obligations.has(obligationId)) throw new Error(`Duplicate discovered coverage subject ${subject.subjectKey}.`);
    if (subject.inventoryReferences.length === 0 || subject.inventoryReferences.some((reference) => !input.inventories.some((inventory) => refKey(inventory.reference) === refKey(reference)))) throw new Error(`Coverage subject ${subject.subjectKey} has no admitted inventory basis.`);
    if (subject.origins.length === 0) throw new Error(`Coverage subject ${subject.subjectKey} has no discovery evidence.`);
    verifyPointers(subject.origins);
    const obligation: CoverageObligation = { ...subject, obligationId, buildId: input.buildId, discriminator: "family", required: policy.requiredFamilies.includes(subject.family) };
    obligations.set(obligationId, obligation);
    observed.set(obligationId, [{ dispositionId: canonicalJsonSha256([obligationId, "not-attempted", subject.origins]), obligationId, state: "not-attempted", reason: "The discovered placement exclusion requires an explicit coverage review.", evidence: subject.origins, review: input.review.reference, accepted: false, effective: false, outsideRequiredUniverse: false }]);
  }
  const decisions = new Map<string, CoverageDisposition>();
  for (const decision of review.decisions) {
    const id = coverageObligationId(input.buildId, decision.subjectKey, decision.family, decision.discriminator);
    const obligation = obligations.get(id);
    if (!obligation) throw new Error(`Coverage decision has no discovered obligation: ${decision.subjectKey}/${decision.family}/${decision.discriminator}`);
    if (decisions.has(id)) throw new Error(`Coverage review has duplicate effective dispositions: ${id}`);
    verifyPointers(decision.evidence);
    if (decision.state !== "not-attempted" && decision.evidence.length === 0) throw new Error(`Coverage disposition requires attributable evidence: ${id}`);
    if (decision.state === "verified" && !decision.evidence.some((pointer) => evidence.get(pointerKey(pointer))?.family === decision.family)) throw new Error(`Verified coverage has no evidence for family ${decision.family}: ${id}`);
    decisions.set(id, {
      dispositionId: canonicalJsonSha256([id, input.review.reference, decision]), obligationId: id, state: decision.state,
      reason: decision.reason, evidence: decision.evidence, review: input.review.reference,
      accepted: acceptable(policy, obligation, decision.state, decision.outsideRequiredUniverse, decision.evidence.length) && (decision.state !== "verified" || decision.evidence.some((pointer) => { const item = evidence.get(pointerKey(pointer)); return item?.family === decision.family && item.subjectKeys.includes(obligation.subjectKey); })),
      effective: true, outsideRequiredUniverse: decision.outsideRequiredUniverse,
    });
  }
  const dispositions: CoverageDisposition[] = [];
  const priority: CoverageDispositionState[] = ["failed", "unreachable", "unsupported", "not-attempted"];
  for (const [id, history] of observed) {
    const effective = decisions.get(id);
    history.sort((a, b) => priority.indexOf(a.state) - priority.indexOf(b.state) || a.dispositionId.localeCompare(b.dispositionId));
    if (!effective && history[0]) history[0].effective = true;
    dispositions.push(...history);
    if (effective) dispositions.push(effective);
  }
  const inventories = [...new Map(input.inventories.map((item) => [refKey(item.reference), item.reference])).values()];
  const subjectKeys = [...new Set([...obligations.values()].map((item) => item.subjectKey))].sort();
  const failures: string[] = [];
  for (const inventory of input.inventories) {
    const discrepancies = inventoryDiscrepancies(inventory.inventory);
    if (discrepancies.length > 0) failures.push(`Inventory ${inventory.reference.sha256} has incomplete enumeration: ${discrepancies.join(", ")}.`);
  }
  if (inventories.length === 0 || subjectKeys.length === 0) failures.push("Discovery has no registered nonempty inventory.");
  if (!identitiesEqual(review.inventories, inventories)) failures.push("Reviewed inventories do not match the admitted inventory identities.");
  if (!identitiesEqual(review.closure.inventories, inventories)) failures.push("Discovery closure has stale inventory identities.");
  if (canonicalJson([...review.closure.subjectKeys].sort()) !== canonicalJson(subjectKeys)) failures.push("Discovery closure does not account for every discovered subject.");
  if (review.closure.state !== "closed") failures.push("Discovery closure remains open.");
  if (review.closure.evidence.length === 0) failures.push("Discovery closure has no attributable review evidence.");
  return {
    buildId: input.buildId, review: input.review, policy: input.policy, inventories: [...input.inventories], evidence: [...evidence.values()],
    obligations: [...obligations.values()].sort((a, b) => a.obligationId.localeCompare(b.obligationId)),
    dispositions: dispositions.sort((a, b) => a.dispositionId.localeCompare(b.dispositionId)),
    closureIdentity: closureIdentity(input.buildId, input.policy.reference, inventories, subjectKeys),
    closureValid: failures.length === 0, closureFailures: failures,
  };
}

/** The catalog assembler owns the transaction that contains these inserts. */
export function insertCoverageAccounting(db: Database, accounting: CoverageAccounting): void {
  db.exec(COVERAGE_ACCOUNTING_SQL);
  db.query("INSERT INTO coverage_policies VALUES (?, ?, ?, ?)").run(accounting.policy.reference.sha256, accounting.policy.reference.bytes, accounting.buildId, canonicalJson(accounting.policy.document));
  db.query("INSERT INTO coverage_reviews VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(accounting.review.reference.sha256, accounting.review.reference.bytes, accounting.buildId, accounting.policy.reference.sha256, accounting.closureIdentity, Number(accounting.closureValid), canonicalJson(accounting.closureFailures), canonicalJson(accounting.review.document));
  const addEvidence = db.query("INSERT INTO coverage_evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const item of accounting.evidence) addEvidence.run(item.reference.sha256, item.reference.bytes, accounting.buildId, item.manifest.sha256, item.manifest.bytes, item.runId, item.targetIdentity, item.family, canonicalJson([...item.subjectKeys].sort()));
  const addInventory = db.query("INSERT OR IGNORE INTO coverage_inventories VALUES (?, ?, ?)");
  for (const item of accounting.inventories) addInventory.run(item.reference.sha256, item.reference.bytes, accounting.buildId);
  const subjects = new Map<string, { gameplay: boolean; reachable: boolean; families: Set<CoverageFamily> }>();
  for (const obligation of accounting.obligations) {
    const subject = subjects.get(obligation.subjectKey) ?? { gameplay: false, reachable: false, families: new Set<CoverageFamily>() };
    subject.gameplay ||= obligation.gameplay;
    subject.reachable ||= obligation.reachable;
    subject.families.add(obligation.family);
    subjects.set(obligation.subjectKey, subject);
  }
  const addSubject = db.query("INSERT INTO coverage_subjects VALUES (?, ?, ?, ?, ?)");
  for (const [key, subject] of subjects) addSubject.run(accounting.buildId, key, Number(subject.gameplay), Number(subject.reachable), canonicalJson([...subject.families].sort()));
  const addMembership = db.query("INSERT OR IGNORE INTO coverage_inventory_subjects VALUES (?, ?, ?)");
  const addObligation = db.query("INSERT INTO coverage_obligations VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const addOrigin = db.query("INSERT INTO coverage_obligation_origins VALUES (?, ?, ?, ?, ?)");
  for (const obligation of accounting.obligations) {
    for (const reference of obligation.inventoryReferences) addMembership.run(reference.sha256, accounting.buildId, obligation.subjectKey);
    addObligation.run(obligation.obligationId, obligation.buildId, obligation.subjectKey, obligation.family, obligation.discriminator, Number(obligation.required), Number(obligation.gameplay), Number(obligation.reachable));
    for (const origin of obligation.origins) addOrigin.run(obligation.obligationId, origin.artifact.sha256, origin.runId, origin.targetIdentity, origin.recordPath);
  }
  const addDisposition = db.query("INSERT INTO coverage_dispositions VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const addDispositionEvidence = db.query("INSERT INTO coverage_disposition_evidence VALUES (?, ?, ?, ?, ?)");
  for (const disposition of accounting.dispositions) {
    addDisposition.run(disposition.dispositionId, disposition.obligationId, disposition.review.sha256, disposition.state, disposition.reason, Number(disposition.accepted), Number(disposition.effective), Number(disposition.outsideRequiredUniverse));
    for (const pointer of disposition.evidence) addDispositionEvidence.run(disposition.dispositionId, pointer.artifact.sha256, pointer.runId, pointer.targetIdentity, pointer.recordPath);
  }
}

export interface CoverageAccountingSummary {
  hasCoverageBasis: boolean;
  closureValid: boolean;
  closureFailures: string[];
  integrityFailures: string[];
  obligationCount: number;
  requiredObligationCount: number;
  unsatisfiedObligationCount: number;
  optionalUnsatisfiedObligationCount: number;
  reviewedExclusionCount: number;
  dispositionCounts: Record<CoverageDispositionState, number>;
}

export function readCoverageAccountingSummary(db: Database, buildId: string): CoverageAccountingSummary {
  const summary: CoverageAccountingSummary = {
    hasCoverageBasis: false, closureValid: false, closureFailures: [], integrityFailures: [], obligationCount: 0,
    requiredObligationCount: 0, unsatisfiedObligationCount: 0, optionalUnsatisfiedObligationCount: 0, reviewedExclusionCount: 0,
    dispositionCounts: { verified: 0, "not-applicable": 0, "reviewed-excluded": 0, unsupported: 0, unreachable: 0, failed: 0, "not-attempted": 0 },
  };
  if (!db.query("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'coverage_reviews'").get()) {
    summary.closureFailures.push("Catalog has no positive coverage accounting.");
    return summary;
  }
  const reviewRow = db.query<{ review_hash: string; policy_hash: string; closure_identity: string; closure_valid: number; closure_failures_json: string; document_json: string }, [string]>("SELECT * FROM coverage_reviews WHERE build_id = ?").get(buildId);
  if (!reviewRow) {
    summary.closureFailures.push("Catalog has no build-scoped coverage review.");
    return summary;
  }
  try {
    const policyRow = db.query<{ bytes: number; document_json: string }, [string]>("SELECT bytes, document_json FROM coverage_policies WHERE policy_hash = ?").get(reviewRow.policy_hash);
    if (!policyRow) throw new Error("Coverage review has no policy.");
    const policy = decodeContract(CoveragePolicySchema, JSON.parse(policyRow.document_json), { objectId: reviewRow.policy_hash, target: "catalog coverage policy" });
    const review = decodeContract(CoverageReviewSchema, JSON.parse(reviewRow.document_json), { objectId: reviewRow.review_hash, target: "catalog coverage review" });
    const inventories = db.query<{ sha256: string; bytes: number }, [string]>("SELECT inventory_hash AS sha256, bytes FROM coverage_inventories WHERE build_id = ? ORDER BY inventory_hash").all(buildId);
    const subjects = db.query<{ subject_key: string; families_json: string; gameplay: number; reachable: number }, [string]>("SELECT subject_key, families_json, gameplay, reachable FROM coverage_subjects WHERE build_id = ? ORDER BY subject_key").all(buildId);
    const subjectKeys = subjects.map((item) => item.subject_key);
    const registeredInventoryHashes = db.query<{ sha256: string }, [string]>("SELECT DISTINCT sha256 FROM source_manifests WHERE build_id = ? AND kind IN ('inventory', 'world-inventory', 'compendium.world-inventory.v2') ORDER BY sha256").all(buildId).map((item) => item.sha256);
    if (canonicalJson(registeredInventoryHashes) !== canonicalJson(inventories.map((item) => item.sha256))) summary.closureFailures.push("Coverage does not include every registered inventory.");
    const policyReference = { sha256: reviewRow.policy_hash, bytes: policyRow.bytes };
    if (policy.buildId !== buildId || review.buildId !== buildId || refKey(review.policy) !== refKey(policyReference)) throw new Error("Coverage identities do not match the catalog build and policy.");
    if (REQUIRED_GAMEPLAY_COVERAGE_FAMILIES.some((family) => !policy.requiredFamilies.includes(family)) || policy.requiredFamilies.includes("capture") !== policy.requireCaptures) throw new Error("Coverage policy omits required gameplay or capture obligations.");
    if (reviewRow.closure_identity !== closureIdentity(buildId, policyReference, inventories, subjectKeys)) summary.closureFailures.push("Catalog discovery closure identity is stale.");
    if (!identitiesEqual(review.inventories, inventories) || !identitiesEqual(review.closure.inventories, inventories)) summary.closureFailures.push("Catalog inventory identities differ from the review.");
    if (canonicalJson([...review.closure.subjectKeys].sort()) !== canonicalJson(subjectKeys)) summary.closureFailures.push("Catalog discovery subjects differ from the review.");
    if (review.closure.state !== "closed" || review.closure.evidence.length === 0) summary.closureFailures.push("Catalog discovery closure is not supported by review evidence.");
    if (reviewRow.closure_valid !== 1) summary.closureFailures.push(...JSON.parse(reviewRow.closure_failures_json) as string[]);
    summary.hasCoverageBasis = inventories.length > 0 && subjects.length > 0;
    if (!summary.hasCoverageBasis) summary.closureFailures.push("Catalog has no positive discovery universe.");
    const rows = db.query<{ obligation_id: string; subject_key: string; family: CoverageFamily; discriminator: string; required: number; gameplay: number; reachable: number; state: CoverageDispositionState | null; outside_required_universe: number | null; evidence_count: number; family_evidence_count: number }, [string]>(`
      SELECT o.*, d.state, d.outside_required_universe,
        (SELECT count(*) FROM coverage_disposition_evidence e WHERE e.disposition_id = d.disposition_id) AS evidence_count,
        (SELECT count(*) FROM coverage_disposition_evidence e JOIN coverage_evidence a
          ON a.artifact_hash = e.artifact_hash AND a.run_id = e.run_id AND a.target_identity = e.target_identity
          WHERE e.disposition_id = d.disposition_id AND a.family = o.family
            AND EXISTS (SELECT 1 FROM json_each(a.subject_keys_json) s WHERE s.value = o.subject_key)) AS family_evidence_count
      FROM coverage_obligations o LEFT JOIN coverage_dispositions d ON d.obligation_id = o.obligation_id AND d.effective = 1
      WHERE o.build_id = ? ORDER BY o.obligation_id
    `).all(buildId);
    const expectedIds = new Set(subjects.flatMap((subject) => (JSON.parse(subject.families_json) as CoverageFamily[]).map((family) => coverageObligationId(buildId, subject.subject_key, family))));
    const bySubject = new Map(subjects.map((subject) => [subject.subject_key, subject]));
    for (const row of rows) {
      const subject = bySubject.get(row.subject_key);
      if (!expectedIds.delete(row.obligation_id) || row.obligation_id !== coverageObligationId(buildId, row.subject_key, row.family, row.discriminator) || row.required !== Number(policy.requiredFamilies.includes(row.family)) || row.gameplay !== subject?.gameplay || row.reachable !== subject?.reachable) summary.integrityFailures.push(`Coverage obligation identity or policy mismatch: ${row.obligation_id}`);
      summary.obligationCount++;
      const required = policy.requiredFamilies.includes(row.family);
      if (required) summary.requiredObligationCount++;
      if (row.state) summary.dispositionCounts[row.state]++;
      if (row.state === "reviewed-excluded") summary.reviewedExclusionCount++;
      const accepted = row.state !== null && (row.state !== "verified" || row.family_evidence_count > 0) && acceptable(policy, { gameplay: Boolean(row.gameplay), reachable: Boolean(row.reachable) }, row.state, row.outside_required_universe === 1, row.evidence_count);
      if (!accepted) {
        if (required) summary.unsatisfiedObligationCount++;
        else summary.optionalUnsatisfiedObligationCount++;
      }
    }
    if (expectedIds.size > 0) summary.integrityFailures.push(`Catalog is missing ${expectedIds.size} discovered obligations.`);
    if (rows.length === 0 || summary.requiredObligationCount === 0) summary.closureFailures.push("Catalog has no required positive obligations.");
    const missingOrigins = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_obligations o WHERE NOT EXISTS (SELECT 1 FROM coverage_obligation_origins r WHERE r.obligation_id = o.obligation_id)").get()?.count ?? 0);
    if (missingOrigins > 0) summary.integrityFailures.push(`Catalog has ${missingOrigins} obligations without originating evidence.`);
    const missingMembership = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_subjects s WHERE NOT EXISTS (SELECT 1 FROM coverage_inventory_subjects m WHERE m.build_id = s.build_id AND m.subject_key = s.subject_key)").get()?.count ?? 0);
    if (missingMembership > 0) summary.integrityFailures.push(`Catalog has ${missingMembership} subjects without inventory membership.`);
    summary.closureValid = summary.hasCoverageBasis && summary.closureFailures.length === 0 && summary.integrityFailures.length === 0;
  } catch (error) {
    summary.integrityFailures.push(error instanceof Error ? error.message : String(error));
  }
  return summary;
}
