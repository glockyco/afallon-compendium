import { expect, test } from "bun:test";
import { parseTooltipMarkup, TooltipMarkupError, type TooltipTone } from "./tooltip-markup";

const palette: Array<[string, TooltipTone]> = [
  ["#1EFF00", "positive"],
  ["#7CE87C", "positive"],
  ["#7FD4FF", "info"],
  ["#B8A6FF", "effect"],
  ["#C9C9C9", "muted"],
  ["#FF6A5A", "damage"],
  ["#FF8C6E", "negative"],
  ["#FFB46E", "control"],
  ["yellow", "description"],
];

test("parses every observed native color and italic span", () => {
  for (const [color, tone] of palette) {
    expect(parseTooltipMarkup(`<color=${color}><i>Fact</i></color>`)).toEqual([
      { spans: [{ text: "Fact", tone, italic: true }] },
    ]);
  }
});

test("preserves source line order, blank separators, and plain text", () => {
  expect(parseTooltipMarkup("<color=#C9C9C9>Instant</color>\r\n\r\nDeals <color=#FF6A5A>10 Fire Damage</color>\n")).toEqual([
    { spans: [{ text: "Instant", tone: "muted", italic: false }] },
    { spans: [] },
    { spans: [{ text: "Deals ", tone: null, italic: false }, { text: "10 Fire Damage", tone: "damage", italic: false }] },
  ]);
});

test("rejects unknown tags, colors, and malformed nesting", () => {
  for (const source of ["<b>Fact</b>", "<color=#000000>Fact</color>", "<i>Fact</color></i>", "<i>Fact", "Fact<"]) {
    expect(() => parseTooltipMarkup(source)).toThrow(TooltipMarkupError);
  }
});
