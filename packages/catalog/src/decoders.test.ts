import { expect, test } from "bun:test";
import { decodeItemGameplay, decodeNpcGameplay, decodePropertyGameplay, decodeQuestGameplay, decodeTaskGameplay, decodedReference } from "./decoders";

const reference = { path: "objects/gameplay.json", sha256: "a".repeat(64) };
const enumValue = (value: number, name: string) => ({ value, name });
const reward = (value: number, name: string) => ({ rewardType: enumValue(value, name), itemId: -1, currencyId: -1, treePointId: -1, factionId: -1, weaponTemplateId: -1, count: 1, experience: 0 });

test("decodes every supported canonical gameplay enum", () => {
  expect(decodeItemGameplay({ itemType: { available: true, name: "WEAPON" }, armorSlot: { available: true, name: "HEAD" }, weaponType: { available: true, name: "SWORD" }, armorType: { available: true, name: "PLATE" }, weaponSlot: { available: true, name: "MAIN_HAND" }, rarity: { available: true, name: "RARE" }, sockets: [{ gemSocketType: { available: true, name: "RED" } }] }, reference, "/items/0/gameplay").issues).toEqual([]);
  expect(decodeNpcGameplay({ npcType: enumValue(3, "BOSS"), creatureType: enumValue(6, "ELEMENTAL"), npcFamily: { available: true, name: "FAMILY" }, lootSpecializationArmorType: { available: true, name: "PLATE" }, lootSpecializationWeaponType: { available: true, name: "SWORD" }, lootSpecializationWeaponType2: { available: true, name: "AXE" }, lootSpecializationWeaponType3: { available: true, name: "MACE" } }, reference, "/npcs/0/gameplay").issues).toEqual([]);
  expect(decodeQuestGameplay({ objectives: [{ objectiveType: enumValue(0, "task"), taskId: 7, timeLimit: 0 }], rewardsGiven: [reward(0, "item"), reward(1, "currency"), reward(2, "treePoint"), reward(3, "Experience"), reward(4, "FactionPoint"), reward(5, "weaponTemplateEXP")] }, reference, "/quests/0/gameplay").issues).toEqual([]);
  expect(decodePropertyGameplay({ propertyType: enumValue(0, "House") }, reference, "/properties/0/gameplay").issues).toEqual([]);
  for (const [taskTypeValue, taskType] of ["enterScene", "enterRegion", "learnAbility", "learnRecipe", "killNPC", "getItem", "reachLevel", "reachSkillLevel", "useItem", "talkToNPC", "reachWeaponTemplateLevel", "killNPCFamily"].entries()) expect(decodeTaskGameplay({ taskType, taskTypeValue }, reference, `/tasks/${taskTypeValue}/gameplay`).issues).toEqual([]);
});

test("decodes projected gem data without inventing absent values", () => {
  const decoded = decodeItemGameplay({ gemDataAvailable: true, gemData: { socketType: "", gemSocketType: { available: true, name: "Blue Gem" }, statsAvailable: true, stats: [{ statId: 27, amount: 8, isPercent: false }] } }, reference, "/items/0/gameplay");
  expect(decoded.value.gemData).toEqual({ socketType: "", gemSocketType: { available: true, name: "Blue Gem" }, statsAvailable: true, stats: [{ statId: 27, amount: 8, isPercent: false }] });
});

test("records unsupported and unavailable enum values as coverage issues", () => {
  expect(decodeNpcGameplay({ npcType: enumValue(99, "UNKNOWN") }, reference, "/npcs/0/gameplay").issues).toEqual([{ path: "/npcs/0/gameplay/npcType", detail: "Unsupported enum value 99 (UNKNOWN)." }]);
  expect(decodeItemGameplay({ itemType: { available: false } }, reference, "/items/0/gameplay").issues).toEqual([{ path: "/items/0/gameplay/itemType", detail: "Enum value is unavailable." }]);
});

test("turns negative reference sentinels into labeled unresolved references", () => {
  expect(decodedReference(-1, "Unknown ability")).toEqual({ nativeId: null, label: "Unknown ability" });
  expect(decodedReference(12, "Known ability")).toEqual({ nativeId: 12, label: "Known ability" });
});
