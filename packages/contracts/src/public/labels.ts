// Short words that stay lowercase inside a title: "Altar of Corruption", "March into the Web".
const SMALL_WORDS: ReadonlySet<string> = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "off", "on", "onto", "or", "over", "per", "the", "to", "up", "via", "with"]);
// Abbreviations that the game writes in several ways ("npc", "Npc", "NPC") read in one way.
const ABBREVIATIONS: ReadonlyMap<string, string> = new Map([["aoe", "AoE"], ["cc", "CC"], ["npc", "NPC"]]);
const ROMAN_NUMERAL = /^(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})$/u;
// A word, split into the punctuation before its letters, its letters, and the punctuation after them.
const WORD_PARTS = /^([\p{P}\p{S}]*)(.*?)([\p{P}\p{S}]*)$/u;

/**
 * One word of a title. An abbreviation takes its fixed spelling and a roman numeral keeps its capitals. A word in
 * capitals only reads as a word: "EAR" becomes "Ear". A short word inside the title stays lowercase when the game writes
 * it in lowercase. Every other word starts with a capital letter and keeps its other letters, so "Korr'Vael" and
 * "Fang-tastic" stay as they are. Punctuation around the word stays.
 */
export function titleWord(word: string, first: boolean): string {
  const [, lead = "", core = "", trail = ""] = WORD_PARTS.exec(word) ?? [];
  const abbreviation = ABBREVIATIONS.get(core.toLocaleLowerCase());
  if (abbreviation !== undefined) return `${lead}${abbreviation}${trail}`;
  if (ROMAN_NUMERAL.test(core)) return word;
  const letters = core.replace(/\P{L}/gu, "");
  const base = letters.length > 1 && letters === letters.toLocaleUpperCase() ? core.toLocaleLowerCase() : core;
  if (!first && base === base.toLocaleLowerCase() && SMALL_WORDS.has(base)) return `${lead}${base}${trail}`;
  return `${lead}${base.charAt(0).toLocaleUpperCase()}${base.slice(1)}${trail}`;
}

/**
 * A category value in title case, such as an item type, a slot, a role, or a place type. The game writes these values
 * as enum words ("QUEST_ITEM", "OFF HAND") or as authored text ("Fishing rod", "One-Hand"), and each reads as one
 * title: "Quest Item", "Off Hand", "Fishing Rod", "One Hand". Underscores and hyphens separate words here, because a
 * category value is not a name.
 */
export function categoryLabel(value: string): string {
  return value.replace(/[_-]+/gu, " ").trim().split(/\s+/u).filter((word) => word !== "").map((word, index) => titleWord(word, index === 0)).join(" ");
}
