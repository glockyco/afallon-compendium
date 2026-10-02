## Why

The mechanics guides present their rules as numbered steps, but most of these rules are not steps. The Loot guide numbers nine "steps" that are six separate sources of loot: chests from items, supply packs, cloth, world objects, quest items, and the Dungeon Finder. Crafting and Gathering, Character Progression, Heroic Tier, and Corruption mix unrelated mechanics in the same way. Each guide then repeats its rules in a closed "All rules and sources" list. That list shows game method names, "Bounded decompilation" descriptions, and "Also on Item pages, X" lines, which are internal evidence and not reader text.

The When used section of Adventurer's Supply Pack shows 30 closed disclosures, one for each class and level band. A reader who wants the items for one class at one level must scan all of them.

## What Changes

- **BREAKING** Each mechanics guide is a set of topic sections in place of steps. A section covers one mechanic or one context, such as one source of loot. It has a short lead, states every rule of that mechanic in plain language, and holds the tables and worked examples of that mechanic. Sections are not numbered.
- **BREAKING** The guides no longer have the "Rules reference" disclosure, rule numbers, game method names, evidence descriptions, or lists of the pages where a rule also appears. The rules record and the catalog keep the evidence.
- **BREAKING** A placed rule links the guide section of its rule in place of a step. Every How it works link targets a section anchor. The Found in objects section of item pages gains its How it works link, which the rules record placed but no page showed.
- The Loot rules lead into their linked names, as the rules of the other topics do. A rule with more than ten links shows eight and offers the rest on request.
- The Corruption guide drops its unrendered evidence and unknowns lists.
- The When used section of a supply pack has a tab for each class and a tab for each level band. The level band stays selected when the reader changes the class.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mechanics-pages`: Guides are topic sections without steps or a rules reference. Character Progression orders its sections by topic.
- `corruption-mechanics`: The Corruption guide has topic sections in place of its five steps.
- `detail-pages`: Entity pages link guide sections. Found in objects links its guide section.
- `crafting-and-gathering`: Crafting and node pages link guide sections. The guide states crafting rules in sections, and the catalog keeps their evidence.
- `progression-data`: A placement resolves to the section of its rule. Publication rejects a rule section that its guide does not define.
- `item-property-presentation`: Recipe and When used links target guide sections. Supply pack bands are chosen by class and level tabs.

## Impact

- Contracts: `packages/contracts/src/public/documents.ts` mechanics documents, `MechanicsRuleSchema`, `PlacedRuleSchema`, and the static schema ids of every document kind that carries placed rules.
- Publication: `packages/publication/src/guide-steps.ts` (replaced by guide sections), `placed-rules.ts`, `mechanics.ts`, `documents/items.ts`, `documents/npcs.ts`, and their tests.
- Site: the five guide pages, `GuideSteps.svelte`, `MechanicsRules.svelte`, `rule-numbers.ts`, `HowItWorks.svelte` and its callers, `ContainerSection.svelte`, `TabSet.svelte` and `tab-state.ts`, and `ItemPage.svelte`.
- Evidence: a new rules record for build 25653798 with the Loot phrases and placements. The evidence objects do not change.
- Artifacts: a catalog with the new rules record, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
