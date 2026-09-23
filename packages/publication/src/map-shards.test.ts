import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { expandEssentialPlacement, type PublicEssentialPlacement } from "@afallon/contracts/public";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { generateMapShards } from "./map-shards";

interface CraftingPlacementFixture {
  id: string;
  roles?: readonly string[];
  details?: readonly Record<string, unknown>[];
}

async function publishCraftingPlacements(stations: readonly { id: number; name: string }[], placements: readonly CraftingPlacementFixture[]): Promise<PublicEssentialPlacement[]> {
  const root = await mkdtemp(join(tmpdir(), "afallon-crafting-map-shards-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
    for (const station of stations) db.query("INSERT INTO canonical_entities (build_id, kind, native_id, entity_key, name, internal_name, description, source_key, details_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "craftingStations", station.id, `craftingStations:${station.id}`, station.name, null, null, null, "{}", "[]");
    for (const [placementIndex, placement] of placements.entries()) {
      const component = String(placementIndex + 1);
      db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(placement.id, "build", 1, "scene", "world", placementIndex, 0, 0, placementIndex, placementIndex, `Workbench ${placement.id}`, "null", "[]");
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(placement.id, "build", 1, "d".repeat(64), placement.id.padEnd(64, "0"), "scene", component, "scene", null);
      const sourceCount = Math.max(1, placement.details?.length ?? 0);
      const sourceIds = Array.from({ length: sourceCount }, (_, detailIndex) => `${placement.id}-source-${detailIndex}`);
      for (const [detailIndex, sourceId] of sourceIds.entries()) db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(sourceId, placement.id, "build", 1, `${component}-${detailIndex}`, "CraftingStation", "Assembly-CSharp");
      for (const role of placement.roles ?? ["craftingService"]) db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run(placement.id, sourceIds[0]!, role, null, "authored", "{}");
      for (const [detailIndex, data] of (placement.details ?? []).entries()) db.query("INSERT INTO source_details VALUES (?, ?, ?, ?, ?)").run(`${placement.id}-detail-${detailIndex}`, sourceIds[detailIndex]!, placement.id, "craftingStation", JSON.stringify(data));
    }
    const generated = await generateMapShards(db, new ArtifactStore(join(root, "objects")));
    return generated[0]!.resources.flatMap((part) => part.value.placements);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
}

test("keeps map records isolated and stable across equivalent compilations", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-map-shards-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?), (?, ?, ?)").run("build", "a", "Map A", "build", "b", "Map B");
    for (const [id, map, x] of [["placement-a", "a", 1], ["placement-b", "b", 2]] as const) {
      db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", map, x, 0, 0, x, x, id, "null", "[]");
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "d".repeat(64), "e".repeat(64), "scene", String(x), "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(`source-${map}`, id, "build", 1, String(x), "Container", "Assembly-CSharp");
      db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run(id, `source-${map}`, "container", null, "authored", "{}");
    }
    db.query("INSERT INTO canonical_entities (build_id, kind, native_id, entity_key, name, internal_name, description, source_key, details_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "npcs", 7, "npcs:7", "Skywarden", null, null, null, "{}", "[]");
    db.query("INSERT INTO entity_details VALUES (?, ?)").run("npcs:7", JSON.stringify({ entityKey: "npcs:7", publicData: { gameplay: { isAuctioneer: true, isBanker: true, isFlightMaster: true, flightStopId: "camp", flightNetwork: { available: true, stops: [{ id: "camp", name: "Wayfarer's Camp" }] } } } }));
    db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run("placement-a", "source-a", "townsfolk", "npcs:7", "authored", "{}");
    db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run("placement-a", "source-a", "transition", null, "authored", "{}");
    db.query("INSERT INTO source_details VALUES (?, ?, ?, ?, ?)").run("travel-a", "source-a", "placement-a", "transition", JSON.stringify({ transitionId: "travel-a", source: { enabled: true }, actions: [{ effectTeleport: { type: { name: "position" }, position: { x: 2, y: 0, z: 2 } } }] }));
    db.query("INSERT INTO map_space_bindings VALUES (?, ?, ?, ?, ?, ?, ?)").run("build", "binding-a", "a", 1, "scene", JSON.stringify({ origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } }), JSON.stringify({ kind: "scene" }));
    for (const [id, component] of [["icon-a", "10"], ["icon-b", "11"]] as const) {
      db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", "a", 5, 0, 5, 5, 5, null, "null", "[]");
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "d".repeat(64), id.padEnd(64, "0"), "scene", component, "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(`source-${id}`, id, "build", 1, component, "MapIcon", "Assembly-CSharp");
      db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run(id, `source-${id}`, "mapIcon", null, "town", "{}");
    }
    for (const [id, x] of [["region-a", 0], ["region-b", 0.01]] as const) {
      db.query("INSERT INTO regions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", "Shared Region", null, "box", JSON.stringify({ corners: [[x, x], [x + 2, x], [x + 2, x + 2], [x, x + 2]] }), "a", JSON.stringify({ corners: [[x, x], [x + 2, x], [x + 2, x + 2], [x, x + 2]] }), "[]");
    }
    const store = new ArtifactStore(join(root, "objects"));
    const offsets = [{ mapSpaceId: "a", worldX: 0, worldY: 0, source: "reviewed", status: "placed" }, { mapSpaceId: "b", worldX: 0, worldY: 0, source: "reviewed", status: "placed" }] as const;
    const first = await generateMapShards(db, store, offsets);
    const second = await generateMapShards(db, store, offsets);
    expect(first.map((map) => map.resources.map((part) => part.identity.sha256))).toEqual(second.map((map) => map.resources.map((part) => part.identity.sha256)));
    expect(first.map((map) => map.summary.mapSpaceId)).toEqual(["a", "b"]);
    expect(first[0]!.resources.flatMap((part) => part.value.placements.map((placement) => placement[0]))).toEqual(["icon-a", "placement-a"]);
    const servicePlacement = first[0]!.resources.flatMap((part) => part.value.placements).find((placement) => placement[0] === "placement-a");
    expect(servicePlacement?.[3]).toBe("Wayfarer's Camp Flight Point");
    expect(servicePlacement?.[4]).toEqual(expect.arrayContaining(["auctioneer", "banker", "flightPoint"]));
    expect(servicePlacement?.[4]).not.toContain("townsfolk");
    const serviceGeometry = first[0]!.geometry.flatMap((part) => part.value.placements).find((placement) => placement.placementId === "placement-a");
    expect(serviceGeometry?.travel?.destination).toEqual({ status: "resolved", mapSpaceId: "a", position: [2, 2] });
    const cropped = await generateMapShards(db, store, offsets, undefined, new Set(["a", "b"]), new Map<string, readonly [number, number, number, number]>([["a", [0, 0, 4, 4]], ["b", [0, 0, 4, 4]]]));
    expect(cropped[0]!.resources.flatMap((part) => part.value.placements.map((placement) => placement[0]))).toEqual(["placement-a"]);
    expect(first[0]!.resources.flatMap((part) => part.value.regions.map((region) => region.id))).toEqual(["region-a"]);
    expect(first[0]!.resources[0]!.value.mapSpaceId).toBe("a");
    expect(first[0]!.resources[0]!.value).not.toEqual(expect.objectContaining({ mapSpaceId: "b" }));
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});

function stationDetail(stationID: number | null, stationReferenceStatus = "resolved", nativeId: number | null = stationID): Record<string, unknown> {
  return {
    stationID,
    stationReferenceStatus,
    station: nativeId === null ? null : { nativeId, name: "Misleading station name", internalName: null, fileName: null },
  };
}

test("classifies five canonical crafting stations while preserving overlap and search labels", async () => {
  const placements = await publishCraftingPlacements(
    [
      { id: 0, name: "Alchemy" },
      { id: 1, name: "Cooking " },
      { id: 2, name: "Smithing" },
      { id: 3, name: "Furnace" },
      { id: 5, name: "Tailoring" },
    ],
    [
      { id: "station-0", details: [stationDetail(0)] },
      { id: "station-1", roles: ["craftingService", "container"], details: [stationDetail(1)] },
      { id: "station-2", details: [stationDetail(2)] },
      { id: "station-3", details: [{ ...stationDetail(3), craftSkills: [{ name: "Smithing" }] }] },
      { id: "station-5", details: [stationDetail(5)] },
    ],
  );
  const byId = new Map(placements.map((placement) => [placement[0], placement]));
  expect(placements).toHaveLength(5);
  expect(byId.get("station-0")?.[4]).toEqual(["alchemyStation"]);
  expect(byId.get("station-1")?.[4]).toEqual(["cookingStation", "container"]);
  expect(byId.get("station-2")?.[4]).toEqual(["smithingStation"]);
  expect(byId.get("station-3")?.[4]).toEqual(["furnace"]);
  expect(byId.get("station-5")?.[4]).toEqual(["tailoringStation"]);
  const stationCategories = new Set(["craftingStation", "alchemyStation", "cookingStation", "smithingStation", "furnace", "tailoringStation"]);
  for (const placement of placements) expect(placement[4].filter((category) => stationCategories.has(category))).toHaveLength(1);
  expect(expandEssentialPlacement(byId.get("station-1")!, "world").searchText).toContain("Cooking station");
});

test("keeps ambiguous and unsupported crafting references generic", async () => {
  const placements = await publishCraftingPlacements(
    [
      { id: 0, name: "Alchemy" },
      { id: 1, name: "Cooking" },
      { id: 2, name: "Forging" },
      { id: 4, name: "Savers" },
    ],
    [
      { id: "unresolved", details: [stationDetail(0, "unresolved")] },
      { id: "conflicting", details: [stationDetail(0), stationDetail(1)] },
      { id: "savers", details: [stationDetail(4)] },
      { id: "missing", details: [] },
      { id: "typed-conflict", details: [stationDetail(0, "resolved", 1)] },
      { id: "canonical-name-mismatch", details: [stationDetail(2)] },
    ],
  );
  expect(placements.map((placement) => [placement[0], placement[4]])).toEqual([
    ["canonical-name-mismatch", ["craftingStation"]],
    ["conflicting", ["craftingStation"]],
    ["missing", ["craftingStation"]],
    ["savers", ["craftingStation"]],
    ["typed-conflict", ["craftingStation"]],
    ["unresolved", ["craftingStation"]],
  ]);
  expect(expandEssentialPlacement(placements.find((placement) => placement[0] === "unresolved")!, "world").searchText).toContain("Crafting station");
});
