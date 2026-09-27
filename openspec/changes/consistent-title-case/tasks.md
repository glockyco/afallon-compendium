## 1. Rule

- [x] 1.1 Add `titleWord` and `categoryLabel` to `packages/contracts/src/public/labels.ts`, and verify with unit tests for enum and authored values, words in capitals, roman numerals, abbreviations, and capitals inside a word
- [x] 1.2 Make `PUBLIC_MARKER_CATEGORY_LABELS` and the kind registry labels title case

## 2. Publication

- [x] 2.1 Build `displayName` on `titleWord`, change typographic apostrophes to straight ones, and verify with unit tests for words in capitals, abbreviations, apostrophes, and puns with hyphens
- [x] 2.2 Format qualifiers through `categoryLabel` and level qualifiers as "Level N", and update the qualifier tests
- [x] 2.3 Publish a `places` facet for NPC rows, and verify with a list test that an NPC in two places matches each place

## 3. Site

- [x] 3.1 Replace `labelOf` with `categoryLabel`, write fixed category words in title case, and name the Adventure Guide listing as the place page does, then verify with `bun run --cwd apps/site check`

## 4. Verification and acceptance

- [x] 4.1 Run `openspec validate consistent-title-case --strict`, `bunx tsc -b packages/contracts`, `bun run check`, `bun run --cwd apps/site check`, and `bun test ./packages ./apps`
- [ ] 4.2 Publish a candidate and check the item, NPC, and quest filters, an item tooltip, an NPC page, a place page, and the map search in a browser
- [ ] 4.3 Accept the publication
