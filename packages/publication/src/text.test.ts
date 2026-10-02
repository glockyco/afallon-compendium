import { expect, test } from "bun:test";
import { displayName } from "./text";

test("names read in title case with one spelling for words in capitals, abbreviations, and apostrophes", () => {
  expect(["march into the Web", "DEV RING", "Bolstering Kit II", "Gold npc", "Aoe blood ground", "CC Power", "Ward’s Observatory", "Korr’Vael Hold"].map(displayName))
    .toEqual(["March into the Web", "Dev Ring", "Bolstering Kit II", "Gold NPC", "AoE Blood Ground", "CC Power", "Ward's Observatory", "Korr'Vael Hold"]);
});

test("keeps a hyphenated pun as the game spells it", () => {
  expect(["Fang-tastic", "Thorek Flame-Keeper"].map(displayName)).toEqual(["Fang-tastic", "Thorek Flame-Keeper"]);
});

test("a colored state at the end of a name reads in parentheses", () => {
  expect(displayName("Wooden treasure chest <color=red>Locked</color>")).toBe("Wooden Treasure Chest (Locked)");
  expect(displayName("<color=red>Locked</color>")).toBe("Locked");
});
