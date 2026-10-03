## Why

The side column of a detail page was a scroll area of its own with scroll chaining turned off. With the pointer over it, the mouse wheel never scrolled the page in Chromium, and in Firefox it scrolled only the column whenever the column was taller than the window. Readers had to move the pointer to the main column to reach the rest of the page.

## What Changes

- The side column has no scroll area of its own. The wheel over it scrolls the page.
- A side column that fits the window still sticks below its top edge while the page scrolls.
- A taller side column follows the page until its far edge is in view and then stays there: its end when scrolling down, its start when scrolling up. Page scrolling alone reaches every part of it.
- Narrow screens keep the side facts in the page flow, as before.

## Capabilities

### Modified Capabilities

- `detail-pages`: how the side column stays available while the page scrolls.

## Impact

Site only: `DetailFrame` and the new `side-follow` module with its tests.
