## Why

The counted reveal hides inaccessible entries, but "No Known Way" and "No Known Use" do not tell readers what is missing. The same labels leak through filters and ability source cells, making the list harder to understand even after revealing entries.

## What Changes

- Name what is missing on each list's reveal button, with singular and plural wording, while preserving matched counts and reveal/search behavior.
- Explain hidden entries in one plain sentence on hover, focus and touch.
- Publish stable facet keys separately from reader-facing labels. A hidden ability has no Source value, so only its Availability filter names the missing use.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-filters`: Hidden reveal wording, explanation, and facet labels for Items, NPCs and Abilities.
- `reference-layout`: The Abilities Source column and Source filter omit missing-use placeholders and leave that explanation to Availability.
