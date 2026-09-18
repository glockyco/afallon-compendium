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
      CREATE TABLE IF NOT EXISTS item_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), rarity TEXT, item_type TEXT, armor_slot TEXT, weapon_slot TEXT, weapon_type TEXT, armor_type TEXT,
        attack_speed REAL, min_damage REAL, max_damage REAL, random_stats_max INTEGER NOT NULL CHECK(random_stats_max >= 0), gem_type TEXT, enchantment_entity_key TEXT REFERENCES canonical_entities(entity_key), enchantment_label TEXT,
        sell_price REAL, sell_currency_entity_key TEXT REFERENCES canonical_entities(entity_key), sell_currency_label TEXT, buy_price REAL, buy_currency_entity_key TEXT REFERENCES canonical_entities(entity_key), buy_currency_label TEXT,
        stack_limit INTEGER NOT NULL CHECK(stack_limit >= 0), quest_drop_only INTEGER NOT NULL CHECK(quest_drop_only IN (0, 1)), corruption_token INTEGER NOT NULL CHECK(corruption_token IN (0, 1)), level_requirement INTEGER,
        action_abilities_json TEXT NOT NULL, condition_ids_json TEXT NOT NULL, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS item_stats (
        entity_key TEXT NOT NULL REFERENCES item_facts(entity_key), stat_index INTEGER NOT NULL CHECK(stat_index >= 0), stat_entity_key TEXT REFERENCES canonical_entities(entity_key), stat_label TEXT NOT NULL, amount REAL NOT NULL, is_percent INTEGER NOT NULL CHECK(is_percent IN (0, 1)), provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, stat_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS item_random_stats (
        entity_key TEXT NOT NULL REFERENCES item_facts(entity_key), stat_index INTEGER NOT NULL CHECK(stat_index >= 0), stat_entity_key TEXT REFERENCES canonical_entities(entity_key), stat_label TEXT NOT NULL, min_value REAL NOT NULL, max_value REAL NOT NULL, is_percent INTEGER NOT NULL CHECK(is_percent IN (0, 1)), whole INTEGER NOT NULL CHECK(whole IN (0, 1)), chance REAL, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, stat_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS item_gem_stats (
        entity_key TEXT NOT NULL REFERENCES item_facts(entity_key), stat_index INTEGER NOT NULL CHECK(stat_index >= 0), stat_entity_key TEXT REFERENCES canonical_entities(entity_key), stat_label TEXT NOT NULL, amount REAL NOT NULL, is_percent INTEGER NOT NULL CHECK(is_percent IN (0, 1)), provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, stat_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS item_sockets (
        entity_key TEXT NOT NULL REFERENCES item_facts(entity_key), socket_index INTEGER NOT NULL CHECK(socket_index >= 0), socket_type TEXT, gem_type TEXT, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, socket_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS npc_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), min_level INTEGER, max_level INTEGER, scales_with_player INTEGER NOT NULL CHECK(scales_with_player IN (0, 1)), npc_type TEXT, creature_type TEXT, family TEXT,
        faction_entity_key TEXT REFERENCES canonical_entities(entity_key), faction_label TEXT, species_entity_key TEXT REFERENCES canonical_entities(entity_key), species_label TEXT,
        is_merchant INTEGER NOT NULL CHECK(is_merchant IN (0, 1)), is_quest_giver INTEGER NOT NULL CHECK(is_quest_giver IN (0, 1)), is_combat_enabled INTEGER NOT NULL CHECK(is_combat_enabled IN (0, 1)),
        min_respawn REAL, max_respawn REAL, min_experience REAL, max_experience REAL, immune_to_stun INTEGER NOT NULL CHECK(immune_to_stun IN (0, 1)), immune_to_slow INTEGER NOT NULL CHECK(immune_to_slow IN (0, 1)), aggro_range REAL,
        linked_npc_entity_key TEXT REFERENCES canonical_entities(entity_key), linked_npc_label TEXT, loot_specialization_json TEXT, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS npc_stats (
        entity_key TEXT NOT NULL REFERENCES npc_facts(entity_key), stat_index INTEGER NOT NULL CHECK(stat_index >= 0), stat_entity_key TEXT REFERENCES canonical_entities(entity_key), stat_label TEXT NOT NULL, amount REAL NOT NULL, is_percent INTEGER NOT NULL CHECK(is_percent IN (0, 1)), provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, stat_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS npc_ability_phases (
        entity_key TEXT NOT NULL REFERENCES npc_facts(entity_key), phase_index INTEGER NOT NULL CHECK(phase_index >= 0), name TEXT, requirement TEXT, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, phase_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS npc_phase_abilities (
        entity_key TEXT NOT NULL, phase_index INTEGER NOT NULL, ability_index INTEGER NOT NULL CHECK(ability_index >= 0), ability_entity_key TEXT REFERENCES canonical_entities(entity_key), ability_label TEXT NOT NULL, provenance_json TEXT NOT NULL,
        PRIMARY KEY(entity_key, phase_index, ability_index), FOREIGN KEY(entity_key, phase_index) REFERENCES npc_ability_phases(entity_key, phase_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS npc_faction_rewards (
        entity_key TEXT NOT NULL REFERENCES npc_facts(entity_key), reward_index INTEGER NOT NULL CHECK(reward_index >= 0), faction_entity_key TEXT REFERENCES canonical_entities(entity_key), faction_label TEXT NOT NULL, amount REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, reward_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS quest_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), chain_name TEXT, chain_order INTEGER, repeatable INTEGER NOT NULL CHECK(repeatable IN (0, 1)), turn_in_without_npc INTEGER NOT NULL CHECK(turn_in_without_npc IN (0, 1)), completed_description TEXT, objective_text TEXT, level_requirement INTEGER, experience REAL, condition_ids_json TEXT NOT NULL, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS quest_objectives (
        quest_entity_key TEXT NOT NULL REFERENCES quest_facts(entity_key), objective_index INTEGER NOT NULL CHECK(objective_index >= 0), task_type TEXT NOT NULL, task_entity_key TEXT REFERENCES canonical_entities(entity_key), task_label TEXT NOT NULL, target_entity_key TEXT REFERENCES canonical_entities(entity_key), target_label TEXT, count REAL, keep_items INTEGER CHECK(keep_items IS NULL OR keep_items IN (0, 1)), scene_name TEXT, provenance_json TEXT NOT NULL, PRIMARY KEY(quest_entity_key, objective_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS quest_rewards (
        quest_entity_key TEXT NOT NULL REFERENCES quest_facts(entity_key), reward_set TEXT NOT NULL CHECK(reward_set IN ('given', 'pick', 'itemGiven')), reward_index INTEGER NOT NULL CHECK(reward_index >= 0), reward_type TEXT NOT NULL, target_entity_key TEXT REFERENCES canonical_entities(entity_key), target_label TEXT, count REAL, experience REAL, provenance_json TEXT NOT NULL, PRIMARY KEY(quest_entity_key, reward_set, reward_index)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS place_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), place_type TEXT NOT NULL CHECK(place_type IN ('dungeon', 'zone', 'region', 'interior')), guide_included INTEGER NOT NULL CHECK(guide_included IN (0, 1)), guide_description TEXT, level_min INTEGER, level_max INTEGER, map_space_ids_json TEXT NOT NULL, bosses_json TEXT NOT NULL, parent_scene_key TEXT REFERENCES canonical_entities(entity_key), provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS property_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), income REAL, purchase_price REAL, sell_price REAL, currency_entity_key TEXT REFERENCES canonical_entities(entity_key), currency_label TEXT, property_type TEXT, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS task_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), task_type TEXT NOT NULL, target_entity_key TEXT REFERENCES canonical_entities(entity_key), target_label TEXT, count REAL, keep_items INTEGER CHECK(keep_items IS NULL OR keep_items IN (0, 1)), scene_name TEXT, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS ability_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS recipe_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), skill_entity_key TEXT REFERENCES canonical_entities(entity_key), skill_label TEXT, station_entity_key TEXT REFERENCES canonical_entities(entity_key), station_label TEXT, learned_by_default INTEGER NOT NULL CHECK(learned_by_default IN (0, 1)), provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS recipe_ranks (
        entity_key TEXT NOT NULL REFERENCES recipe_facts(entity_key), rank INTEGER NOT NULL CHECK(rank >= 0), unlock_cost REAL NOT NULL, experience REAL NOT NULL, craft_time REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, rank)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS recipe_products (
        entity_key TEXT NOT NULL, rank INTEGER NOT NULL, product_index INTEGER NOT NULL CHECK(product_index >= 0), item_entity_key TEXT REFERENCES canonical_entities(entity_key), item_label TEXT NOT NULL, count REAL NOT NULL, chance REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, rank, product_index), FOREIGN KEY(entity_key, rank) REFERENCES recipe_ranks(entity_key, rank)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS recipe_materials (
        entity_key TEXT NOT NULL, rank INTEGER NOT NULL, material_index INTEGER NOT NULL CHECK(material_index >= 0), item_entity_key TEXT REFERENCES canonical_entities(entity_key), item_label TEXT NOT NULL, count REAL NOT NULL, provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, rank, material_index), FOREIGN KEY(entity_key, rank) REFERENCES recipe_ranks(entity_key, rank)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS crafting_station_facts (
        entity_key TEXT PRIMARY KEY NOT NULL REFERENCES canonical_entities(entity_key), max_distance REAL NOT NULL, skill_refs_json TEXT NOT NULL, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS artwork_assets (
        asset_id TEXT PRIMARY KEY NOT NULL, sha256 TEXT NOT NULL UNIQUE CHECK(length(sha256) = 64), bytes INTEGER NOT NULL CHECK(bytes >= 0), width INTEGER NOT NULL CHECK(width > 0), height INTEGER NOT NULL CHECK(height > 0), source_name TEXT NOT NULL, provenance_json TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS artwork_bindings (
        entity_key TEXT NOT NULL REFERENCES canonical_entities(entity_key), role TEXT NOT NULL CHECK(role IN ('icon', 'portrait', 'artwork')), asset_id TEXT NOT NULL REFERENCES artwork_assets(asset_id), provenance_json TEXT NOT NULL, PRIMARY KEY(entity_key, role)
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
      CREATE TABLE IF NOT EXISTS coverage_occurrence_runs (
        occurrence_id TEXT NOT NULL REFERENCES coverage_occurrences(occurrence_id),
        run_id TEXT NOT NULL,
        PRIMARY KEY(occurrence_id, run_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS fact_derivations (
        fact_kind TEXT NOT NULL,
        fact_key TEXT NOT NULL,
        rule TEXT NOT NULL,
        version INTEGER NOT NULL CHECK(version > 0),
        inputs_json TEXT NOT NULL,
        PRIMARY KEY(fact_kind, fact_key)
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
  db.query("INSERT OR IGNORE INTO coverage_occurrence_runs (occurrence_id, run_id) VALUES (?, ?)").run(occurrenceId, evidence.runId);
  return { issueId, occurrenceId };
}

export function populateNormalizedDatabase(db: Database, input: NormalizedDatabaseInput, sourceFiles: ReadonlyArray<{ key: string; kind: string; ref: { path: string; sha256: string } }>): void {
  if (db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get()?.foreign_keys !== 1) throw new Error("Normalized storage requires SQLite foreign keys.");
  const byEntity = new Map(input.entities.map((entity) => [entity.entityKey, entity]));
  const bySource = new Map(input.sources.map((source) => [source.sourceId, source]));
  db.transaction(() => {
    for (const identity of input.identityResults) recordPlacementIdentities(db, { runId: identity.runId, snapshotId: identity.snapshotId, snapshotPrefix: identity.snapshotPrefix, snapshotSha256: identity.snapshotSha256, character: identity.character, sceneHandle: identity.sceneHandle }, identity.result);
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
    for (const row of input.itemFacts ?? []) insertChecked(db, "item_facts", ["entity_key"], ["entity_key", "rarity", "item_type", "armor_slot", "weapon_slot", "weapon_type", "armor_type", "attack_speed", "min_damage", "max_damage", "random_stats_max", "gem_type", "enchantment_entity_key", "enchantment_label", "sell_price", "sell_currency_entity_key", "sell_currency_label", "buy_price", "buy_currency_entity_key", "buy_currency_label", "stack_limit", "quest_drop_only", "corruption_token", "level_requirement", "action_abilities_json", "condition_ids_json", "provenance_json"], [row.entityKey, row.rarity, row.itemType, row.armorSlot, row.weaponSlot, row.weaponType, row.armorType, row.attackSpeed, row.minDamage, row.maxDamage, row.randomStatsMax, row.gemType, row.enchantment?.entityKey ?? null, row.enchantment?.label ?? null, row.sellPrice, row.sellCurrency?.entityKey ?? null, row.sellCurrency?.label ?? null, row.buyPrice, row.buyCurrency?.entityKey ?? null, row.buyCurrency?.label ?? null, row.stackLimit, row.questDropOnly ? 1 : 0, row.corruptionToken ? 1 : 0, row.levelRequirement, json(row.actionAbilities), json(row.conditionIds), json(row.provenance)]);
    for (const row of input.itemStats ?? []) insertChecked(db, "item_stats", ["entity_key", "stat_index"], ["entity_key", "stat_index", "stat_entity_key", "stat_label", "amount", "is_percent", "provenance_json"], [row.entityKey, row.statIndex, row.stat.entityKey, row.stat.label, row.amount, row.isPercent ? 1 : 0, json(row.provenance)]);
    for (const row of input.itemRandomStats ?? []) insertChecked(db, "item_random_stats", ["entity_key", "stat_index"], ["entity_key", "stat_index", "stat_entity_key", "stat_label", "min_value", "max_value", "is_percent", "whole", "chance", "provenance_json"], [row.entityKey, row.statIndex, row.stat.entityKey, row.stat.label, row.min, row.max, row.isPercent ? 1 : 0, row.whole ? 1 : 0, row.chance, json(row.provenance)]);
    for (const row of input.itemGemStats ?? []) insertChecked(db, "item_gem_stats", ["entity_key", "stat_index"], ["entity_key", "stat_index", "stat_entity_key", "stat_label", "amount", "is_percent", "provenance_json"], [row.entityKey, row.statIndex, row.stat.entityKey, row.stat.label, row.amount, row.isPercent ? 1 : 0, json(row.provenance)]);
    for (const row of input.itemSockets ?? []) insertChecked(db, "item_sockets", ["entity_key", "socket_index"], ["entity_key", "socket_index", "socket_type", "gem_type", "provenance_json"], [row.entityKey, row.socketIndex, row.socketType, row.gemType, json(row.provenance)]);
    for (const row of input.npcFacts ?? []) insertChecked(db, "npc_facts", ["entity_key"], ["entity_key", "min_level", "max_level", "scales_with_player", "npc_type", "creature_type", "family", "faction_entity_key", "faction_label", "species_entity_key", "species_label", "is_merchant", "is_quest_giver", "is_combat_enabled", "min_respawn", "max_respawn", "min_experience", "max_experience", "immune_to_stun", "immune_to_slow", "aggro_range", "linked_npc_entity_key", "linked_npc_label", "loot_specialization_json", "provenance_json"], [row.entityKey, row.minLevel, row.maxLevel, row.scalesWithPlayer ? 1 : 0, row.npcType, row.creatureType, row.family, row.faction?.entityKey ?? null, row.faction?.label ?? null, row.species?.entityKey ?? null, row.species?.label ?? null, row.isMerchant ? 1 : 0, row.isQuestGiver ? 1 : 0, row.isCombatEnabled ? 1 : 0, row.minRespawn, row.maxRespawn, row.minExperience, row.maxExperience, row.immuneToStun ? 1 : 0, row.immuneToSlow ? 1 : 0, row.aggroRange, row.linkedNpc?.entityKey ?? null, row.linkedNpc?.label ?? null, row.lootSpecialization === null ? null : json(row.lootSpecialization), json(row.provenance)]);
    for (const row of input.npcStats ?? []) insertChecked(db, "npc_stats", ["entity_key", "stat_index"], ["entity_key", "stat_index", "stat_entity_key", "stat_label", "amount", "is_percent", "provenance_json"], [row.entityKey, row.statIndex, row.stat.entityKey, row.stat.label, row.amount, row.isPercent ? 1 : 0, json(row.provenance)]);
    for (const row of input.npcAbilityPhases ?? []) insertChecked(db, "npc_ability_phases", ["entity_key", "phase_index"], ["entity_key", "phase_index", "name", "requirement", "provenance_json"], [row.entityKey, row.phaseIndex, row.name, row.requirement, json(row.provenance)]);
    for (const row of input.npcPhaseAbilities ?? []) insertChecked(db, "npc_phase_abilities", ["entity_key", "phase_index", "ability_index"], ["entity_key", "phase_index", "ability_index", "ability_entity_key", "ability_label", "provenance_json"], [row.entityKey, row.phaseIndex, row.abilityIndex, row.ability.entityKey, row.ability.label, json(row.provenance)]);
    for (const row of input.npcFactionRewards ?? []) insertChecked(db, "npc_faction_rewards", ["entity_key", "reward_index"], ["entity_key", "reward_index", "faction_entity_key", "faction_label", "amount", "provenance_json"], [row.entityKey, row.rewardIndex, row.faction.entityKey, row.faction.label, row.amount, json(row.provenance)]);
    for (const row of input.questFacts ?? []) insertChecked(db, "quest_facts", ["entity_key"], ["entity_key", "chain_name", "chain_order", "repeatable", "turn_in_without_npc", "completed_description", "objective_text", "level_requirement", "experience", "condition_ids_json", "provenance_json"], [row.entityKey, row.chainName, row.chainOrder, row.repeatable ? 1 : 0, row.turnInWithoutNpc ? 1 : 0, row.completedDescription, row.objectiveText, row.levelRequirement, row.experience, json(row.conditionIds), json(row.provenance)]);
    for (const row of input.questObjectives ?? []) insertChecked(db, "quest_objectives", ["quest_entity_key", "objective_index"], ["quest_entity_key", "objective_index", "task_type", "task_entity_key", "task_label", "target_entity_key", "target_label", "count", "keep_items", "scene_name", "provenance_json"], [row.questEntityKey, row.objectiveIndex, row.taskType, row.task.entityKey, row.task.label, row.target?.entityKey ?? null, row.target?.label ?? null, row.count, row.keepItems === null ? null : row.keepItems ? 1 : 0, row.sceneName, json(row.provenance)]);
    for (const row of input.questRewards ?? []) insertChecked(db, "quest_rewards", ["quest_entity_key", "reward_set", "reward_index"], ["quest_entity_key", "reward_set", "reward_index", "reward_type", "target_entity_key", "target_label", "count", "experience", "provenance_json"], [row.questEntityKey, row.rewardSet, row.rewardIndex, row.rewardType, row.target?.entityKey ?? null, row.target?.label ?? null, row.count, row.experience, json(row.provenance)]);
    for (const row of input.placeFacts ?? []) insertChecked(db, "place_facts", ["entity_key"], ["entity_key", "place_type", "guide_included", "guide_description", "level_min", "level_max", "map_space_ids_json", "bosses_json", "parent_scene_key", "provenance_json"], [row.entityKey, row.placeType, row.guideIncluded ? 1 : 0, row.guideDescription, row.levelMin, row.levelMax, json(row.mapSpaceIds), json(row.bosses), row.parentSceneKey, json(row.provenance)]);
    for (const row of input.propertyFacts ?? []) insertChecked(db, "property_facts", ["entity_key"], ["entity_key", "income", "purchase_price", "sell_price", "currency_entity_key", "currency_label", "property_type", "provenance_json"], [row.entityKey, row.income, row.purchasePrice, row.sellPrice, row.currency?.entityKey ?? null, row.currency?.label ?? null, row.propertyType, json(row.provenance)]);
    for (const row of input.taskFacts ?? []) insertChecked(db, "task_facts", ["entity_key"], ["entity_key", "task_type", "target_entity_key", "target_label", "count", "keep_items", "scene_name", "provenance_json"], [row.entityKey, row.taskType, row.target?.entityKey ?? null, row.target?.label ?? null, row.count, row.keepItems === null ? null : row.keepItems ? 1 : 0, row.sceneName, json(row.provenance)]);
    for (const row of input.abilityFacts ?? []) insertChecked(db, "ability_facts", ["entity_key"], ["entity_key", "provenance_json"], [row.entityKey, json(row.provenance)]);
    for (const row of input.recipeFacts ?? []) insertChecked(db, "recipe_facts", ["entity_key"], ["entity_key", "skill_entity_key", "skill_label", "station_entity_key", "station_label", "learned_by_default", "provenance_json"], [row.entityKey, row.skill?.entityKey ?? null, row.skill?.label ?? null, row.station?.entityKey ?? null, row.station?.label ?? null, row.learnedByDefault ? 1 : 0, json(row.provenance)]);
    for (const row of input.recipeRanks ?? []) insertChecked(db, "recipe_ranks", ["entity_key", "rank"], ["entity_key", "rank", "unlock_cost", "experience", "craft_time", "provenance_json"], [row.entityKey, row.rank, row.unlockCost, row.experience, row.craftTime, json(row.provenance)]);
    for (const row of input.recipeProducts ?? []) insertChecked(db, "recipe_products", ["entity_key", "rank", "product_index"], ["entity_key", "rank", "product_index", "item_entity_key", "item_label", "count", "chance", "provenance_json"], [row.entityKey, row.rank, row.productIndex, row.item.entityKey, row.item.label, row.count, row.chance, json(row.provenance)]);
    for (const row of input.recipeMaterials ?? []) insertChecked(db, "recipe_materials", ["entity_key", "rank", "material_index"], ["entity_key", "rank", "material_index", "item_entity_key", "item_label", "count", "provenance_json"], [row.entityKey, row.rank, row.materialIndex, row.item.entityKey, row.item.label, row.count, json(row.provenance)]);
    for (const row of input.craftingStationFacts ?? []) insertChecked(db, "crafting_station_facts", ["entity_key"], ["entity_key", "max_distance", "skill_refs_json", "provenance_json"], [row.entityKey, row.maxDistance, json(row.skillRefs), json(row.provenance)]);
    for (const row of input.artworkAssets ?? []) insertChecked(db, "artwork_assets", ["asset_id"], ["asset_id", "sha256", "bytes", "width", "height", "source_name", "provenance_json"], [row.assetId, row.sha256, row.bytes, row.width, row.height, row.sourceName, json(row.provenance)]);
    for (const row of input.artworkBindings ?? []) insertChecked(db, "artwork_bindings", ["entity_key", "role"], ["entity_key", "role", "asset_id", "provenance_json"], [row.entityKey, row.role, row.assetId, json(row.provenance)]);
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
        const source = bySource.get(sourceId);
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
    for (const row of input.imagery ?? []) insertChecked(db, "imagery_assets", ["asset_id"], ["asset_id", "build_id", "map_space_id", "kind", "sha256", "bytes", "metadata_json", "provenance_json"], [row.assetId, input.buildId, row.mapSpaceId, row.kind, row.sha256, row.bytes, json(row.metadata), json(row.provenance)]);
    for (const row of input.derivations ?? []) insertChecked(db, "fact_derivations", ["fact_kind", "fact_key"], ["fact_kind", "fact_key", "rule", "version", "inputs_json"], [row.factKind, row.factKey, row.rule, row.version, json(row.inputs)]);
    const occurrenceIssues = new Set(input.coverageOccurrences.map((occurrence) => `${occurrence.kind}\0${occurrence.subjectKey}\0${occurrence.semanticDiscriminator}`));
    for (const occurrence of input.coverageOccurrences) recordCoverageIssue(db, {
      buildId: input.buildId,
      kind: occurrence.kind,
      subjectKey: occurrence.subjectKey,
      semanticDiscriminator: occurrence.semanticDiscriminator,
      state: "unresolved",
      runId: occurrence.runId,
      artifactHash: occurrence.artifactHash,
      sourceKey: occurrence.sourceKey,
      recordPath: occurrence.recordPath,
      evidence: occurrence.evidence,
    });
    for (const blocker of input.blockers) {
      if (occurrenceIssues.has(`${blocker.kind}\0${blocker.key}\0`)) continue;
      const provenance = blocker.provenance[0];
      if (!provenance) throw new Error(`Coverage issue ${blocker.kind}:${blocker.key} has no evidence identity.`);
      const sourceRunIds = new Set(blocker.provenance.flatMap((reference) => input.sourceRunIds?.[reference.sha256] ?? []));
      if (sourceRunIds.size === 0 && input.sourceRunId) sourceRunIds.add(input.sourceRunId);
      if (sourceRunIds.size === 0) throw new Error(`Coverage issue ${blocker.kind}:${blocker.key} has no source run identity.`);
      for (const sourceRunId of sourceRunIds) recordCoverageIssue(db, {
        buildId: input.buildId,
        kind: blocker.kind,
        subjectKey: blocker.key,
        semanticDiscriminator: "",
        state: "unresolved",
        runId: sourceRunId,
        artifactHash: provenance.sha256,
        sourceKey: provenance.path,
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
