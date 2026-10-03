## Why

Short reader-facing labels vary between views of the same data: the Classes gallery says “Filter Classes by Name” and “6 Classes,” while its table says “Filter classes by name” and “6 classes.” This inconsistency also occurs in published labels and mechanics headings, so the site needs a single documented convention and a regression check.

## What Changes

- Use Title Case for title-like noun headings, page titles, navigation, tabs, table headers, buttons, and action links. Keep sentence-like headings, fields, counts, facts, placeholders, authored filter values, and prose in sentence case.
- Share one gallery/table search-and-count control, and correct source-authored labels without changing game names or the counted hidden-entry reveal exception.
- Audit prerendered route kinds and client-rendered views, and reject clear new label regressions during deployment verification.

## Capabilities

### New Capabilities
- `reader-casing`: Consistent casing for titles and actions versus sentence-like labels, counts, facts, and prose.

### Modified Capabilities
- `crafting-and-gathering`: Replace the older blanket sentence-case heading and column convention with title-like headings and table columns in Title Case.
- `reference-layout`: Keep search placeholders sentence case while the surrounding navigation follows the title convention.

## Impact

The site’s Svelte reader components and shared formatters, publication label generators, README reader-text conventions, deployment assertion, and relevant label tests change. No game-provided names or game facts change. Regenerating a publication is necessary for labels stored in publication documents; the site-only changes appear when the site is rebuilt.
