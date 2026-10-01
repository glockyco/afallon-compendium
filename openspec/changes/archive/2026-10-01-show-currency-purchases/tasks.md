## 1. Catalog Conversion

- [x] 1.1 Preserve the resolved item conversion currency in normalized item facts, query output, and contracts; verify with a focused catalog test.
- [x] 1.2 Build a candidate from stored scan evidence and verify that its catalog differences from 05538f40 are only the conversion field.

## 2. Publication Purchases

- [x] 2.1 Publish currency and grouped purchase offers on item documents, bump the item schema identifier and update fixtures; verify multi-seller and different-cost cases with a focused publication test.
- [x] 2.2 Generate a publication candidate using the new catalog and verify Corrupted Emerald and Gold purchase data.

## 3. Item Presentation

- [x] 3.1 Add a Buys section using the existing relation table and price component, and verify currency and ordinary item pages at 1440 px and 390 px, including preview, expansion, and absence of horizontal overflow.
- [x] 3.2 Select and stage the new publication against the specified previous baseline; verify the staged site's item pages and save the requested screenshots.
