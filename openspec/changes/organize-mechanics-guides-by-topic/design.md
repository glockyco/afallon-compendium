## Context

Each mechanics document has `overview`, `steps` of `{id, title, text, rules}`, and a flat `rules` list. `GuideSteps.svelte` renders the steps as a numbered two-column list with "Rule N" links, and `MechanicsRules.svelte` renders every rule again in a closed "All rules and sources" disclosure with `sources` (game method and evidence description) and `appearsOn` ("Item pages, Quest pickups"). `placed-rules.ts` resolves a placement to `stepId` through `guideStepFor`, and `HowItWorks.svelte` links `/mechanics/<topic>/#step-<stepId>`.

The rules record already groups each rule in a `section`: `chests`, `supply-packs`, `cloth`, `world-objects`, `quest-items`, and `dungeon-finder` for Loot; `level-curve`, `all-experience`, `kill-experience`, `quest-experience`, `skill-experience`, and `talent-points` for Character Progression; `kill-experience`, `essence`, and `settings` for Heroic Tier; and `crafting`, `crafting-experience`, `node-selection`, `node-availability`, `node-rewards`, `attunement`, and `skill-experience` for Crafting and Gathering. These sections are the topics of the guides. The steps cut across them: "Pick a node" holds the node selection and the attunement rules, and some rules belong to no step and appear only in the closed list.

The Loot rules append their links without a lead-in ("…between the listed minimum and maximum. Slime Covered Sack, Soaked Bag"), because the `linked` placement scope reads the links to choose the item pages. The other topics end a phrase with words that lead into its links.

The rules record places the object chest and sacrificial altar rules on the `collected-from` section of items, but `ContainerSection.svelte` takes no placed rule, so Found in objects shows no How it works link.

The 30 bands of Adventurer's Supply Pack are six classes with the same five level bands. `TabSet.svelte` keeps its choice in the `tab` query value, and every tab set of a page shares that value.

## Goals / Non-Goals

**Goals:**
- One section for each mechanic or context, with every rule of that mechanic, in place of steps and the closed rule list.
- No evidence text, game method names, rule numbers, or placement lists in reader text.
- How it works links that land on the section that explains the value.
- A supply pack When used that a reader narrows to one class and one level band.

**Non-Goals:**
- New rules or new evidence. The rules keep their claims. Only the Loot phrases change their wording and links.
- A cloth tier table or other new data on the guides.
- Changes to the kill calculator, the level curve, or the corruption comparison.

## Decisions

### The rules record sections are the guide sections

`guide-sections.ts` replaces `guide-steps.ts`. It defines, for each topic, the overview and the ordered sections `{id, title, lead}`. Publication groups the rules of a topic by their record `section`, in record order, and fails when a rule names a section that the guide does not define or when a guide section has no rule. This keeps the grouping in the reviewed record and the reader text in publication, as now. The alternative, a list of rule ids in each section, repeats the record's grouping and lets a rule fall out of every section, as `kill-weapon-templates` falls out of every step today.

Corruption has no record rules. Its five rules stay in `mechanics.ts` with a section each (`altars`, `tokens`, `enemies`, `timed-dungeons`, `gear`) and lose their `method` and `evidence` text. The `evidence` and `unknowns` lists of the Corruption document are removed, because no page renders them and the weapon damage unknown is part of the gear rule.

Sections are not numbered. A section states its rules as a bulleted list, because the rules of one mechanic are facts about it, not stages. A rule that depends on another says "then" in its phrase, as the kill experience rules already do.

### The document nests rules in sections

The mechanics documents replace `steps` and `rules` with `sections: {id, title, lead, rules}[]`. A public rule is `{id, status, phrase, operands, links}`. `section`, `sources`, and `appearsOn` leave the public contract. `compendium.static-mechanics.v9` becomes `v10`.

### A placed rule links a section

`PlacedRule` replaces `stepId` with `section`, the record section of its rule, and publication checks that the guide defines it. `HowItWorks` links `/mechanics/<topic>/#<section>`. The section ids are the anchors of the `Section` components on the guide page. Because `PlacedRule` changes, `compendium.public-placed-rule.v2` becomes `v3`, and every static document schema that holds placed rules gets a new id: items v19, NPCs v9, quests v7, classes v6, skills v6, gathering nodes v5.

The item corruption links name the `gear` and `tokens` sections. The dungeon reward route of an item gets a placed rule for the `timed-dungeons` section in place of the hardcoded `finish-the-timer` step on the item page. `ItemPage` chooses the chest and supply pack links by their sections `chests` and `supply-packs`. `ContainerSection` takes a placed rule and shows its How it works link, so Found in objects links the World objects section.

### The Loot rules lead into their links

A new rules record for build 25653798 rewrites the Loot phrases so that each phrase ends with words that lead into its links, such as "Sacrificial altars give" and "Hunt pickups give". The four supply pack rules link the same pack, and a section link needs only one placement, so only `supply-pack-tables` keeps the link and the `linked` placement. The evidence objects, statuses, operands, and claims do not change.

A phrase with more than ten links shows eight and a "Show N more" control, with the threshold of `shownRowCount` that recipe lists and relation tables use. The sacrificial altar rule links 47 items.

### Sections hold their data

Each guide page renders its sections in document order through `GuideSection.svelte`, and adds the data of a section inside it:

- Character Progression: Level curve (chart), Kill experience (creature counts, the creatures that can spawn above the fixed levels, and the level difference table), then the kill calculator as its own section, Quest experience (quest counts), Experience bonuses, Skill experience, and Talent points (the computed gains).
- Heroic Tier: Kill experience (the multiplier), Heroic Essence (the base, per-affix amount, rank multipliers, health bounds, and the Essence table), and Creature and gear settings.
- Crafting and Gathering: Crafting, Crafting experience (the Runeweave Regalia bands), Node selection (the spawner examples), Node availability, Node rewards (the Small Iron Vein yield bonus), Attunement, and Skill experience.
- Corruption: Altars, Corruption Tokens (the affix disclosure), Corrupted enemies, Timed dungeons (the timer table and bosses), Corrupted gear, then the comparison as its own section.
- Loot: Items that open a chest, Supply packs, Cloth from kills, World objects, Quest items, and Dungeon Finder.

The interactive calculator and comparison stay separate sections after the section that they apply, so that the section list names them.

### Supply pack bands use class and level tabs

`TabSet` gains a `param` property for its query value. The When used section of a supply pack groups its bands by class into a class tab set (`tab`), and each class panel has a level band tab set (`level`) with keys such as `levels-6-11`. A band that names several classes appears under each class. Because the level value is its own query value, changing the class keeps the level band when the new class has it. A group with one class or one band shows no tab list for that choice. The shared pick sentence stays above the tabs. The band's armor and stat filters and its table appear in the level panel. The section count leaves out the bands, because the tabs do not show them as rows.

## Risks / Trade-offs

- The guides show every rule, so the pages are longer than the steps were. → Each section is short and the page section list leads to it. Readers who come from an entity page land on one section.
- Six static document schemas change id for one field. → The clean cutover keeps the contract honest. Staging and the parity checks compare the candidate with the accepted publication.
- A rules record change needs a new catalog. → Only the Loot phrases, links, and placements change. The catalog comparison must show no other rule change.

## Migration Plan

Register the new rules record, build the catalog candidate, publish a candidate against the accepted publication, check the guides and the linked entity pages in the browser, and accept the update. Rollback is the accepted publication `469c8fcb…`.
