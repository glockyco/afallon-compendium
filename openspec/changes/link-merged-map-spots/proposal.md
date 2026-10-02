## Why

The map shows one marker where several objects stand at the same spot. A dungeon entrance marker also absorbs the teleports beside it. The marker keeps the id of one object, and the other objects get no marker. A page that names such an object finds no published spot and drops it. Barrowdeep shows "From Afallon" with no spot, although the map shows the Barrowdeep entrance.

## What Changes

- The map publication records which published marker shows each object that a marker absorbed.
- Page rows that name an absorbed object link the marker that shows it. A row counts each marker once.
- Place variants list the markers that show their absorbed objects.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-publication`: Page spots link the marker that shows them.

## Impact

- Publication: `map-shards.ts` records absorbed objects, `build.ts` resolves them for page projection, and `publishedPlacements` and place creature rows count markers once.
- No schema changes. Documents gain spots that they lost before.
