import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { PUBLICATION_PART_BUDGET } from "@afallon/contracts/public";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { generateIndexResources } from "./index-resources";

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
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 10, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "p1", "build", 10, "scene", "world", 0, 0, 0, 0, 0, "NPC", "null", "[]",
    );
    db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("p1", "build", 10, "scene-sha", "source-sha", "scene", "1", "scene", null);
    db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run("source", "p1", "build", 10, "1", "NPC", "Assembly-CSharp");
    db.query("INSERT INTO placement_roles (placement_id, source_id, role, npc_entity_key, scope, evidence_json) VALUES (?, ?, ?, ?, ?, ?)").run("p1", "source", "enemy", "npcs:2", "authored", "{}");
    const store = new ArtifactStore(join(root, "objects"));
    const generated = await generateIndexResources(
      db,
      store,
      new Map([["p1", { placementId: "p1", mapSpaceId: "world", label: "NPC" }]]),
      new Map([["npcs:2", ["p1"]]]),
      new Map([["world", []]]),
    );
    const entries = generated.search.flatMap((part) => part.value.entries);
    expect(entries.find((entry) => entry.ref.key === "quests:3")?.hasPlacements).toBe(false);
    expect(entries.find((entry) => entry.ref.key === "npcs:2")?.hasPlacements).toBe(true);
    expect(generated.documents.size).toBe(3);
    expect(entries).toHaveLength(3);
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
