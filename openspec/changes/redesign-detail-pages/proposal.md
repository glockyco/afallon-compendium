## Why

Entity pages currently expose every available fact with equal weight, including repeated tooltips, long location lists, and rules prose. A lookup reader needs the answer first, while a reader learning the system needs a clear path to a guide.

## What Changes

- **BREAKING** Replace the single full-width hero and uniform section panels with a responsive answer-first main column and a persistent side column on wide screens; rearrange each kind around its primary reader question.
- Present at most five decisive facts in one stat strip, compact relation previews, recipe equations, and places with counts instead of numbered location links. Keep secondary facts in a final Details disclosure.
- Keep the game tooltip visible once on item and ability pages; move rules prose and evidence to mechanics guides and show computed entity-specific values with links to relevant guide steps.
- Make hover cards concise and accessible on hover, focus, and tap. Apply legible type, contrast, control-size, and label rules site-wide, including home and lists.
- Publish the place counts and skill-dependent spawner shares needed for the new pages; resolve confusing authored labels and an inverted gold range without inventing game values.

## Capabilities

### New Capabilities

- None. Existing page, publication, and layout capabilities cover this redesign.

### Modified Capabilities

- `detail-pages`: Responsive hierarchy, page-kind answers and ordering, relation previews, recipes, and computed rule values.
- `item-property-presentation`: Item acquisition and recipe presentation, plus property purchase facts.
- `crafting-and-gathering`: Node answers and crafting computations instead of rule text on entities.
- `progression-data`: Publication-derived place counts and endpoint spawner shares; rule placement targets.
- `mechanics-pages`: Guide steps and anchored links from entities.
- `reference-layout`: Compact hover cards and site-wide accessible presentation.
- `page-navigation`: Section links and anchored rows across previews, disclosures, and tabbed trees.
- `npc-presentation`: Grouped creature locations with conditions intact.
- `entity-identity`: Readable labels in relations and hover cards.

## Impact

Changes affect the SvelteKit detail and guide views, shared CSS/tokens, tooltips, home and lists, publication documents and derived facts, and the static publishing and acceptance workflow. Existing page and row links remain usable; no raw game data or game binaries enter Git.
