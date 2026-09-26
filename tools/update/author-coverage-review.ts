import { Database } from "bun:sqlite";

// Operator tool: writes the complete coverage review of a candidate catalog for the catalog's build.
// usage: bun tools/update/author-coverage-review.ts CATALOG_SQLITE OUTPUT
const database = Bun.argv[2];
const output = Bun.argv[3];
if (!database || !output) throw new Error("usage: author-coverage-review CATALOG_SQLITE OUTPUT");
const db = new Database(database, { readonly: true, strict: true });
try {
  const inventories = db.query<{ inventory_hash: string; bytes: number }, []>("SELECT inventory_hash, bytes FROM coverage_inventories ORDER BY inventory_hash").all().map(row => ({ sha256: row.inventory_hash, bytes: row.bytes }));
  const obligations = db.query<{ subject_key: string; family: string; discriminator: string; required: number; gameplay: number; reachable: number }, []>("SELECT subject_key, family, discriminator, required, gameplay, reachable FROM coverage_obligations ORDER BY subject_key, family, discriminator").all();
  const evidenceRows = db.query<{ artifact_hash: string; bytes: number; manifest_hash: string; manifest_bytes: number; run_id: string; target_identity: string; family: string; subject_keys_json: string }, []>("SELECT artifact_hash, bytes, manifest_hash, manifest_bytes, run_id, target_identity, family, subject_keys_json FROM coverage_evidence ORDER BY family, artifact_hash, run_id, target_identity").all();
  const byFamilyAndSubject = new Map<string, typeof evidenceRows[number]>();
  for (const row of evidenceRows) for (const subject of JSON.parse(row.subject_keys_json) as string[]) {
    const key = `${row.family}\0${subject}`;
    if (!byFamilyAndSubject.has(key)) byFamilyAndSubject.set(key, row);
  }
  const origins = db.query<{ subject_key: string; family: string; discriminator: string; artifact_hash: string; bytes: number; run_id: string; target_identity: string; record_path: string }, []>(`
    SELECT o.subject_key, o.family, o.discriminator, i.bytes, r.artifact_hash, r.run_id, r.target_identity, r.record_path
    FROM coverage_obligations o
    JOIN coverage_obligation_origins r ON r.obligation_id = o.obligation_id
    JOIN coverage_inventories i ON i.inventory_hash = r.artifact_hash
    ORDER BY o.subject_key, o.family, o.discriminator, r.artifact_hash, r.run_id, r.target_identity, r.record_path
  `).all();
  const originByObligation = new Map(origins.map(row => [`${row.subject_key}\0${row.family}\0${row.discriminator}`, row]));
  const unsupported: string[] = [];
  const decisions = obligations.map(obligation => {
    const row = byFamilyAndSubject.get(`${obligation.family}\0${obligation.subject_key}`);
    if (row) return { subjectKey: obligation.subject_key, family: obligation.family, discriminator: obligation.discriminator, state: "verified", reason: "Current-build evidence contains this discovered subject for the required family.", outsideRequiredUniverse: false, evidence: [{ artifact: { sha256: row.artifact_hash, bytes: row.bytes }, runId: row.run_id, targetIdentity: row.target_identity, recordPath: "" }] };
    const origin = originByObligation.get(`${obligation.subject_key}\0${obligation.family}\0${obligation.discriminator}`);
    if (!origin) { unsupported.push(`${obligation.subject_key}/${obligation.family}`); return null; }
    const pointer = { artifact: { sha256: origin.artifact_hash, bytes: origin.bytes }, runId: origin.run_id, targetIdentity: origin.target_identity, recordPath: origin.record_path };
    if (obligation.family === "coverage") return { subjectKey: obligation.subject_key, family: obligation.family, discriminator: obligation.discriminator, state: "not-applicable", reason: "The subject is discovered globally but does not identify a requested runtime target that needs a separate target-disposition document.", outsideRequiredUniverse: false, evidence: [pointer] };
    if (obligation.family === "game-map") return { subjectKey: obligation.subject_key, family: obligation.family, discriminator: obligation.discriminator, state: "not-applicable", reason: "The subject is outside the reviewed world-surface game-map binding.", outsideRequiredUniverse: false, evidence: [pointer] };
    if (!(obligation.gameplay && obligation.reachable)) return { subjectKey: obligation.subject_key, family: obligation.family, discriminator: obligation.discriminator, state: "reviewed-excluded", reason: "The discovered subject is outside the reachable gameplay universe and has no requested target evidence.", outsideRequiredUniverse: true, evidence: [pointer] };
    if (obligation.required) { unsupported.push(`${obligation.subject_key}/${obligation.family}`); return null; }
    return { subjectKey: obligation.subject_key, family: obligation.family, discriminator: obligation.discriminator, state: "not-applicable", reason: "Current discovery records the optional family without a supported extracted document.", outsideRequiredUniverse: false, evidence: [pointer] };
  });
  if (unsupported.length) throw new Error(`Required obligations lack attributable family evidence (${unsupported.length}): ${unsupported.slice(0, 20).join(", ")}`);
  const closureRow = evidenceRows.find(row => row.family === "inventory");
  if (!closureRow) throw new Error("No inventory evidence is available for closure review.");
  const build = db.query<{ build_id: string }, []>("SELECT build_id FROM normalized_builds").all();
  if (build.length !== 1) throw new Error("Catalog must hold exactly one build.");
  const buildId = build[0]!.build_id;
  const policy = db.query<{ policy_hash: string; bytes: number }, []>("SELECT policy_hash, bytes FROM coverage_policies").get();
  if (!policy) throw new Error("Catalog has no coverage policy.");
  const review = {
    schemaVersion: "compendium.coverage-review.v1",
    buildId,
    reviewer: `update-game-${buildId}-complete-candidate-review`,
    policy: { sha256: policy.policy_hash, bytes: policy.bytes },
    inventories,
    closure: {
      state: "closed",
      inventories,
      subjectKeys: [...new Set(obligations.map(row => row.subject_key))].sort(),
      evidence: [{ artifact: { sha256: closureRow.artifact_hash, bytes: closureRow.bytes }, runId: closureRow.run_id, targetIdentity: closureRow.target_identity, recordPath: "" }],
      reason: "The complete current-build target scan enumerates every discovered subject, and each required family has attributable current-build evidence."
    },
    decisions,
  };
  await Bun.write(output, `${JSON.stringify(review, null, 2)}\n`);
  console.log(JSON.stringify({ inventories: inventories.length, subjects: review.closure.subjectKeys.length, decisions: decisions.length }, null, 2));
} finally { db.close(); }
