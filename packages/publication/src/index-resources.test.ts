import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { openNormalizedDatabase } from "@afallon/catalog";
import { generateIndexResources } from "./index-resources";

test("indexes compact summaries and stores each detail independently", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-index-resources-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "items", 1, "items:1", "Item", null, "Item description", null, "{}", "[]",
      "build", "npcs", 2, "npcs:2", "NPC", null, "NPC description", null, "{}", "[]",
    );
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?)").run("items:1", "merchant", "merchant:1", "[]", "[]", "{}", "null");
    const store = new ArtifactStore(join(root, "objects"));
    const generated = await generateIndexResources(db, store);
    expect(generated.entitySearch.value.entities).toHaveLength(2);
    expect(generated.itemSearch.value.items).toHaveLength(1);
    expect(new Set([...generated.entityDetails.values()].map((resource) => resource.identity.sha256)).size).toBe(2);

    const selected = generated.entityDetails.get("items:1")!;
    const loaded = JSON.parse(await readFile(store.objectPath(selected.identity.sha256), "utf8"));
    expect(loaded.entity.entityKey).toBe("items:1");
    expect(JSON.stringify(loaded)).not.toContain("npcs:2");
    expect(generated.itemSearch.value.items[0]!.sourcePath).toBe(generated.itemSources.get("items:1")!.reference.path);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
