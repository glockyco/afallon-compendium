## Why

The catalog records effects, stats, enchantments, and factions, but the publication does not give them linked homes. Readers cannot follow their references or inspect recorded rules. Separate pages for every record would obscure the useful relationships in this build.

## What Changes

- Publish one glossary page each at `/effects/`, `/stats/`, and `/factions/`. Give every reachable catalog record one anchored row, a search entry, a link target, and a tooltip based on that row.
- Show recorded effect behavior, applications, and requirements. Show stat meanings and verified rules, with links to filtered items and the classes and skills that name the stat. Show faction stances, default relations, member counts, and filtered NPCs.
- Put each enchantment's recorded tiers, eligibility, costs, rate, time, and skill facts in the Enchants section of its item page. Publish `/enchantments/` as a list of enchanting items linked to those sections. Give an enchantment without a published item an anchored list row and a coverage gap.
- Put the four entry points in the Reference navigation group. Keep every reachable catalog record and its entity key. Label absent links and evidence without inventing values.

## Capabilities

### New Capabilities

- `reference-kinds`: Define glossary rows, item Enchants sections, the enchantment list, search, tooltips, and reference targets for these kinds.

### Modified Capabilities

None. The new capability defines the added item section without replacing an existing item-page requirement. Its search and document keys satisfy the existing publication parity requirement.

## Impact

The change updates catalog queries and, only if evidence requires it, capture and catalog extraction. It adds public glossary and item-section contracts, publication projections, reference resolution, search entries, and site views. It uses the Reference navigation group from `build-compendium-hub` and the home-page anchor pattern from `restructure-page-model`. Its stat and faction links depend on URL-backed list filters from `add-list-filters`. The NPC list already has a Faction column and facet. Publication, staging, browser checks, and joint catalog/publication acceptance follow the existing update workflow. No redirects or old slugs are retained.
