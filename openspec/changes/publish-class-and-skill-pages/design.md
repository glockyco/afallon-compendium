## Context

See proposal.md for the motivation. The catalog returns the progression data in `queryCatalogFacts(db).records.progression`: facts for classes, skills, level templates, talent trees, bonuses, and abilities, the talent and spellbook nodes, and the learners of each ability. The publication does not read it.

The kind registry in `packages/publication/src/kind-registry.ts` already lists `classes` and `skills` with `pages: false`, so references to them show their names as text. The site routes `[kind]` and `[kind]/[slug]` are generic, and the top navigation lists every registry kind with pages. Each page kind still needs a public document schema, a projector in `packages/publication/src/documents.ts`, a row builder in `packages/publication/src/lists.ts`, and a detail component and a tooltip component in `apps/site/src/lib/`.

Measurements on candidate catalog 3ed38843:

- Talent tree nodes: 660 (515 passive talents, 145 abilities). 619 of the 660 nodes have at least one requirement. Across these nodes there are 406 talent requirements, 220 ability requirements, and 46 level requirements, and one node can have several.
- Talent requirements read "bonuses 288 4 or higher", because talents are not catalog entities, so the reference index of the queries has no name for them.
- Ability ranks: 76 abilities have use requirements, such as costs ("Mana 9") and active forms ("Ursine Aspect is active"). The ability tooltips show neither. 369 of 370 abilities have one rank.
- Talent sharing: 15 passive talents appear in several Heroic Ascension trees, one tree for each class. Each tree has one owner class.
- Class choice: a read-only probe of the game database shows that Dwarf, Human, and Orc each offer Shieldmaster, Wizard, Necromancer, Assassin, and Druid. No race offers Hunter or Berserker. [INFERENCE] Character creation lists `RPGRace.availableClasses`. The recovered code has no method bodies that show this use.
- Level templates: all classes use "ClassLevels" (60 levels). Weapon skills use one 300-level template, and the other skills use another. The template gives 20 experience to level 1, 40 to level 2, and 939,124 to level 60. The recovered code does not show whether a value is the experience to complete that level or the total.
- Skills have no descriptions. 15 of 16 skills have an icon, and all 7 classes have one.

## Goals / Non-Goals

**Goals:**
- Class and skill pages, lists, search entries, and tooltips.
- The Learned by section and the use requirements on ability pages.
- Readable progression requirements, and talent references that resolve to their row.
- The acceptance of the new catalog together with the first publication that reads its progression facts.

**Non-Goals:**
- Effect, stat, enchantment, and faction pages. The next change adds them, together with a grouped top navigation.
- Pages for talent trees and passive talents. Their rows live on the class page.
- Class stat growth. A class holds two stat lists (`stats` and `customStats`), Druid has both, and the recovered code does not show how the game combines them.
- Gathering sources on skill pages. The catalog does not link resource nodes to skills, and `resource_ranks` is empty.
- The Class column of the ability list. The list change that follows the effect pages adds it.

## Decisions

### Decide the offered classes from race evidence

The support collector projects `availableClasses` of each race into the race gameplay, and the catalog decodes it into a `races` progression fact. The offered classes are the classes that at least one race names. A hard-coded list of class names was rejected: a game update can add or offer a class, and the publication would not see it. Support evidence stays `compendium.support.v2`, because `gameplay` stays a permissive object, and v2 has no accepted catalog yet. The change needs one new scan of scene 44 and a catalog rebuild, which take about six minutes.

### Two new page kinds and a new ability document

The registry entries of `classes` and `skills` become `pages: true` and `searchable: true`. The contracts add `compendium.static-class.v1` and `compendium.static-skill.v1`, and the ability document becomes `compendium.static-ability.v4`, with learners and use requirements for each version. Hunter and Berserker keep `pages: false` behavior as references: the reference map gives them no slug, so their names stay text.

The class list shows the talent trees and the number of abilities. The skill list shows the highest level and the number of recipes. The top navigation grows from 8 to 10 links. A measurement with the running site showed one row of links at 1440 px, and two rows at 390 px, as today.

### Talent rows own the talent references

A class document holds one table for each talent tree. Each row has the anchor `talent-<tree>-<node>` and holds the node, its tier, its position, its requirements, and, for a passive talent, the effect at its first rank and at its last rank. A talent reference is a class page reference: its `key` and `kind` are those of the class, its `slug` names the class page, its `variant` names the row anchor, as NPC variant references do, and its `name` is the talent name. So talent references add no entity keys to the publication. Because 15 talents appear in several Heroic Ascension trees, the projector resolves a talent reference on a class page to the row of the same class. Separate talent pages were rejected: 497 talents with one or five ranks each would make many thin pages, and the tree order would be lost.

The tooltip of a talent reference loads the class document and shows the row that its anchor names.

### Effects of passive talents come from authored data

A rank shows its stat changes, such as "+2 Block chance" or "+10% Haste", and the tooltip text that the game authored for ranks without stat changes. The tooltip text passes through the existing tooltip markup parser. The row shows the first rank and the last rank. All ranks were rejected: 296 talents have five ranks, and the first and last ranks already show the range. The game has no generator for talent tooltips, so no native text is available.

### Requirement phrases are built at query time

`requirementSpans` in `packages/catalog/src/queries.ts` builds the phrases for the `Bonus`, `Ability`, and `StatCost` requirement types. The reference index of the queries adds the names of progression facts that are not entities: talents, level templates, and talent points. These phrases change the query output, not the catalog tables. So they need no catalog rebuild, and they appear with the next publication.

### Learned by comes from the catalog learners

The ability projector reads `progression.learners`, keeps the learners whose class has a page, and groups them by the version whose record keys include the ability. A talent tree row carries the class reference, the tree name, the tier, the node requirements, and a link to the node row. An auto attack row carries only the class. The hero and the Versions table read the use requirements from the conditions of the `abilityRank` owner.

### Experience values follow the game's meaning

The Experience per level table shows the template value of each level. A read-only probe compares the level and the experience limit of the loaded research character with the template, and so decides the column label. The class page shows the level template of the class, and the skill page shows the template of the skill up to its highest level.

### One acceptance for the catalog and the publication

The update report of this change covers the new catalog and the publication. The comparison with the accepted catalog 80fe12e0 expects the progression facts, the race facts, the new conditions, and the scan-to-scan differences of scene 44 that the previous change reviewed.

## Risks / Trade-offs

- A class document holds up to 5 trees with about 30 rows each, plus requirement spans. → The task measures the largest class document against the 262,144-byte document budget.
- The character-creation meaning of `availableClasses` is an inference. → The class pages name the races that offer each class, so a reader can see the evidence. A later update that offers Hunter adds its page without code changes.
- The new scan of scene 44 can move the placements that the previous change reviewed again. → The comparison reports them, and the user accepted such height differences.
- The experience probe needs the running game. → The game already runs for the scan, and the probe only reads.

## Migration Plan

Capture the race class lists, rescan scene 44, and build and compare the catalog candidate. Implement the contracts, publication, and site changes. Publish a candidate with the new catalog, stage it against the accepted publication 808fafa2, check it in the browser at 1440 px and 390 px, and accept the catalog and the publication with one update report. The accepted build keeps 808fafa2 as its rollback.
