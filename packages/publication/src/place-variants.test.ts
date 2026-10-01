import { expect, test } from "bun:test";
import { derivePlaceVariants } from "./place-variants";

test("attributes 50 copied objects to a dominant host without using a share cutoff", () => {
  const row = (sceneNativeId: number, index: number, offset = 0, role = "container", source = "Chest") => ({
    placementId: `${sceneNativeId}:${index}`, sceneNativeId, position: [index * 2 + offset, 500] as [number, number],
    roles: [{ role, npcEntityKey: null, scope: "authored" }], sourceTypes: [source],
  });
  const host = Array.from({ length: 1200 }, (_, index) => row(47, index));
  const variant = [...Array.from({ length: 55 }, (_, index) => row(41, index, 0.02)),
    ...Array.from({ length: 295 }, (_, index) => row(41, index + 2000))];
  const other = [...Array.from({ length: 19 }, (_, index) => row(38, index, 0.02)),
    ...Array.from({ length: 18 }, (_, index) => row(38, index + 3000))];
  const result = derivePlaceVariants(new Map([["world", [...host, ...variant, ...other]]]));
  expect(result.byScene.get("scenes:41")?.hostKey).toBe("scenes:47");
  expect(result.byScene.get("scenes:41")?.copiedPlacementIds.size).toBe(55);
  expect(result.byScene.has("scenes:38")).toBe(false);
  expect(result.byScene.has("scenes:47")).toBe(false);
});

test("does not match equal roles across map spaces, source types, or entity identities", () => {
  const rows = (scene: number, role: string, source: string, npc: string, spaceOffset = 0) => Array.from({ length: 120 }, (_, index) => ({
    placementId: `${scene}:${index}:${spaceOffset}`, sceneNativeId: scene, position: [index + spaceOffset, 0] as [number, number],
    roles: [{ role, npcEntityKey: npc, scope: "authored" }], sourceTypes: [source],
  }));
  const copiedRole = rows(41, "npc", "Spawner", "npcs:2");
  const copiedSource = rows(42, "npc", "DifferentSpawner", "npcs:1");
  const host = Array.from({ length: 400 }, (_, index) => ({
    placementId: `47:${index}`, sceneNativeId: 47, position: [index, 0] as [number, number],
    roles: [{ role: "npc", npcEntityKey: "npcs:1", scope: "authored" }], sourceTypes: ["Spawner"],
  }));
  const distantHost = rows(60, "npc", "Spawner", "npcs:2");
  expect(derivePlaceVariants(new Map([["world", [...host, ...copiedRole, ...copiedSource]], ["dungeon", distantHost]])).byScene.size).toBe(0);
});
