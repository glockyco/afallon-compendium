## Context

See `proposal.md` for the motivation. These facts of the accepted publication `f5fc5486` and its code shape the approach:

- Each of the 118 recipes with a product is the only recipe of that product. Each of the 47 teaching items teaches one recipe. Each recipe has one rank. One recipe, Demonic Bulwark Looted of Smithing, has no product, no materials, and no teaching item. The Smithing page already lists it in its Recipes section.
- Recipe names equal product names for 115 of 118 recipes. The exceptions are Direfang Blade, Ring of Bleed Damage (product Bloodthrall Signet), and Simple Chest Key (product Chest Key).
- `packages/publication/src/kind-registry.ts` has one `pages` flag per kind. The list, search, and route of a kind follow this flag.
- A mechanics rule in the catalog has a topic, a section, an ordinal, a status, a phrase, operands, links, and sources. `packages/publication/src/mechanics.ts` selects the rules of a guide by topic. `packages/publication/src/gathering.ts` selects the rules of a node page with code conditions: the section name, rule id prefixes, and the links of attunement rules.
- Main specs forbid redirects and retained old slugs (`entity-identity`). The parity gate keeps entity keys from search entries and page documents (`game-update-workflow`).
- A talent of a published class already has no page. Its references link to its row on the class page. Recipes follow this pattern.

## Goals / Non-Goals

**Goals:**
- One page holds all facts of a craft.
- Each rule appears where a reader needs it, and the reviewed record states where that is.
- Mechanics pages explain a process in steps before they list rules.

**Non-Goals:**
- No new rules, no changed rule text, and no new evidence. The rule text of the accepted record stays unchanged.
- No new scan or catalog extraction. The catalog candidate differs from the accepted catalog only by the placements.
- No change to talent trees, zones, reference kinds, or item sources. Other changes own them.

## Decisions

### The product page is the home of a craft

The product item page gets a Crafting section. The section shows the station, the skill, the required level, the materials with their quantities, the product quantity when above one, the experience bands, and the items that teach the recipe. The item document embeds the recipe key, so references and parity keep the key.

Alternatives considered:
- Keep recipe pages and copy their facts to the product page. This keeps two pages with the same facts and the same tooltip.
- Put the craft on the teaching item page. 72 of 119 recipes have no teaching item, and a reader searches for the product, not for the recipe item.

The teaching item keeps its page, because it is a real item with drops and a sell price. Its Teaches section shows the same crafting block. Both sections use one site component.

### Recipe references resolve to anchors

A recipe reference links to `/items/<product>/#crafting`. A recipe without a published product links to its row on its skill page, `/skills/<skill>/#recipe-<slug>`. The tooltip of a recipe link shows the crafting block. Search holds one entry for each item. A recipe whose name differs from its product name adds that name as a search alias of the product entry. The productless recipe gets a search entry that points to its skill row.

The registry gets a separate `list` flag. Recipes keep `list: true` with `pages: false`. The Recipes list keeps its columns and facets, and each row links to the Crafting section. Navigation keeps Recipes in the Items group, because the list still exists.

### Rules name their placements

Each rule of the rules record gets a list of placements. The contract in `packages/contracts/src/catalog/mechanics.ts` defines the placement shape:

- `page`: a page kind with placed rules: `items`, `gatheringNodes`, `skills`, `npcs`, `quests`, or `classes`.
- `target`: a section id, or a fact or column id of that page kind. The contract lists the valid targets of each page kind as closed unions.
- `scope`: `all`, `linked`, or a condition of the page kind. `linked` places the rule only on the pages of the entities in its links, such as an attunement rule on its node. The gathering node conditions are `spawned` and `placed`. They replace the rule id prefixes in `gathering.ts`.

A rule has a topic, placements, or both. Each topic has a guide page. A rule without a topic appears only where it is placed. The publication fails when a placement names an unknown page kind, target, or condition. It also fails when a rule has neither a topic nor a placement.

