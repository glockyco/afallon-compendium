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
