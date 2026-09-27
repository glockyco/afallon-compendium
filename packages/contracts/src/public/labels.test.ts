import { expect, test } from "bun:test";
import { categoryLabel } from "./labels";

test("reads enum words and authored category text as one title", () => {
  expect(["QUEST_ITEM", "Quest item", "Fishing rod", "OFF HAND", "One-Hand", "Piercing EAR ", "Altar of corruption"].map(categoryLabel))
    .toEqual(["Quest Item", "Quest Item", "Fishing Rod", "Off Hand", "One Hand", "Piercing Ear", "Altar of Corruption"]);
});

test("keeps roman numerals, abbreviations, and capitals inside a word", () => {
  expect(["Bolstering Kit II", "npc guard", "Korr'Vael Hold"].map(categoryLabel)).toEqual(["Bolstering Kit II", "NPC Guard", "Korr'Vael Hold"]);
});
