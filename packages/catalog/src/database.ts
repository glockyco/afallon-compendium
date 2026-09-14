import { Database, type SQLQueryBindings } from "bun:sqlite";
import { createHash } from "node:crypto";
import { openIdentityDatabase, recordPlacementIdentities } from "./identity-store";
import type { NormalizedDatabaseInput, NormalizedEntity } from "@afallon/contracts/catalog"

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function hash(value: unknown): string {
  return createHash("sha256").update(json(value)).digest("hex");
}

export function openNormalizedDatabase(path: string): Database {
  const db = openIdentityDatabase(path);
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = DELETE;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS normalized_builds (
        build_id TEXT PRIMARY KEY NOT NULL,
        schema_version TEXT NOT NULL,
        provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS catalog_metadata (
        catalog_id TEXT PRIMARY KEY NOT NULL CHECK(length(catalog_id) = 64),
        build_id TEXT NOT NULL UNIQUE REFERENCES normalized_builds(build_id),
        schema_version TEXT NOT NULL,
        settings_json TEXT NOT NULL,
        assembler_fingerprint TEXT NOT NULL CHECK(length(assembler_fingerprint) = 64)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS source_manifests (
        source_key TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        path TEXT NOT NULL,
        sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        UNIQUE(kind, path, sha256)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS canonical_entities (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        kind TEXT NOT NULL,
        native_id INTEGER NOT NULL,
        entity_key TEXT NOT NULL,
        name TEXT,
        internal_name TEXT,
        description TEXT,
        source_key INTEGER,
        details_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        PRIMARY KEY(build_id, kind, native_id),
        UNIQUE(entity_key),
        CHECK(entity_key = kind || ':' || native_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS entity_details (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key),
        detail_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS source_details (
        detail_id TEXT PRIMARY KEY NOT NULL,
        source_id TEXT NOT NULL REFERENCES source_identities(source_id),
        placement_id TEXT NOT NULL REFERENCES placements(placement_id),
        family TEXT NOT NULL,
        data_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS patrol_paths (
        path_key TEXT PRIMARY KEY NOT NULL,
        scene_native_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        detail_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS scene_spawns (
        scene_native_id INTEGER PRIMARY KEY NOT NULL,
        detail_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS map_spaces (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        map_space_id TEXT NOT NULL,
        label TEXT NOT NULL,
        PRIMARY KEY(build_id, map_space_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS map_space_bindings (
        build_id TEXT NOT NULL,
        binding_id TEXT NOT NULL,
        map_space_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL,
        scene_path TEXT NOT NULL,
        frame_json TEXT NOT NULL,
        domain_json TEXT NOT NULL,
        PRIMARY KEY(build_id, binding_id),
        UNIQUE(build_id, scene_native_id, binding_id),
        FOREIGN KEY(build_id, map_space_id) REFERENCES map_spaces,
        FOREIGN KEY(build_id, scene_native_id) REFERENCES identity_scenes
      ) STRICT;
      CREATE TABLE IF NOT EXISTS placements (
        placement_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        scene_native_id INTEGER NOT NULL,
        scene_path TEXT NOT NULL,
        map_space_id TEXT,
        world_x REAL NOT NULL,
        world_y REAL NOT NULL,
        world_z REAL NOT NULL,
        map_x REAL,
        map_y REAL,
        label TEXT,
        shape_json TEXT,
        provenance_json TEXT NOT NULL,
        FOREIGN KEY(build_id, scene_native_id) REFERENCES identity_scenes,
        FOREIGN KEY(build_id, map_space_id) REFERENCES map_spaces,
        CHECK((map_x IS NULL AND map_y IS NULL) OR (map_x IS NOT NULL AND map_y IS NOT NULL)),
        UNIQUE(build_id, placement_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS regions (
        region_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        scene_native_id INTEGER NOT NULL,
        scene_path TEXT NOT NULL,
        name TEXT NOT NULL,
        internal_name TEXT,
        shape TEXT NOT NULL CHECK(shape IN ('box', 'sphere')),
        world_geometry_json TEXT NOT NULL,
        map_space_id TEXT,
        map_geometry_json TEXT,
        provenance_json TEXT NOT NULL,
        FOREIGN KEY(build_id, scene_native_id) REFERENCES identity_scenes,
        FOREIGN KEY(build_id, map_space_id) REFERENCES map_spaces,
        CHECK((map_space_id IS NULL AND map_geometry_json IS NULL) OR (map_space_id IS NOT NULL AND map_geometry_json IS NOT NULL))
      ) STRICT;
      CREATE TABLE IF NOT EXISTS placement_sources (
        placement_id TEXT NOT NULL REFERENCES placements(placement_id),
        source_id TEXT NOT NULL REFERENCES source_identities(source_id),
        families_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        PRIMARY KEY(placement_id, source_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS placement_roles (
        placement_id TEXT NOT NULL REFERENCES placements(placement_id),
        source_id TEXT NOT NULL REFERENCES source_identities(source_id),
        role TEXT NOT NULL,
        npc_entity_key TEXT,
        scope TEXT NOT NULL CHECK(scope IN ('authored', 'player-state', 'town', 'fort', 'camp', 'dungeon', 'challengeStone')),
        evidence_json TEXT NOT NULL,
        FOREIGN KEY(npc_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS placement_roles_identity_idx
        ON placement_roles(placement_id, source_id, role, COALESCE(npc_entity_key, ''), scope);
      CREATE TABLE IF NOT EXISTS conditions (
        condition_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        owner_type TEXT NOT NULL,
        owner_key TEXT NOT NULL,
        ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
        semantics TEXT NOT NULL,
        source_field_path TEXT,
        payload_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        UNIQUE(build_id, owner_type, owner_key, ordinal)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS spawn_candidates (
        source_id TEXT NOT NULL REFERENCES source_identities(source_id),
        candidate_index INTEGER NOT NULL CHECK(candidate_index >= 0),
        npc_entity_key TEXT,
        min_count INTEGER,
        max_count INTEGER,
        raw_chance REAL,
        chance_semantics TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        PRIMARY KEY(source_id, candidate_index),
        FOREIGN KEY(npc_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS merchant_tables (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        merchant_table_id INTEGER NOT NULL CHECK(merchant_table_id >= 0),
        name TEXT,
        details_json TEXT NOT NULL,
        PRIMARY KEY(build_id, merchant_table_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS merchant_bindings (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        owner_entity_key TEXT NOT NULL,
        merchant_table_id INTEGER NOT NULL,
        binding_index INTEGER NOT NULL,
        condition_id TEXT,
        payload_json TEXT NOT NULL,
        PRIMARY KEY(build_id, owner_entity_key, binding_index),
        FOREIGN KEY(owner_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(build_id, merchant_table_id) REFERENCES merchant_tables,
        FOREIGN KEY(condition_id) REFERENCES conditions(condition_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS merchant_stock (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        merchant_table_id INTEGER NOT NULL,
        stock_index INTEGER NOT NULL,
        item_entity_key TEXT NOT NULL,
        currency_entity_key TEXT,
        cost INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY(build_id, merchant_table_id, stock_index),
        FOREIGN KEY(build_id, merchant_table_id) REFERENCES merchant_tables,
        FOREIGN KEY(item_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(currency_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS loot_tables (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        loot_table_id INTEGER NOT NULL CHECK(loot_table_id >= 0),
        level_band_gear INTEGER NOT NULL CHECK(level_band_gear IN (0, 1)),
        payload_json TEXT NOT NULL,
        PRIMARY KEY(build_id, loot_table_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS loot_bindings (
        binding_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        context TEXT NOT NULL CHECK(context IN ('npc', 'world')),
        owner_entity_key TEXT,
        loot_table_id INTEGER NOT NULL,
        binding_index INTEGER NOT NULL,
        raw_rate REAL,
        rate_semantics TEXT NOT NULL,
        condition_id TEXT,
        payload_json TEXT NOT NULL,
        UNIQUE(build_id, context, owner_entity_key, binding_index),
        FOREIGN KEY(owner_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(build_id, loot_table_id) REFERENCES loot_tables,
        FOREIGN KEY(condition_id) REFERENCES conditions(condition_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS loot_entries (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        loot_table_id INTEGER NOT NULL,
        entry_index INTEGER NOT NULL,
        item_entity_key TEXT NOT NULL,
        min_count INTEGER NOT NULL,
        max_count INTEGER NOT NULL,
        raw_rate REAL,
        rate_semantics TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY(build_id, loot_table_id, entry_index),
        FOREIGN KEY(build_id, loot_table_id) REFERENCES loot_tables,
        FOREIGN KEY(item_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS linked_npc_rules (
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        npc_entity_key TEXT NOT NULL,
        authored_linked_npc_entity_key TEXT,
        resolved_linked_npc_entity_key TEXT,
        resolved_loot_spec_npc_entity_key TEXT,
        specialization_source TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY(build_id, npc_entity_key),
        FOREIGN KEY(npc_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(authored_linked_npc_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(resolved_linked_npc_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(resolved_loot_spec_npc_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS resource_ranks (
        rank_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        source_id TEXT REFERENCES source_identities(source_id),
        resource_entity_key TEXT,
        rank INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        UNIQUE(build_id, source_id, resource_entity_key, rank),
        FOREIGN KEY(resource_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS resource_yields (
        yield_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        source_id TEXT REFERENCES source_identities(source_id),
        resource_entity_key TEXT,
        item_entity_key TEXT,
        rank INTEGER,
        min_count INTEGER,
        max_count INTEGER,
        payload_json TEXT NOT NULL,
        FOREIGN KEY(resource_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(item_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS quest_associations (
        association_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        association_kind TEXT NOT NULL,
        owner_entity_key TEXT,
        quest_entity_key TEXT,
        task_entity_key TEXT,
        item_entity_key TEXT,
        source_id TEXT REFERENCES source_identities(source_id),
        payload_json TEXT NOT NULL,
        FOREIGN KEY(owner_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(quest_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(task_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(item_entity_key) REFERENCES canonical_entities(entity_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS transitions (
        transition_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        source_id TEXT REFERENCES source_identities(source_id),
        source_scene_native_id INTEGER,
        destination_scene_entity_key TEXT,
        destination_map_space_id TEXT,
        transition_kind TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        FOREIGN KEY(destination_scene_entity_key) REFERENCES canonical_entities(entity_key),
        FOREIGN KEY(build_id, source_scene_native_id) REFERENCES identity_scenes,
        FOREIGN KEY(build_id, destination_map_space_id) REFERENCES map_spaces
      ) STRICT;
      CREATE TABLE IF NOT EXISTS item_sources (
        item_entity_key TEXT NOT NULL REFERENCES canonical_entities(entity_key),
        source_kind TEXT NOT NULL,
        source_key TEXT NOT NULL,
        placement_ids_json TEXT NOT NULL,
        condition_ids_json TEXT NOT NULL,
        context_json TEXT NOT NULL,
        probability_json TEXT NOT NULL CHECK(probability_json = 'null'),
        PRIMARY KEY(item_entity_key, source_kind, source_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS imagery_assets (
        asset_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        map_space_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('game-map', 'captured')),
        sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
        bytes INTEGER NOT NULL CHECK(bytes >= 0),
        metadata_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        UNIQUE(build_id, map_space_id, kind, asset_id),
        FOREIGN KEY(build_id, map_space_id) REFERENCES map_spaces
      ) STRICT;
      CREATE TABLE IF NOT EXISTS coverage_exclusions (
        exclusion_id TEXT PRIMARY KEY NOT NULL CHECK(length(exclusion_id) = 64),
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        kind TEXT NOT NULL,
        subject_key TEXT NOT NULL,
        detail TEXT NOT NULL,
        map_space_ids_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        UNIQUE(build_id, kind, subject_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS coverage_issues (
        issue_id TEXT PRIMARY KEY NOT NULL CHECK(length(issue_id) = 64),
        build_id TEXT NOT NULL REFERENCES normalized_builds(build_id),
        kind TEXT NOT NULL,
        subject_key TEXT NOT NULL,
        semantic_discriminator TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('unresolved', 'resolved', 'excluded')),
        resolution_evidence_json TEXT,
        first_seen_run TEXT NOT NULL,
        last_seen_run TEXT NOT NULL,
        UNIQUE(build_id, kind, subject_key, semantic_discriminator)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS coverage_occurrences (
        occurrence_id TEXT PRIMARY KEY NOT NULL CHECK(length(occurrence_id) = 64),
        issue_id TEXT NOT NULL REFERENCES coverage_issues(issue_id) ON DELETE CASCADE,
        artifact_hash TEXT NOT NULL CHECK(length(artifact_hash) = 64),
        source_key TEXT NOT NULL,
        record_path TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        UNIQUE(issue_id, artifact_hash, source_key, record_path)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS placements_map_idx ON placements(build_id, map_space_id);
      CREATE INDEX IF NOT EXISTS placement_roles_role_idx ON placement_roles(role, placement_id);
      CREATE INDEX IF NOT EXISTS item_sources_item_idx ON item_sources(item_entity_key);
    `);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function same(existing: unknown, value: unknown): boolean {
  return JSON.stringify(existing) === JSON.stringify(value);
}

function insertChecked(db: Database, table: string, keyColumns: string[], columns: string[], values: unknown[]): void {
  const where = keyColumns.map((column) => `${column} IS ?`).join(" AND ");
  const bindings: SQLQueryBindings[] = values.map((value, index) => {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean" || value instanceof Uint8Array) return value;
    throw new TypeError(`Invalid SQL value for ${table}.${columns[index]}.`);
  });
  const keyValues = keyColumns.map((column) => {
    const index = columns.indexOf(column);
    if (index < 0) throw new Error(`Missing key column ${table}.${column}.`);
    return bindings[index]!;
  });
  const existing = db.query<Record<string, unknown>, SQLQueryBindings[]>(`SELECT ${columns.join(", ")} FROM ${table} WHERE ${where}`).get(...keyValues);
  if (existing) {
    const differs = columns.some((column, index) => !same(existing[column], values[index]));
    if (differs) throw new Error(`Conflicting duplicate in ${table} for ${keyColumns.map((column, index) => `${column}=${String(keyValues[index])}`).join(", ")}.`);
    return;
  }
  db.query(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`).run(...bindings);
}

function ensureCanonical(db: Database, buildId: string, entities: ReadonlyMap<string, NormalizedEntity>): void {
  for (const row of [...entities.values()].sort((a, b) => a.entityKey.localeCompare(b.entityKey))) {
    insertChecked(db, "canonical_entities", ["entity_key"], ["build_id", "kind", "native_id", "entity_key", "name", "internal_name", "description", "source_key", "details_json", "provenance_json"], [buildId, row.kind, row.nativeId, row.entityKey, row.name, row.internalName, row.description, row.sourceKey, json(row.publicData), json(row.provenance)]);
  }
}

function addSourceManifest(db: Database, buildId: string, sourceKey: string, kind: string, path: string, sha256: string): void {
  insertChecked(db, "source_manifests", ["source_key"], ["source_key", "kind", "path", "sha256", "build_id"], [sourceKey, kind, path, sha256, buildId]);
}

export interface CoverageIssueEvidence {
  buildId: string;
  kind: string;
  subjectKey: string;
  semanticDiscriminator: string;
  state: "unresolved" | "resolved" | "excluded";
  resolutionEvidence?: unknown;
  runId: string;
  artifactHash: string;
  sourceKey: string;
  recordPath: string;
  evidence: unknown;
}

export function coverageIssueId(evidence: Pick<CoverageIssueEvidence, "buildId" | "kind" | "subjectKey" | "semanticDiscriminator">): string {
  return hash([evidence.buildId, evidence.kind, evidence.subjectKey, evidence.semanticDiscriminator]);
}

export function coverageOccurrenceId(issueId: string, evidence: Pick<CoverageIssueEvidence, "artifactHash" | "sourceKey" | "recordPath">): string {
  return hash([issueId, evidence.artifactHash, evidence.sourceKey, evidence.recordPath]);
}

export function recordCoverageIssue(db: Database, evidence: CoverageIssueEvidence): { issueId: string; occurrenceId: string } {
  const issueId = coverageIssueId(evidence);
  const occurrenceId = coverageOccurrenceId(issueId, evidence);
  db.query(`INSERT INTO coverage_issues
      (issue_id, build_id, kind, subject_key, semantic_discriminator, state, resolution_evidence_json, first_seen_run, last_seen_run)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(issue_id) DO UPDATE SET
        state = excluded.state,
        resolution_evidence_json = excluded.resolution_evidence_json,
        last_seen_run = excluded.last_seen_run`).run(
    issueId, evidence.buildId, evidence.kind, evidence.subjectKey, evidence.semanticDiscriminator,
    evidence.state, evidence.resolutionEvidence === undefined ? null : json(evidence.resolutionEvidence),
    evidence.runId, evidence.runId,
  );
  db.query(`INSERT INTO coverage_occurrences
      (occurrence_id, issue_id, artifact_hash, source_key, record_path, evidence_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(occurrence_id) DO NOTHING`).run(
    occurrenceId, issueId, evidence.artifactHash, evidence.sourceKey, evidence.recordPath, json(evidence.evidence),
  );
  return { issueId, occurrenceId };
}

export function populateNormalizedDatabase(db: Database, input: NormalizedDatabaseInput, sourceFiles: ReadonlyArray<{ key: string; kind: string; ref: { path: string; sha256: string } }>): void {
  if (db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get()?.foreign_keys !== 1) throw new Error("Normalized storage requires SQLite foreign keys.");
  for (const identity of input.identityResults) recordPlacementIdentities(db, { runId: identity.runId, snapshotId: identity.snapshotId, snapshotPrefix: identity.snapshotPrefix, snapshotSha256: identity.snapshotSha256, character: identity.character, sceneHandle: identity.sceneHandle }, identity.result);
  const byEntity = new Map(input.entities.map((entity) => [entity.entityKey, entity]));
  db.transaction(() => {
    insertChecked(db, "normalized_builds", ["build_id"], ["build_id", "schema_version", "provenance_json"], [input.buildId, "compendium.normalized-output.v5", json(input.provenance)]);
    for (const source of sourceFiles) addSourceManifest(db, input.buildId, source.key, source.kind, source.ref.path, source.ref.sha256);

    const sceneRows = new Map<number, { nativeId: number; path: string; name: string | null }>();
    for (const row of input.scenes) {
      const previous = sceneRows.get(row.nativeId);
      if (previous && (previous.path !== row.path || previous.name !== row.name)) throw new Error(`Conflicting scene identity for native ID ${row.nativeId}.`);
      sceneRows.set(row.nativeId, row);
    }
    for (const row of [...sceneRows.values()].sort((a, b) => a.nativeId - b.nativeId)) insertChecked(db, "identity_scenes", ["build_id", "scene_native_id"], ["build_id", "scene_native_id", "scene_path"], [input.buildId, row.nativeId, row.path]);
    ensureCanonical(db, input.buildId, byEntity);
    for (const row of input.entityDetails) insertChecked(db, "entity_details", ["entity_key"], ["entity_key", "detail_json"], [row.entityKey, json(row)]);
    for (const row of input.mapSpaces) insertChecked(db, "map_spaces", ["build_id", "map_space_id"], ["build_id", "map_space_id", "label"], [input.buildId, row.id, row.label]);
    for (const binding of input.bindings) insertChecked(db, "map_space_bindings", ["build_id", "binding_id"], ["build_id", "binding_id", "map_space_id", "scene_native_id", "scene_path", "frame_json", "domain_json"], [input.buildId, binding.id, binding.mapSpaceId, binding.sceneNativeId, binding.scenePath, json(binding.frame), json(binding.domain)]);

    for (const placement of input.placements) {
      insertChecked(db, "placements", ["placement_id"], ["placement_id", "build_id", "scene_native_id", "scene_path", "map_space_id", "world_x", "world_y", "world_z", "map_x", "map_y", "label", "shape_json", "provenance_json"], [placement.placementId, input.buildId, placement.sceneNativeId, placement.scenePath, placement.mapSpaceId, placement.worldPosition.x, placement.worldPosition.y, placement.worldPosition.z, placement.mapPosition?.x ?? null, placement.mapPosition?.y ?? null, placement.label ?? null, json(placement.shape), json(placement.provenance)]);
    }
    for (const region of input.regions) {
      insertChecked(db, "regions", ["region_id"], ["region_id", "build_id", "scene_native_id", "scene_path", "name", "internal_name", "shape", "world_geometry_json", "map_space_id", "map_geometry_json", "provenance_json"], [region.regionId, input.buildId, region.sceneNativeId, region.scenePath, region.name, region.internalName, region.shape, json(region.worldGeometry), region.mapSpaceId, region.mapGeometry === null ? null : json(region.mapGeometry), json(region.provenance)]);
    }
    for (const source of input.sources) {
      if (!db.query("SELECT 1 AS present FROM source_identities WHERE source_id = ?").get(source.sourceId)) throw new Error(`Source ${source.sourceId} references no persisted identity record.`);
    }
    for (const placement of input.placements) {
      for (const sourceId of placement.sourceIds) {
        const source = input.sources.find((row) => row.sourceId === sourceId);
        if (!source) throw new Error(`Placement ${placement.placementId} references missing source ${sourceId}.`);
        insertChecked(db, "placement_sources", ["placement_id", "source_id"], ["placement_id", "source_id", "families_json", "provenance_json"], [placement.placementId, sourceId, json(source.families), json(source.provenance)]);
      }
    }
    for (const detail of input.sourceDetails) insertChecked(db, "source_details", ["detail_id"], ["detail_id", "source_id", "placement_id", "family", "data_json"], [hash(detail), detail.sourceId, detail.placementId, detail.family, json(detail.data)]);
    for (const row of input.patrolPaths) insertChecked(db, "patrol_paths", ["path_key"], ["path_key", "scene_native_id", "name", "detail_json"], [hash(row), row.sceneNativeId, row.name, json(row)]);
    for (const row of input.sceneSpawns) insertChecked(db, "scene_spawns", ["scene_native_id"], ["scene_native_id", "detail_json"], [row.sceneNativeId, json(row)]);
    for (const role of input.roles) {
      if (role.npcId !== null && !byEntity.has(`npcs:${role.npcId}`)) throw new Error(`Role ${role.role} references missing NPC ${role.npcId}.`);
      insertChecked(db, "placement_roles", ["placement_id", "source_id", "role", "npc_entity_key", "scope"], ["placement_id", "source_id", "role", "npc_entity_key", "scope", "evidence_json"], [role.placementId, role.sourceId, role.role, role.npcId === null ? null : `npcs:${role.npcId}`, role.scope, json(role.evidence)]);
    }
    for (const condition of input.conditions) insertChecked(db, "conditions", ["condition_id"], ["condition_id", "build_id", "owner_type", "owner_key", "ordinal", "semantics", "source_field_path", "payload_json", "provenance_json"], [condition.conditionId, input.buildId, condition.ownerType, condition.ownerKey, condition.ordinal, condition.semantics, condition.sourceFieldPath, json(condition.payload), json(condition.provenance)]);
    for (const candidate of input.spawnCandidates) {
      insertChecked(db, "spawn_candidates", ["source_id", "candidate_index"], ["source_id", "candidate_index", "npc_entity_key", "min_count", "max_count", "raw_chance", "chance_semantics", "payload_json", "provenance_json"], [candidate.sourceId, candidate.candidateIndex, candidate.npcId === null ? null : `npcs:${candidate.npcId}`, candidate.minCount, candidate.maxCount, candidate.rawChance, candidate.chanceSemantics, json(candidate.payload), json(candidate.provenance)]);
    }
    for (const row of input.merchantTables) insertChecked(db, "merchant_tables", ["build_id", "merchant_table_id"], ["build_id", "merchant_table_id", "name", "details_json"], [input.buildId, Number(row.nativeId), typeof row.name === "string" ? row.name : null, json(row)]);
    for (const row of input.lootTables) insertChecked(db, "loot_tables", ["build_id", "loot_table_id"], ["build_id", "loot_table_id", "level_band_gear", "payload_json"], [input.buildId, Number(row.nativeId), row.levelBandGear === true ? 1 : 0, json(row)]);
    for (const row of input.merchantBindings) {
      const owner = `npcs:${String(row.ownerNativeId)}`;
      if (!byEntity.has(owner)) throw new Error(`Merchant binding references missing NPC ${owner}.`);
      insertChecked(db, "merchant_bindings", ["build_id", "owner_entity_key", "binding_index"], ["build_id", "owner_entity_key", "merchant_table_id", "binding_index", "condition_id", "payload_json"], [input.buildId, owner, Number(row.merchantTableID), Number(row.bindingIndex), typeof row.conditionId === "string" ? row.conditionId : null, json(row)]);
    }
    for (const row of input.merchantStock) {
      const item = `items:${String(row.itemID)}`;
      if (!byEntity.has(item)) throw new Error(`Merchant stock references missing item ${item}.`);
      const currency = row.currencyID === undefined || Number(row.currencyID) < 0 ? null : `currencies:${String(row.currencyID)}`;
      if (currency && !byEntity.has(currency)) throw new Error(`Merchant stock references missing currency ${currency}.`);
      insertChecked(db, "merchant_stock", ["build_id", "merchant_table_id", "stock_index"], ["build_id", "merchant_table_id", "stock_index", "item_entity_key", "currency_entity_key", "cost", "payload_json"], [input.buildId, Number(row.merchantTableID), Number(row.stockIndex), item, currency, Number(row.cost), json(row)]);
    }
    for (const row of input.lootBindings) {
      const tableId = Number(row.lootTableID);
      const context = row.context === "world" ? "world" : "npc";
      const owner = context === "world" ? null : `npcs:${String(row.ownerNativeId)}`;
      if (owner && !byEntity.has(owner)) throw new Error(`Loot binding references missing NPC ${owner}.`);
      const bindingId = hash([input.buildId, context, owner, Number(row.bindingIndex), tableId]);
      insertChecked(db, "loot_bindings", ["binding_id"], ["binding_id", "build_id", "context", "owner_entity_key", "loot_table_id", "binding_index", "raw_rate", "rate_semantics", "condition_id", "payload_json"], [bindingId, input.buildId, context, owner, tableId, Number(row.bindingIndex), typeof row.dropRate === "number" ? row.dropRate : null, typeof row.dropRateSemantics === "string" ? row.dropRateSemantics : "authored raw rate; effective probability unresolved", typeof row.conditionId === "string" ? row.conditionId : null, json(row)]);
    }
    for (const row of input.lootEntries) {
      const item = `items:${String(row.itemID)}`;
      if (!byEntity.has(item)) throw new Error(`Loot entry references missing item ${item}.`);
      const tableId = Number(row.lootTableID);
      insertChecked(db, "loot_entries", ["build_id", "loot_table_id", "entry_index"], ["build_id", "loot_table_id", "entry_index", "item_entity_key", "min_count", "max_count", "raw_rate", "rate_semantics", "payload_json"], [input.buildId, tableId, Number(row.entryIndex), item, Number(row.min), Number(row.max), typeof row.dropRate === "number" ? row.dropRate : null, typeof row.dropRateSemantics === "string" ? row.dropRateSemantics : "authored raw rate; effective probability unresolved", json(row)]);
    }
    for (const row of input.linkedNpcRules) {
      const npc = `npcs:${String(row.npcId)}`;
      if (!byEntity.has(npc)) throw new Error(`Linked NPC rule references missing NPC ${npc}.`);
      const key = (value: unknown): string | null => typeof value === "number" && value >= 0 ? `npcs:${value}` : null;
      for (const linked of [key(row.authoredLinkedNpcId), key(row.resolvedLinkedNpcId), key(row.resolvedLootSpecNpcId)]) if (linked && !byEntity.has(linked)) throw new Error(`Linked NPC rule references missing NPC ${linked}.`);
      insertChecked(db, "linked_npc_rules", ["build_id", "npc_entity_key"], ["build_id", "npc_entity_key", "authored_linked_npc_entity_key", "resolved_linked_npc_entity_key", "resolved_loot_spec_npc_entity_key", "specialization_source", "payload_json"], [input.buildId, npc, key(row.authoredLinkedNpcId), key(row.resolvedLinkedNpcId), key(row.resolvedLootSpecNpcId), String(row.specializationSource ?? "none"), json(row)]);
    }
    for (const row of input.resourceYields) {
      const sourceId = typeof row.sourceId === "string" && db.query("SELECT 1 AS present FROM source_identities WHERE source_id = ?").get(row.sourceId) ? row.sourceId : null;
      const resourceKey = typeof row.resourceID === "number" && byEntity.has(`resources:${row.resourceID}`) ? `resources:${row.resourceID}` : null;
      const rank = typeof row.rank === "number" ? row.rank : null;
      if (rank !== null) insertChecked(db, "resource_ranks", ["rank_id"], ["rank_id", "build_id", "source_id", "resource_entity_key", "rank", "payload_json"], [`${String(row.yieldId)}:rank`, input.buildId, sourceId, resourceKey, rank, json(row)]);
      insertChecked(db, "resource_yields", ["yield_id"], ["yield_id", "build_id", "source_id", "resource_entity_key", "item_entity_key", "rank", "min_count", "max_count", "payload_json"], [String(row.yieldId), input.buildId, sourceId, resourceKey, typeof row.itemID === "number" && byEntity.has(`items:${row.itemID}`) ? `items:${row.itemID}` : null, rank, typeof row.min === "number" ? row.min : null, typeof row.max === "number" ? row.max : null, json(row)]);
    }
    for (const row of input.questAssociations) insertChecked(db, "quest_associations", ["association_id"], ["association_id", "build_id", "association_kind", "owner_entity_key", "quest_entity_key", "task_entity_key", "item_entity_key", "source_id", "payload_json"], [String(row.associationId), input.buildId, String(row.associationKind), typeof row.ownerNativeId === "number" && byEntity.has(`npcs:${row.ownerNativeId}`) ? `npcs:${row.ownerNativeId}` : null, typeof row.questID === "number" && byEntity.has(`quests:${row.questID}`) ? `quests:${row.questID}` : null, typeof row.taskID === "number" && byEntity.has(`tasks:${row.taskID}`) ? `tasks:${row.taskID}` : null, typeof row.itemID === "number" && byEntity.has(`items:${row.itemID}`) ? `items:${row.itemID}` : null, typeof row.sourceId === "string" && db.query("SELECT 1 AS present FROM source_identities WHERE source_id = ?").get(row.sourceId) ? row.sourceId : null, json(row)]);
    for (const row of input.transitions) insertChecked(db, "transitions", ["transition_id"], ["transition_id", "build_id", "source_id", "source_scene_native_id", "destination_scene_entity_key", "destination_map_space_id", "transition_kind", "payload_json"], [String(row.transitionId), input.buildId, typeof row.sourceId === "string" && db.query("SELECT 1 AS present FROM source_identities WHERE source_id = ?").get(row.sourceId) ? row.sourceId : null, typeof row.sourceSceneNativeId === "number" && db.query("SELECT 1 AS present FROM identity_scenes WHERE build_id = ? AND scene_native_id = ?").get(input.buildId, row.sourceSceneNativeId) ? row.sourceSceneNativeId : null, typeof row.destinationSceneNativeId === "number" && byEntity.has(`scenes:${row.destinationSceneNativeId}`) ? `scenes:${row.destinationSceneNativeId}` : null, typeof row.destinationMapSpaceId === "string" && db.query("SELECT 1 AS present FROM map_spaces WHERE build_id = ? AND map_space_id = ?").get(input.buildId, row.destinationMapSpaceId) ? row.destinationMapSpaceId : null, String(row.transitionKind), json(row)]);
    for (const item of input.itemSources) {
      const itemKey = `items:${item.itemId}`;
      if (!byEntity.has(itemKey)) throw new Error(`Item-source index references missing item ${itemKey}.`);
      for (const source of item.sources) insertChecked(db, "item_sources", ["item_entity_key", "source_kind", "source_key"], ["item_entity_key", "source_kind", "source_key", "placement_ids_json", "condition_ids_json", "context_json", "probability_json"], [itemKey, source.sourceKind, source.sourceKey, json([...source.placementIds].sort()), json([...source.conditionIds].sort()), json(source.context), "null"]);
    }
    for (const exclusion of input.exclusions) insertChecked(
      db,
      "coverage_exclusions",
      ["build_id", "kind", "subject_key"],
      ["exclusion_id", "build_id", "kind", "subject_key", "detail", "map_space_ids_json", "provenance_json"],
      [hash([input.buildId, exclusion.kind, exclusion.key]), input.buildId, exclusion.kind, exclusion.key, exclusion.detail, json([...exclusion.mapSpaceIds].sort()), json(exclusion.provenance)],
    );
    const occurrenceIssues = new Set(input.coverageOccurrences.map((occurrence) => `${occurrence.kind}\0${occurrence.subjectKey}\0${occurrence.semanticDiscriminator}`));
    for (const occurrence of input.coverageOccurrences) recordCoverageIssue(db, {
      buildId: input.buildId,
      kind: occurrence.kind,
      subjectKey: occurrence.subjectKey,
      semanticDiscriminator: occurrence.semanticDiscriminator,
      state: "unresolved",
      runId: input.buildId,
      artifactHash: occurrence.artifactHash,
      sourceKey: occurrence.sourceKey,
      recordPath: occurrence.recordPath,
      evidence: occurrence.evidence,
    });
    for (const blocker of input.blockers) {
      if (occurrenceIssues.has(`${blocker.kind}\0${blocker.key}\0`)) continue;
      const provenance = blocker.provenance[0];
      recordCoverageIssue(db, {
        buildId: input.buildId,
        kind: blocker.kind,
        subjectKey: blocker.key,
        semanticDiscriminator: "",
        state: "unresolved",
        runId: input.buildId,
        artifactHash: provenance?.sha256 ?? "0".repeat(64),
        sourceKey: provenance?.path ?? "normalized-input",
        recordPath: blocker.key,
        evidence: { detail: blocker.detail, provenance: blocker.provenance },
      });
    }
  })();
}

export function databaseCounts(db: Database): NormalizedOutputCounts {
  const count = (table: string): number => Number(db.query<{ count: number }, []>(`SELECT count(*) AS count FROM ${table}`).get()?.count ?? 0);
  return { entities: count("canonical_entities"), placements: count("placements"), regions: count("regions"), sources: count("source_identities"), roles: count("placement_roles"), conditions: count("conditions"), domainRelations: count("merchant_stock") + count("loot_bindings") + count("loot_entries") + count("resource_ranks") + count("resource_yields") + count("quest_associations") + count("transitions"), blockers: Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_issues WHERE state = 'unresolved'").get()?.count ?? 0) };
}

export interface NormalizedOutputCounts { entities: number; placements: number; regions: number; sources: number; roles: number; conditions: number; domainRelations: number; blockers: number }

export function hashRelation(kind: string, payload: unknown): string { return hash([kind, payload]); }
