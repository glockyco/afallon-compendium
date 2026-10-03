## Context

Item document projection already computes `facts.heroic` using the verified creature drop path and paused-area rules. The item list carries slots and rarities but not Heroic eligibility. The mechanics page is prerendered from staged publication data.

## Goals / Non-Goals

**Goals:** Derive a compact picker roster from the same item documents used by item pages, render it on the prerendered mechanics page, and load one full item document on selection.

**Non-Goals:** Change creature comparison controls, level inputs, native game eligibility rules, or the publication format.

## Decisions

- The mechanics route loads the staged item list and candidate gear documents on the server, retaining only references, slot, and rarity of documents with `facts.heroic`. The page never introduces an independent eligibility approximation or downloads all item documents to the browser.
- The picker uses a labelled combobox with a bounded, scrollable listbox, item artwork and rarity CSS tokens shared with item links. Arrow keys and Enter select a result. The selected item document loads through the existing client publication loader.
- Its copy names the tier condition independently of the creature widget and links directly to the item's page for drop sources.

## Risks / Trade-offs

Prerendering the Heroic page reads candidate gear documents once to produce a reliable roster. This moves the extra work to the build rather than every reader's browser and avoids changing immutable staged publication resources.
