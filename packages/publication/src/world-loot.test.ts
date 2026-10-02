import { expect, test } from "bun:test";
import { bandWorldLoot, type WorldLootItem, type WorldLootTable } from "./world-loot";

const item = (key: string, facts: Partial<WorldLootItem>): WorldLootItem => ({
  key, itemType: "ARMOR", weaponType: null, armorType: "PLATE", armorSlot: "CHEST", levelRequirement: 10, questOnly: false, stats: [], ...facts,
});
const items = new Map([
  item("plate", { stats: [27] }),
  item("cloth", { armorType: "CLOTH" }),
  item("ring", { armorType: "JEWELRY", armorSlot: "RING", stats: [135] }),
  item("intellect plate", { stats: [135] }),
  item("staff", { itemType: "WEAPON", weaponType: "Staff", armorType: null, armorSlot: null }),
  item("axe", { itemType: "WEAPON", weaponType: "Axe", armorType: null, armorSlot: null }),
  item("gem", { itemType: "GEM", armorType: null, armorSlot: null, levelRequirement: 0 }),
  item("cloak", { armorType: "CLOTH", armorSlot: "CAPE" }),
  item("intellect axe", { itemType: "WEAPON", weaponType: "Axe", armorType: null, armorSlot: null, stats: [135] }),
  item("quest plate", { questOnly: true }),
].map((row) => [row.key, row]));
const open: WorldLootTable = { minimumLevel: 0, maximumLevel: 0, hasRequirements: false, itemKeys: [...items.keys()] };
const band = { minLevel: 6, maxLevel: 11, armorType: "PLATE", stats: [27] };
const keys = (rows: ReturnType<typeof bandWorldLoot>) => rows.map((row) => row.key).sort();

test("a band gives usable weapons, its armor type, accessories, and gear with a wanted main stat", () => {
  expect(keys(bandWorldLoot(band, [open], items, new Set(["AXE"])))).toEqual(["axe", "cloak", "gem", "plate"].sort());
  expect(keys(bandWorldLoot({ ...band, stats: [27, 135] }, [open], items, new Set(["STAFF", "AXE"]))))
    .toEqual(["axe", "cloak", "gem", "intellect axe", "intellect plate", "plate", "ring", "staff"].sort());
});

test("an item appears from two levels below its requirement to four levels above it", () => {
  const plate = bandWorldLoot({ ...band, minLevel: 1, maxLevel: 20 }, [open], items, new Set()).find((row) => row.key === "plate");
  expect(plate?.levels).toEqual([{ min: 8, max: 14 }]);
});

test("a table's level window bounds its items, and an open band leaves lasting items without an upper level", () => {
  const early: WorldLootTable = { ...open, maximumLevel: 9 };
  expect(bandWorldLoot(band, [early], items, new Set()).find((row) => row.key === "plate")?.levels).toEqual([{ min: 8, max: 9 }]);
  const gem = bandWorldLoot({ ...band, maxLevel: undefined }, [open], items, new Set()).find((row) => row.key === "gem");
  expect(gem?.levels).toEqual([{ min: 6 }]);
});

test("a world loot table with requirements stops publication", () => {
  expect(() => bandWorldLoot(band, [{ ...open, hasRequirements: true }], items, new Set())).toThrow("requirements");
});
