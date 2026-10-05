## Why

Readers encounter terms from data preparation instead of clear descriptions of known game facts and gaps. Reader-facing copy should explain what is known without implying that missing information means a game mechanic does not exist.

## What Changes

- Replace pipeline terms in site labels, tooltips, empty states, accessibility descriptions, and generated game-document text with plain player language.
- Name otherwise indistinguishable creature versions as Version N instead of Variant N.
- Preserve distinctions between unknown information and confirmed absence, and leave developer-only diagnostics and source identifiers unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Reader-facing copy omits internal pipeline terms, with unknowns explicitly marked.
- `entity-identity`: Generated fallback labels for indistinguishable creatures use Version N.

## Impact

The static site's copy changes immediately. Publication generation changes creature labels, loot-odds explanations, and unresolved map-location explanations in future candidates; the selected publication is not replaced by this change.
