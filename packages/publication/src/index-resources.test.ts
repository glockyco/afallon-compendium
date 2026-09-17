import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { openNormalizedDatabase } from "../../catalog/src/database";
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
    const detail = (entityKey: string, kind: string, nativeId: number, name: string, description: string) => JSON.stringify({ entityKey, kind, nativeId, name, internalName: null, description, publicData: { localization: null, gameplay: null, icon: null }, roles: [], placementIds: [], sources: [], relationships: { merchantStock: [], lootBindings: [], lootEntries: [], resourceYields: [], questAssociations: [], transitions: [], conditions: [] }, provenance: [] });
    db.query("INSERT INTO entity_details VALUES (?, ?), (?, ?)").run(
      "items:1", detail("items:1", "items", 1, "Item", "Item description"),
      "npcs:2", detail("npcs:2", "npcs", 2, "NPC", "NPC description"),
    );
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?)").run("items:1", "merchant", "merchant:1", "[]", "[]", "{}", "null");
    const store = new ArtifactStore(join(root, "objects"));
    const generated = await generateIndexResources(db, store);
    expect(generated.entitySearch.flatMap((part) => part.value.entities)).toHaveLength(2);
    expect(generated.itemSearch.flatMap((part) => part.value.items)).toHaveLength(1);

    const selected = generated.entityDetails.get("items:1")!;
    const loaded = JSON.parse(await readFile(store.objectPath(selected.identity.sha256), "utf8"));
    expect(loaded.entity.entityKey).toBe("items:1");
    expect(JSON.stringify(loaded)).not.toContain("npcs:2");
    const sourceReference = generated.itemSearch.flatMap((part) => part.value.items)[0]!.source;
    const source = JSON.parse(await readFile(store.objectPath(sourceReference.sha256), "utf8"));
    expect(source.itemSource.itemKey).toBe("items:1");
    expect(source.itemSource.sources).toEqual([{ label: "merchant:1", kind: "merchant", placementIds: [], sections: [] }]);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
