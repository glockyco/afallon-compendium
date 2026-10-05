## Context

Item document projection already computes `facts.heroic` using the verified creature drop path and paused-area rules. The item list carries slots and rarities but not Heroic eligibility. The mechanics page is prerendered from staged publication data.

## Goals / Non-Goals

**Goals:** Derive compact picker rosters from the same item documents used by item pages, render both mechanics comparisons with one searchable control, and load one full item document on selection.

**Non-Goals:** Change creature comparison controls, level inputs, native game eligibility rules, or the publication format.

## Decisions

- The mechanics route loads the staged item list and candidate gear documents on the server, retaining only references, slot, and rarity of documents with `facts.heroic`. The page never introduces an independent eligibility approximation or downloads all item documents to the browser.
- The shared picker shows a closed selected-item button with icon and rarity-colored name. Activation opens a labelled combobox with a bounded, scrollable listbox. Arrow keys and Enter select a result, then focus returns to the selected-item button without selecting its text. The selected item document loads through the existing client publication loader.
- Its copy names the tier condition independently of the creature widget and links directly to the item's page for drop sources.
- Corruption choices come from its guide's item groups, enriched on the server with published item rarity. Its source links show names without empty icon frames when artwork is missing. At phone widths, the shared comparison grid places the item cards before the changes card.

## Risks / Trade-offs

Prerendering the Heroic page reads candidate gear documents once to produce a reliable roster. This moves the extra work to the build rather than every reader's browser and avoids changing immutable staged publication resources.
