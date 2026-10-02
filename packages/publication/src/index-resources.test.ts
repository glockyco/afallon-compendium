import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { PUBLICATION_PART_BUDGET, type PublicClass, type PublicDocument, type PublicItem, type PublicNpc, type PublicQuest, type PublicSkill } from "@afallon/contracts/public";
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
      new Map([["world", []]]),
      new Map(),
      new Map(),
      [],
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

test("an NPC row counts its places in the column and offers each place in the filter", () => {
  const placement = (label: string): PublicNpc["locations"][number] => ({ label, placements: [{ placementId: label, mapSpaceId: "world", label }], spotCount: 1, availability: [], level: { min: 5, max: 5, scales: false }, variants: [], roles: ["enemy"], quests: [] });
  const npc: PublicNpc = {
    ref: { key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }, description: null, art: {},
    facts: { level: { min: 5, max: 5, scales: false }, roles: ["enemy"], stats: [], immunities: [] }, variantFields: [], variants: [],
    locations: [placement("Oakenvale"), placement("Coalway Woods")],
    places: [placement("Oakenvale"), placement("Coalway Woods")].map(({ label, placements }) => ({ label, mapSpaceId: "world", placementIds: placements.map((spot) => spot.placementId), spotCount: 1 })), spotCount: 2,
    drops: [], sells: [], quests: [], abilityPhases: [], factionRewards: [], usedInQuests: [], bossOf: [], placedRules: [],
  };
  const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "npcs")!;
  const row = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map([[npc.ref.key, npc]])).get("npcs")![0]!.rows[0]!;
  expect(row.values.place).toBe("2 places");
  expect(row.facets.places).toEqual(["Coalway Woods", "Oakenvale"]);
  expect(Object.keys(row.facets).sort()).toEqual(registry.facets.map((facet) => facet.id).sort());
});

test("quest rows expose the level range, chain, areas, and giver for every column", () => {
  const quest: PublicQuest = {
    ref: { key: "quests:3", kind: "quests", name: "Trial", slug: "trial" }, description: null, art: {},
    facts: { repeatable: true, turnInWithoutNpc: false, requirements: [], chain: { name: "Pilgrimage", order: 2 }, levelRange: { min: 15, max: 30 }, levelRequirement: 16, experience: 120,
      worldQuest: { availableSeconds: 600, cooldownAfterCompletionSeconds: 900, cooldownAfterExpirySeconds: 300, cooldownJitterSeconds: 60, initialRollSeconds: 30 } },
    starts: [
      { kind: "npc", npc: { key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }, areas: ["Cedar Ridge"] },
      { kind: "worldZone", placements: [{ placementId: "p1", mapSpaceId: "world", label: "Coalway Woods" }], availability: [], pool: [] },
      { kind: "object", label: "Shrine", placements: [{ placementId: "p2", mapSpaceId: "world", label: "Cedar Ridge" }], availability: [] },
    ],
    turnIns: [], objectives: [], itemsGiven: [], rewards: [], rewardChoices: [], chainQuests: [], unlocks: [], worldChanges: [], placedRules: [],
  };
  const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "quests")!;
  const row = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map([[quest.ref.key, quest]]), undefined, undefined, undefined,
    new Map([[quest.ref.key, ["Experience", "item"]]])).get("quests")![0]!.rows[0]!;
  expect(row.values).toEqual({ levelRange: "15–30", chain: "Pilgrimage", area: "Cedar Ridge, Coalway Woods", giver: "Guardian" });
  expect(Object.keys(row.values).sort()).toEqual(registry.columns.map((column) => column.id).sort());
  expect(Object.keys(row.facets).sort()).toEqual(registry.facets.map((facet) => facet.id).sort());
  expect(row.facets).toEqual({ questType: ["World Quest"], startType: ["npc", "worldZone", "object"], area: ["Cedar Ridge", "Coalway Woods"],
    chain: ["Pilgrimage"], repeatable: ["true"], rewardType: ["Experience", "item"] });
  const ordinary = { ...quest, ref: { ...quest.ref, key: "quests:4", name: "Trial Two", slug: "trial-two" }, facts: { ...quest.facts, worldQuest: undefined } };
  const ordinaryRow = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map([[ordinary.ref.key, ordinary]])).get("quests")![0]!.rows[0]!;
  expect(ordinaryRow.facets.questType).toEqual(["Other Quest"]);
  expect(ordinaryRow.facets.startType).toContain("worldZone");
});

