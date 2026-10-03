## Why

Hovering a link inside a sentence could move the sentence's last word to the next line in Firefox. The hover card was inserted beside its link inside the line, and Firefox then shaped the text around it without the kerning across the split, which widened the link by about a pixel.

## What Changes

- Hover cards and hints move to the end of the page while they are open, so the text they describe keeps its layout.
- They no longer inherit the font and spacing of the cell or sentence they describe.

## Capabilities

### Modified Capabilities

- `compendium-tooltips`: opening a tooltip or hint leaves the surrounding text in place.

## Impact

Site only: the shared floating panel placement.
