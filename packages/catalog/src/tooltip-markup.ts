import type { TooltipLine, TooltipSpan, TooltipTone } from "@afallon/contracts/catalog";

export type { TooltipLine, TooltipSpan, TooltipTone } from "@afallon/contracts/catalog";

const toneByColor: Record<string, TooltipTone> = {
  "#1EFF00": "positive",
  "#7CE87C": "positive",
  "#7FD4FF": "info",
  "#B8A6FF": "effect",
  "#C9C9C9": "muted",
  "#FF6A5A": "damage",
  "#FF8C6E": "negative",
  "#FFB46E": "control",
  yellow: "description",
};

type StyleTag = { kind: "color"; tone: TooltipTone } | { kind: "italic" };

export class TooltipMarkupError extends Error {}

export function parseTooltipMarkup(source: string): TooltipLine[] {
  if (source.length === 0) throw new TooltipMarkupError("Tooltip text is empty.");
  const lines: TooltipLine[] = [];
  let spans: TooltipSpan[] = [];
  const styles: StyleTag[] = [];
  let cursor = 0;

  const append = (text: string) => {
    if (text.length === 0) return;
    const color = [...styles].reverse().find((style): style is Extract<StyleTag, { kind: "color" }> => style.kind === "color");
    const span: TooltipSpan = { text, tone: color?.tone ?? null, italic: styles.some((style) => style.kind === "italic") };
    const previous = spans.at(-1);
    if (previous && previous.tone === span.tone && previous.italic === span.italic) previous.text += text;
    else spans.push(span);
  };

  const appendText = (text: string) => {
    const parts = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
    for (const [index, part] of parts.entries()) {
      append(part);
      if (index < parts.length - 1) {
        lines.push({ spans });
        spans = [];
      }
    }
  };

  while (cursor < source.length) {
    const open = source.indexOf("<", cursor);
    if (open < 0) {
      appendText(source.slice(cursor));
      cursor = source.length;
      break;
    }
    appendText(source.slice(cursor, open));
    const close = source.indexOf(">", open + 1);
    if (close < 0) throw new TooltipMarkupError(`Unterminated tooltip tag at offset ${open}.`);
    const tag = source.slice(open + 1, close);
    if (tag === "i") styles.push({ kind: "italic" });
    else if (tag === "/i") {
      if (styles.at(-1)?.kind !== "italic") throw new TooltipMarkupError(`Mismatched </i> at offset ${open}.`);
      styles.pop();
    } else if (tag.startsWith("color=")) {
      const authoredColor = tag.slice("color=".length);
      const color = authoredColor.startsWith("#") ? authoredColor.toUpperCase() : authoredColor.toLowerCase();
      const tone = toneByColor[color];
      if (!tone) throw new TooltipMarkupError(`Unsupported tooltip color ${authoredColor} at offset ${open}.`);
      styles.push({ kind: "color", tone });
    } else if (tag === "/color") {
      if (styles.at(-1)?.kind !== "color") throw new TooltipMarkupError(`Mismatched </color> at offset ${open}.`);
      styles.pop();
    } else throw new TooltipMarkupError(`Unsupported tooltip tag <${tag}> at offset ${open}.`);
    cursor = close + 1;
  }

  if (styles.length > 0) throw new TooltipMarkupError(`Unclosed tooltip tag <${styles.at(-1)!.kind}>.`);
  if (spans.length > 0 || !source.endsWith("\n") && !source.endsWith("\r")) lines.push({ spans });
  return lines;
}
