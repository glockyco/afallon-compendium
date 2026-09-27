## Context

Three formatters shape reader text. The publication's `displayName` capitalizes the first lowercase letter of each word in names and never lowercases a letter. The publication's `readableFact` turns enum qualifiers into sentence case. The site's `labelOf` turns enum values into sentence case and keeps authored values as they are. Category labels in contracts are sentence case, while the map's marker registry uses title case.

## Goals / Non-Goals

**Goals:** one word rule for names and category values, applied where each value becomes text.

**Non-Goals:**
- Headings, fact labels, column labels, hints, and sentences. They stay in sentence case.
- Requirement sentences, such as "One handed sword equipped". The catalog queries build them when a publication runs, and a separate fix gives their item types the category rule.
- Redirects for changed slugs. The slug policy publishes none.

## Decisions

### One word rule

`titleWord(word, first)` in `packages/contracts/src/public/labels.ts` holds the rule for one word, and both packages import it:

1. An abbreviation takes its fixed spelling: NPC, AoE, and CC. These are all the abbreviations in the names of build 25434619.
2. A roman numeral of I, V, and X keeps its capitals ("Bolstering Kit II").
3. A word in capitals only becomes a word: "EAR" becomes "Ear".
4. A short word inside the title stays lowercase when the source writes it in lowercase.
5. Any other word starts with a capital letter and keeps its other letters, so "Korr'Vael" and "SkeletonAttack1" stay.

Punctuation around a word stays, so "(quest" becomes "(Quest".

### Names and category values differ in separators

`categoryLabel` splits a value at underscores and hyphens, because "One-Hand" and "QUEST_ITEM" are enum spellings. `displayName` keeps hyphens, because names such as "Fang-tastic" and "Eggs-traordinary" are puns. `displayName` also changes typographic apostrophes to straight apostrophes. Slugs already drop apostrophes, so this changes no slug.

### Where each rule runs

- The site shows category values through `categoryLabel` and the helpers that fall back to it: `roleLabel`, `npcTypeName`, `creatureTypeLabel`, `sourceKindLabel`, and `questStartLabel`. Fixed category words in components, such as "World Quest", are written in title case.
- `PUBLIC_MARKER_CATEGORY_LABELS` and the kind registry labels are title case.
- The publication formats qualifiers through `categoryLabel` and level qualifiers as "Level 20–30".

### NPC list facet

The Place column of the NPC list names one place or counts them. Its filter used the same value, so an NPC in three places matched only the option "3 places". The row now publishes a separate `places` facet with each place, and the column keeps its summary.

## Risks / Trade-offs

- Slugs with a level qualifier change, for example `glacier-cave-lvl-20-30` becomes `glacier-cave-level-20-30`. → Accepted. The policy publishes no redirects.
- A future abbreviation that is not in the list reads as a word. → Add it to the list when a new build introduces it.

## Migration Plan

Implement the rule, publish a candidate from the accepted catalog, check the lists, tooltips, pages, and map in a browser, then accept the publication.
