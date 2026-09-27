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

// Short words that stay lowercase inside a title: "Pint of Ale", "March into the Web".
const TITLE_SMALL_WORDS: ReadonlySet<string> = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "off", "on", "onto", "or", "over", "per", "the", "to", "up", "via", "with"]);

/**
 * A name in title case. The game spells one name in several ways, such as "Mara dreggs" and "Mara Dreggs", so every
 * published name and place label starts each word with a capital letter. Short words inside the name stay lowercase,
 * and no letter becomes lowercase, so "DEV RING" and "Kharn’Dor Gate" keep their capitals.
 */
export function displayName(value: string): string {
  let first = true;
  return plainText(value).replace(/\S+/g, (word) => {
    const small = !first && TITLE_SMALL_WORDS.has(word);
    first = false;
    return small ? word : word.replace(/^([\p{P}\p{S}]*)(\p{Ll})/u, (_, lead: string, letter: string) => `${lead}${letter.toLocaleUpperCase()}`);
  });
}
