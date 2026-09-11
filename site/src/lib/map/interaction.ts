import type { DeckProps } from "@deck.gl/core";

// deck.gl delays a single click until its double-click window expires. Keep double-click
// zoom, but report the first click immediately so selection can update without that wait.
export const MAP_EVENT_RECOGNIZER_OPTIONS = {
  click: {interval: 1},
} satisfies NonNullable<DeckProps["eventRecognizerOptions"]>;