Alternatives considered:
- Keep placement in publication code. The reviewed record then does not show where a reader meets a rule, and every new rule needs a code change.
- One topic per page kind. Topics group rules for a guide, and pages need rules from several topics.

### Placed rules explain facts, columns, and sections

A rule placed on a fact or column becomes the explanation of that label on hover, focus, and tap. The detail-pages spec already requires this for columns whose values follow a game rule. A rule placed on a section appears in the How it works section at the end of the page. The rows of How it works are grouped by the guide section of each rule, and the section links the guide of each topic. Gathering node pages rename their Rules section to How it works.

The publication computes page values for two rules in this change: the experience bands of a recipe, which it computes already, and the gathering yield bonus. The bonus appears at the node's required skill level, or at level 1 when the node has no level gate, and at the highest level of its skill. Other placed rules show their general phrase.

Initial placements:

| Rules | Page and target |
|---|---|
| recipe gate, craft needs, product roll, experience bands, rounding, condition, modifiers | item, Crafting section and its columns |
| recipe item tooltip | item, Teaches section |
| node selection, availability, rewards | gathering node, How it works, with `spawned` or `placed` where the current code limits them |
| attunement | gathering node, How it works, `linked` |
| weapon skills, skill sources, skill award modifiers | skill, How to gain experience |
| kill experience rules | NPC, experience range fact |
| quest experience rules | quest, experience reward |
| talent point modifiers | class, talent points fact |

### Guides explain before they list

A mechanics document gets these fields in addition to its current facts: an overview of at most three sentences, an ordered list of steps, and one worked example. Each step has a title, one sentence, and the ids of the rules that it summarizes. The publication checks that each id exists in the topic. The overview and steps are publication text in `packages/publication/src/mechanics.ts`. The publication computes the worked example from published facts with the verified rules of the topic. When the example names an entity, a fixed rule selects the entity:

| Guide | Steps | Worked example |
|---|---|---|
| Character Progression | kill: base roll, level difference, Heroic multiplier, party split, experience stat, world modifier. Quest: reward level scale, amount. Skill: source, modifiers. | The fixed-level creature with experience whose name sorts first, at its own level, without modifiers. |
| Heroic Tier | kill multiplier, Essence: base plus affixes, rank multiplier, health factor, carry | A table of Heroic Essence per kill for each creature rank and affix count at the health baseline. The published NPC health stat has no verified mapping to the health factor, so the example names no creature. |
| Crafting and Gathering | craft: gate, needs, product roll, experience band. Gather: spawner pick, availability, node use, loot roll, yield bonus, experience. | Runeweave Regalia bands, and Small Iron Vein yield bonus. The publication fails when either entity is absent, so a later build selects new examples in review. |

The current key tables stay: the level curve, the Heroic settings, and the spawner examples. The full rule list moves into a closed disclosure named "All rules and evidence" at the end of the page.

Alternatives considered: a free-text article for each guide. It cannot link its numbers to the record, and it drifts from the rules.

## Risks / Trade-offs

- [External links to recipe pages break.] → The main specs forbid redirects. Search finds each craft by the product name and by a differing recipe name.
- [Placements drift from the rules.] → The publication fails on unknown targets. A publication test checks that every rule of a topic appears in its guide disclosure and on each placement.
- [A worked example names an entity that a later build removes.] → The publication fails, and the update review selects a new example.
- [Item pages grow.] → The Crafting section is one compact block, and the section list follows the existing four-section rule.
- [How it works repeats guide text.] → A placed rule shows only the rules of that page, and the guide shows each rule once in its disclosure.

## Migration Plan

1. Write a new rules record with placements. Keep every rule text and evidence entry of the accepted record `8e29163c`. Register it, and build a catalog candidate.
2. Publish a candidate, and stage it against the accepted publication `f5fc5486`. Parity must show no lost key: recipe keys move into item Crafting sections and one skill row.
3. Check the affected pages in the browser at 1440 px and 390 px, write the update report, and accept the catalog and publication together. The publication `f5fc5486` stays the rollback.
4. `publish-item-uses-and-sources` then continues on this base and places its rules through placements.
