## Why

The NPC list offers a Level range filter, but NPC levels are published as text such as "15–30" or "40+". A filter bound only matched numbers, so any minimum or maximum removed every NPC from the list.

## What Changes

- An NPC list row carries the numbers behind its level text: its lowest level and, unless the level has no upper end, its highest.
- A Level bound keeps an NPC whose level range overlaps the bound. A level without an upper end matches any minimum at or above its lowest level.
- The list resource schema becomes `compendium.static-kind-list.v8`, because rows gain the optional `ranges` field.

## Capabilities

### Modified Capabilities

- `list-filters`: range filters for values shown as ranges.

## Impact

`packages/contracts` (list row schema and version), `packages/publication` (NPC list rows), and the site's list filter matching.