test("item rows name the classes that can use them, what they are, their crafting use, and stats", () => {
  const ref = (key: string, name: string) => ({ key, kind: key.split(":")[0] as "items", name, slug: name.toLowerCase().replaceAll(" ", "-") });
  const stat = (key: string, name: string) => ({ key, kind: "stats" as const, name });
  const item = (key: string, name: string, facts: Partial<PublicItem["facts"]>, usedInRecipes: PublicItem["usedInRecipes"] = []) => ({
    ref: ref(key, name), facts: { itemType: "ARMOR", stats: [], randomStats: [], ...facts }, usedInRecipes,
  }) as unknown as PublicItem;
  const shieldmaster = { ref: { ...ref("classes:0", "Shieldmaster"), kind: "classes" }, facts: { weapons: ["Shield", "One Handed Sword"] }, trees: [] } as unknown as PublicClass;
  const arcanist = { ref: { ...ref("classes:1", "Arcanist"), kind: "classes" }, facts: { weapons: ["Staff"] }, trees: [] } as unknown as PublicClass;
  const documents = new Map<string, PublicDocument>([
    ["items:1", item("items:1", "Buckler", { itemType: "WEAPON", weaponType: "Shield", stats: [{ stat: stat("stats:20", "Armor"), amount: 7, isPercent: false }] })],
    ["items:2", item("items:2", "Oak Staff", { itemType: "WEAPON", weaponType: "STAFF", randomStats: [{ stat: stat("stats:0", "Health"), min: 10, max: 40, isPercent: false, whole: true }] })],
    ["items:3", item("items:3", "Cloth Hood", { armorType: "CLOTH", slot: "HEAD", stats: [{ stat: stat("stats:7", "Lifesteal"), amount: 2, isPercent: true }] })],
    ["items:4", item("items:4", "Copper Ore", { itemType: "MATERIAL" }, [{ counterpart: ref("items:5", "Copper Bar"), count: 2 } as never])],
    ["items:7", item("items:7", "Silver Ring", { armorType: "JEWELRY", slot: "Ring" })],
    ["classes:0", shieldmaster], ["classes:1", arcanist],
  ]);
  const rows = new Map(buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("items")![0]!.rows.map((row) => [row.ref.name, row]));
  expect(rows.get("Buckler")!.facets.class).toEqual(["Shieldmaster"]);
  expect(rows.get("Oak Staff")!.facets.class).toEqual(["Arcanist"]);
  expect(rows.get("Cloth Hood")!.facets.class).toEqual(["Arcanist", "Shieldmaster"]);
  // A weapon type names its hands, jewelry is named by its slot, and other armor by its armor type and slot.
  expect(["Buckler", "Cloth Hood", "Silver Ring", "Copper Ore"].map((name) => rows.get(name)!.values.type)).toEqual(["Shield", "Cloth Head", "Ring", "Material"]);
  // Weapon types and armor types are separate filters, so a selection in one never mixes the other kind of gear in.
  expect([rows.get("Buckler")!.facets.weapon, rows.get("Buckler")!.facets.armor]).toEqual([["Shield"], []]);
  expect([rows.get("Cloth Hood")!.facets.weapon, rows.get("Cloth Hood")!.facets.armor]).toEqual([[], ["CLOTH"]]);
  expect([rows.get("Copper Ore")!.facets.weapon, rows.get("Copper Ore")!.facets.armor]).toEqual([[], []]);
  expect(rows.get("Copper Ore")!.facets.material).toEqual(["true"]);
  expect(rows.get("Buckler")!.facets.material).toEqual(["false"]);
  expect(rows.get("Oak Staff")!.stats).toEqual([{ name: "Health", percent: false, min: 10, max: 40 }]);
  expect(rows.get("Cloth Hood")!.stats).toEqual([{ name: "Lifesteal", percent: true, min: 2, max: 2 }]);
  expect(rows.get("Copper Ore")!.stats).toBeUndefined();
  documents.set("items:6", item("items:6", "War Scythe", { itemType: "WEAPON", weaponType: "Scythe" }));
  expect(() => buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents)).toThrow("No offered class can use the weapon type Scythe");
});

test("skill rows say whether a skill is for crafting, gathering, or a weapon, and leave counts that do not apply blank", () => {
  const skill = (key: string, name: string, experience: PublicSkill["experience"], recipes: number, nodes: number) => ({
    ref: { key, kind: "skills", name, slug: name.toLowerCase() }, description: null, art: {}, facts: { highestLevel: 300, automatic: true },
    recipes: Array.from({ length: recipes }, (_, index) => ({ recipe: { key: `recipes:${index}`, name: "Recipe" }, anchor: `r${index}` })),
    gatheringNodes: Array.from({ length: nodes }, (_, index) => ({ node: { key: null, label: `Node ${index}` }, requirements: [] })), experience, placedRules: [],
  }) as unknown as PublicSkill;
  const skills = [skill("skills:1", "Alchemy", { crafting: true, gathering: false }, 22, 0), skill("skills:2", "Mining", { crafting: false, gathering: true }, 0, 14),
    skill("skills:3", "Axes", { autoAttack: { perHit: 2 }, crafting: false, gathering: false }, 0, 0)];
  const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "skills")!;
  const rows = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map(skills.map((entry) => [entry.ref.key, entry]))).get("skills")![0]!.rows;
  expect(rows.map((row) => [row.ref.name, row.values])).toEqual([
    ["Alchemy", { type: "Crafting", highestLevel: 300, recipes: 22, gatheringNodes: null }],
    ["Mining", { type: "Gathering", highestLevel: 300, recipes: null, gatheringNodes: 14 }],
    ["Axes", { type: "Weapon", highestLevel: 300, recipes: null, gatheringNodes: null }],
  ]);
  expect(Object.keys(rows[0]!.values).sort()).toEqual(registry.columns.map((column) => column.id).sort());
});
