## Why

Some game descriptions put a second phrase on its own line by padding the text with a long run of spaces, which wraps in the game's narrow tooltip. Mount items such as Brown Mare read "Mounted speed 40% Can't be used indoors" on one line in the wider item card.

## What Changes

- The publication turns a run of three or more spaces between words in a description into a line break.
- Item pages keep line breaks in descriptions, as class, place, and stat pages already do.

## Capabilities

### Modified Capabilities

- `detail-pages`: game descriptions keep the game's line breaks.

## Impact

`packages/publication` description projection and the item page.
