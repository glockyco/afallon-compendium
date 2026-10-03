## Why

Entity pages repeat facts, bury the useful answer on phones, and allow controls and separators to cover or interrupt content. The reviewed pages need a consistent reading order and legible facts across desktop and phone widths.

## What Changes

- Prioritize boss difficulty, quest rewards, adventurer identity, class talent links, playable zone contents, and ability effects before secondary detail on narrow screens.
- Deduplicate acquisition routes, item and set facts, and repeated counts while preserving access to full detail.
- Keep metadata, table headings, units, controls, and section navigation readable at phone widths without disturbing desktop layouts.
- Move projected creature combat stats and kill experience into the NPC main column, with a compact level control and readable stat tiles instead of a crowded side card.
- Keep loot chance assumptions in linked help, suppress unnamed internal effect links, and omit creature stat panels that cannot calculate a complete value.
- Group computed and listed item drop rates, place phone quantities under full-width names while keeping chance headings clear, and make identity, service, and gathering facts read consistently across browser widths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Improve detail-page answer priority, responsive relation metadata, section navigation, and ability effect presentation.
- `page-navigation`: The section control is a round button below 1800 px and withdraws while scrolling where the page margin cannot hold it.

## Impact

Detail page components, item tooltip presentation, and entity-specific answer sections in the static site. The published catalog and map behavior are unchanged.
