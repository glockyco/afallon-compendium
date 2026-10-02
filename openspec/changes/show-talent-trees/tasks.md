## 1. Evidence

- [x] 1.1 Decompile the `TalentTreePanel` methods that place nodes and draw lines. Record how `Tier` and `Row` map to slots, which requirement draws a line, which sprite is the tree icon, and which facts the catalog lacks.

## 2. Capture and catalog

- [x] 2.1 Extend `artwork.csx` with tree and bonus icons, and the progression collector with any layout fact from 1.1 that the catalog lacks. Test the evidence contract with a missing sprite.
- [x] 2.2 Add bonus artwork bindings keyed to progression facts, tree bindings through `artwork_bindings`, and any new layout fact to the catalog contracts, normalization, database, and queries. Test that a bonus binding resolves to its fact, a tree binds to its entity, and a missing sprite keeps its node.

## 3. Scan and acceptance

- [ ] 3.1 Scan build 25653798 with a clean runtime receipt. Build a catalog candidate and compare it with accepted catalog `d3b56f3f`. Explain every row difference.
- [ ] 3.2 Publish from the candidate, confirm that page changes are limited to the planned race-start places and catalog identity or explain every other difference, and accept the catalog and publication together.

## 4. Layout decision input

- [x] 4.1 Save screenshots of the in-game talent tree panel for two classes, including a tree with lines and a Heroic tree.
- [ ] 4.2 Render the same trees from the catalog in a throwaway preview with icons, tiers, rows, and lines, and hand both sets to the owner.
