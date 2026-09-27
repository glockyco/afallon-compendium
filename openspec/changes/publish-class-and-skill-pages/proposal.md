## Why

The compendium cannot tell a player which classes learn an ability or what a talent gives. The catalog now records classes, talent trees, skills, and experience, but the publication does not read them. Of the 325 ability pages, 228 name no NPC user, and a class that a race offers learns 105 of those abilities.

## What Changes

- Class pages for each class that at least one race offers. In build 25434619 these are Shieldmaster, Wizard, Necromancer, Assassin, and Druid. A class page shows one table for each talent tree, with each talent, its first-rank and last-rank effect, and its requirements. It also shows the weapon types, the auto attack, the talent points, the starting gear, and the experience per level.
- Skill pages for the 16 skills, with their recipes, crafting stations, and experience per level.
- Ability pages gain a Learned by section and the use requirements of each version: costs, such as "Costs 9 Mana", and conditions, such as "Ursine Aspect is active".
- Requirement phrases for talents, learned abilities, and costs replace texts such as "bonuses 288 4 or higher" and "Mana 9". A talent reference links to its row on the class page.
- The support collector records the classes that each race offers. No race offers Hunter or Berserker, so these classes get no page, and their abilities name no class.
- Classes and Skills get list pages, search entries, tooltips, and links in the top navigation. A requirement that names a published class or skill links to its page.
- One new scan of scene 44 and a catalog candidate that replaces candidate 3ed38843. The change accepts the new catalog together with its publication.
- Out of scope:
  - effect, stat, enchantment, and faction pages, which follow in the next change;
  - class stat growth, because the class records hold two stat lists, and the recovered code does not show how the game combines them;
  - gathering sources on skill pages, because the catalog does not link resource nodes to skills.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: class pages and skill pages, experience tables, the icon of a class or a skill in the hero, and the Learned by section and use requirements on ability pages.
- `requirements-presentation`: phrases for talent, learned-ability, and cost requirements.
- `entity-identity`: talent references resolve to their row on a class page.
- `progression-data`: races record the classes that they offer.

## Impact

- Scan: `packages/scan/src/probes/collectors/support.csx` projects the class list of each race.
- Contracts: public document schemas for classes and skills, a new version of the ability document, the public page-kind unions in `packages/contracts/src/public/documents.ts`, and the race facts in `packages/contracts/src/catalog/progression.ts`.
- Catalog: race decoding and facts in `packages/catalog/src/progression.ts`, and requirement phrases and talent names in `packages/catalog/src/queries.ts`.
- Publication: class and skill projectors, the Learned by relation and use requirements of abilities, talent row references, the kind registry, list rows, and search entries in `packages/publication/src/`.
- Site: class, skill, and talent components, the ability page sections, and tooltips in `apps/site/src/lib/`.
- Runtime: one scan of scene 44, and one read-only probe that confirms what an experience value means.
- Artifacts: a catalog candidate, a publication candidate, an update report, and the acceptance of both candidates.
