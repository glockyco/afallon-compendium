# Link Whole Hub Cards

## Why

The dungeon cards, class tiles, and skill tiles on the home page stretch their name link over the whole card, but only the name opened the page. The wrapper around a link with a hover card was positioned, so the stretched link covered only that wrapper. Since hover cards open at the end of the page, nothing needs that positioning. A hover card for a whole card is also more than a reader needs on the home page, and long boss names wrapped onto a second line under their portraits.

## What Changes

- The wrapper around an entity link with a hover card is no longer positioned, so a stretched link covers its whole card again.
- A click anywhere on a dungeon card, class tile, or skill tile opens its page, and pointing at one opens no hover card.
- Boss links inside a dungeon card open their own pages, keep their hover cards, and stay on one line with an ellipsis. Only the boss link sits above the card's stretched link, so the space beside a boss name opens the dungeon.

## Impact

`EntityLink` styles and the home page's card links change. Hover cards elsewhere keep their placement beside the hovered link.
