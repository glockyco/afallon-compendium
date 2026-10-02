/**
 * One part of a rule phrase. `{name}` names an operand of the rule, and `{#n}` names link `n` of the rule inside the
 * sentence. A phrase without link tokens ends with words that lead into the closing list of its links.
 */
export type PhrasePart = { kind: "text"; text: string } | { kind: "operand"; name: string } | { kind: "link"; index: number };

const TOKEN = /\{(?:([a-z][A-Za-z0-9]*)|#(\d+))\}/g;

/** The text, operand, and link parts of a rule phrase, in reading order. */
export function phraseParts(phrase: string): PhrasePart[] {
  const parts: PhrasePart[] = [];
  let last = 0;
  for (const match of phrase.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ kind: "text", text: phrase.slice(last, match.index) });
    parts.push(match[1] !== undefined ? { kind: "operand", name: match[1] } : { kind: "link", index: Number(match[2]) });
    last = match.index + match[0].length;
  }
  if (last < phrase.length) parts.push({ kind: "text", text: phrase.slice(last) });
  return parts;
}

/**
 * Why the link tokens of a phrase do not fit its links, or undefined when they fit. A phrase names every link exactly
 * once, or names none and closes with the list of its links.
 */
export function phraseLinkProblem(phrase: string, linkCount: number): string | undefined {
  const indexes = phraseParts(phrase).flatMap((part) => part.kind === "link" ? [part.index] : []);
  if (indexes.length === 0) return undefined;
  const outside = indexes.filter((index) => index >= linkCount);
  if (outside.length > 0) return `names links [${outside.join(", ")}] that the rule lacks`;
  const repeated = indexes.filter((index, position) => indexes.indexOf(index) !== position);
  if (repeated.length > 0) return `names links [${[...new Set(repeated)].join(", ")}] more than once`;
  const unnamed = Array.from({ length: linkCount }, (_, index) => index).filter((index) => !indexes.includes(index));
  if (unnamed.length > 0) return `leaves links [${unnamed.join(", ")}] out of its sentence`;
  return undefined;
}
