import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { PUBLICATION_PART_BUDGET, type PublicQuest } from "@afallon/contracts/public";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { generateIndexResources } from "./index-resources";
import { buildKindLists } from "./lists";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";

test("emits documents, lists, and one page-indexing search corpus", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-index-resources-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "items", 1, "items:1", "Item", null, "Item description", null, "{}", "[]",
      "build", "npcs", 2, "npcs:2", "NPC", null, "NPC description", null, "{}", "[]",
      "build", "quests", 3, "quests:3", "Quest", null, "Quest description", null, "{}", "[]",
    );
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "scenes", 10, "scenes:10", "Crypt", null, "A dungeon", null, "{}", "[]",
    );
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 10, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "p1", "build", 10, "scene", "world", 0, 0, 0, 0, 0, "NPC", "null", "[]",
    );
    db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("p1", "build", 10, "scene-sha", "source-sha", "scene", "1", "scene", null);
    db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run("source", "p1", "build", 10, "1", "NPC", "Assembly-CSharp");
    db.query("INSERT INTO placement_roles (placement_id, source_id, role, npc_entity_key, scope, evidence_json) VALUES (?, ?, ?, ?, ?, ?)").run("p1", "source", "enemy", "npcs:2", "authored", "{}");
    db.query("INSERT INTO regions (region_id, build_id, scene_native_id, scene_path, name, internal_name, shape, world_geometry_json, map_space_id, map_geometry_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "region-1", "build", 10, "scene", "Raven Camp", null, "box", "{}", "world", "{}", "[]",
    );
    db.query("INSERT INTO placement_areas VALUES (?, ?, ?)").run("p1", "region-1", "Raven Camp");
    db.query("INSERT INTO quest_facts (entity_key, repeatable, turn_in_without_npc, level_requirement, level_min, level_max, dungeon_entity_key, dungeon_label, condition_ids_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "quests:3", 0, 0, 16, 18, 20, "scenes:10", "Crypt", "[]", "[]",
    );
    const store = new ArtifactStore(join(root, "objects"));
    const generated = await generateIndexResources(
      db,
      store,
      new Map([["p1", { placementId: "p1", mapSpaceId: "world", label: "World", categories: ["enemy" as const] }]]),
      new Map([["npcs:2", ["p1"]]]),
      new Map([["world", "World"]]),
      new Map([["world", []]]),
    );
    const entries = generated.search.flatMap((part) => part.value.entries);
    expect(entries.find((entry) => entry.ref.key === "quests:3")).toMatchObject({ hasPlacements: false, level: { min: 18, max: 20 } });
    expect(generated.documents.get("quests:3")?.value.document).toMatchObject({ facts: { levelRange: { min: 18, max: 20 }, levelRequirement: 16 }, dungeon: { key: "scenes:10", name: "Crypt" } });
    expect(entries.find((entry) => entry.ref.key === "npcs:2")).toMatchObject({ hasPlacements: true, place: "Crypt" });
    expect(generated.documents.size).toBe(4);
    expect(entries).toHaveLength(4);
    const npcRows = generated.lists.get("npcs")?.flatMap((part) => part.value.rows) ?? [];
    expect(npcRows.find((row) => row.ref.key === "npcs:2")?.values.place).toBe("Raven Camp");
    expect(generated.documents.get("npcs:2")?.value.document).toMatchObject({ locations: [{ label: "Raven Camp" }] });
    const documentPaths = new Set([...generated.documents.values()].map((resource) => resource.reference.path));
    for (const entry of entries) expect(entry.document && documentPaths.has(entry.document.path)).toBe(true);
    for (const lists of generated.lists.values()) for (const list of lists) for (const row of list.value.rows) {
      expect(entries.some((entry) => entry.ref.key === row.ref.key)).toBe(true);
    }
    for (const lists of generated.lists.values()) for (const part of lists) expect(part.identity.bytes).toBeLessThanOrEqual(PUBLICATION_PART_BUDGET);
    for (const part of generated.search) expect(part.identity.bytes).toBeLessThanOrEqual(PUBLICATION_PART_BUDGET);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("quest rows expose the level range, start types, areas, giver, level, and experience for every column", () => {
  const quest: PublicQuest = {
    ref: { key: "quests:3", kind: "quests", name: "Trial", slug: "trial" }, description: null, art: {},
    facts: { repeatable: true, turnInWithoutNpc: false, requirements: [], chain: { name: "Pilgrimage", order: 2 }, levelRange: { min: 15, max: 30 }, levelRequirement: 16, experience: 120 },
    starts: [
      { kind: "npc", npc: { key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }, areas: ["Cedar Ridge"] },
      { kind: "worldZone", placements: [{ placementId: "p1", mapSpaceId: "world", label: "Coalway Woods" }], availability: [], pool: [] },
      { kind: "object", label: "Shrine", placements: [{ placementId: "p2", mapSpaceId: "world", label: "Cedar Ridge" }], availability: [] },
    ],
    turnIns: [], objectives: [], itemsGiven: [], rewards: [], rewardChoices: [], chainQuests: [], unlocks: [], worldChanges: [],
  };
  const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "quests")!;
  const row = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map([[quest.ref.key, quest]])).get("quests")![0]!.rows[0]!;
  expect(row.values).toEqual({ levelRange: "15–30", levelRequirement: 16, chain: "Pilgrimage", startType: "npc, worldZone, object",
    area: "Cedar Ridge, Coalway Woods", giver: "Guardian", experience: 120 });
  expect(Object.keys(row.values).sort()).toEqual(registry.columns.map((column) => column.id).sort());
  expect(Object.keys(row.facets).sort()).toEqual(registry.facets.map((facet) => facet.id).sort());
  expect(row.facets).toEqual({ startType: ["npc", "worldZone", "object"], area: ["Cedar Ridge", "Coalway Woods"],
    chain: ["Pilgrimage"], repeatable: ["true"] });
});
