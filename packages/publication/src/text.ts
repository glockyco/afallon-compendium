import { titleWord } from "@afallon/contracts/public";

const nativeLineBreaks = /<br\s*\/?>/gi;
const nativeFormatTags = /<\/?(?:color|size|b|i|u|s|font|font-weight|mark|link|align|alpha|cspace|indent|line-height|line-indent|margin|margin-left|margin-right|mspace|nobr|pos|rotate|space|style|sub|sup|voffset|width|uppercase|lowercase|smallcaps)(?:=[^>]*|\s[^>]*)?>/gi;

// Removes the game's rich-text markup and keeps surrounding whitespace, so a text fragment that sits between
// other fragments, such as a requirement span, keeps its spacing.
export function withoutMarkup(value: string): string {
  return value.includes("<") ? value.replace(nativeLineBreaks, "\n").replace(nativeFormatTags, "") : value;
}

export function plainText(value: string): string {
  return withoutMarkup(value).trim();
}

// The game colors a state at the end of some object names, such as "Wooden treasure chest <color=red>Locked</color>".
// The state reads in parentheses, because without its color it would run into the name.
const coloredState = /^(.*\S)\s*<color=[^>]*>([^<]+)<\/color>\s*$/is;

function stateSuffix(value: string): string {
  const match = coloredState.exec(value);
  return match ? `${match[1]} (${match[2]!.trim()})` : value;
}

/**
 * A name in title case. The game spells one name in several ways, such as "Mara dreggs" and "Mara Dreggs", so every
 * published name and place label follows one rule for each word: "DEV RING" reads "Dev Ring", "Gold npc" reads
 * "Gold NPC", and "Bolstering Kit II" keeps its numeral. A hyphen stays inside its word, so the puns "Fang-tastic" and
 * "Eggs-traordinary" keep their spelling. Typographic apostrophes become straight apostrophes.
 */
export function displayName(value: string): string {
  let first = true;
  return plainText(stateSuffix(value)).replaceAll(/[‘’]/gu, "'").replace(/\S+/g, (word) => {
    const formatted = titleWord(word, first);
    first = false;
    return formatted;
  });
}
