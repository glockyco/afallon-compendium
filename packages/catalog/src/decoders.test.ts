import { expect, test } from "bun:test";
import { decodeItemGameplay, decodeNpcGameplay, decodePropertyGameplay, decodeQuestGameplay, decodeTaskGameplay, decodedPrice, decodedReference } from "./decoders";

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

test("validates adventurer roles and flight network references", () => {
  const gameplay = {
    npcType: enumValue(9, "ADVENTURER"), creatureType: enumValue(2, "HUMANOID"), hunterBeastRole: enumValue(1, "Guardian"), isFlightMaster: true, flightStopId: "camp",
    adventurer: { authored: true, classId: 1, preferredTreeId: 3, keepPhaseAbilities: true, raceId: 6, aiLogicTemplateKey: "Templates/Healer", specialization: { available: true, classId: 1, role: enumValue(2, "Healer"), preferredTreeId: 3, behaviorName: "Support", priorityAbilities: [10], blockedAbilities: [], blockedBonuses: [], allowedForms: [] } },
    flightNetwork: { available: true, networkId: "Afallon", sceneName: "Coalway outdoors", mapWorldBounds: { x: 0, y: 0, width: 100, height: 100 }, minimumFlyoverHeight: 40, currencyId: 1, stops: [{ id: "camp", name: "Camp", landingPosition: { x: 1, y: 2, z: 3 }, landingYaw: 90, knownInitially: true }], routes: [{ from: "camp", to: "missing", bidirectional: true, fare: 5, speed: 20, departureCruiseWaypoint: 0, arrivalCruiseWaypoint: 1, waypoints: [] }] },
  };
  expect(decodeNpcGameplay(gameplay, reference, "/npcs/0/gameplay").issues).toEqual([{ path: "/npcs/0/gameplay/flightNetwork/routes/0/to", detail: "Flight route references missing stop missing." }]);
  gameplay.adventurer.specialization.role = enumValue(7, "Unknown");
  expect(decodeNpcGameplay(gameplay, reference, "/npcs/0/gameplay").issues[0]).toEqual({ path: "/npcs/0/gameplay/adventurer/specialization/role", detail: "Unsupported enum value 7 (Unknown)." });
});

test("decodes projected gem data without inventing absent values", () => {
  const decoded = decodeItemGameplay({ gemDataAvailable: true, gemData: { socketType: "", gemSocketType: { available: true, name: "Blue Gem" }, statsAvailable: true, stats: [{ statId: 27, amount: 8, isPercent: false }] } }, reference, "/items/0/gameplay");
  expect(decoded.value.gemData).toEqual({ socketType: "", gemSocketType: { available: true, name: "Blue Gem" }, statsAvailable: true, stats: [{ statId: 27, amount: 8, isPercent: false }] });
});

test("records unsupported and unavailable enum values as coverage issues", () => {
  expect(decodeNpcGameplay({ npcType: enumValue(99, "UNKNOWN") }, reference, "/npcs/0/gameplay").issues).toEqual([{ path: "/npcs/0/gameplay/npcType", detail: "Unsupported enum value 99 (UNKNOWN)." }]);
  expect(decodeItemGameplay({ itemType: { available: false } }, reference, "/items/0/gameplay").issues).toEqual([{ path: "/items/0/gameplay/itemType", detail: "Enum value is unavailable." }]);
  expect(decodeItemGameplay({ itemType: { available: true, name: "Trinket" }, rarity: { available: true, name: "Rare" }, armorSlot: { available: true, name: "Trinket" }, armorType: { available: true, name: "JEWELRY" }, weaponType: { available: false }, weaponSlot: { available: false } }, reference, "/items/1/gameplay").issues).toEqual([]);
});

test("turns negative reference sentinels into absent facts", () => {
  expect(decodedReference(-1, "Unknown ability")).toBeNull();
  expect(decodedPrice(0, -1)).toBeNull();
  expect(decodedReference(12, "Known ability")).toEqual({ nativeId: 12, label: "Known ability" });
});
