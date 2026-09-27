## Why

The compendium cannot tell a player which class learns an ability, what a talent gives, which profession tier unlocks a recipe, what an effect does, or how much experience a level needs. The recovered game types declare all of these facts, but the support scan records only the names of classes, spellbooks, talent trees, bonuses, effects, enchantments, skills, and level templates. 228 of the 325 ability pages name no user, and the compendium cannot say whether a class, a talent, or a profession gives any of those abilities.

## What Changes

- The support collector records the gameplay data of these game tables:
  - classes: auto-attack ability, base stats and their growth per level, skill bonuses, level template, spellbooks, talent trees, starting items, action abilities, and stat allocation;
  - spellbooks: source (class or weapon) and nodes, each with its ability or bonus and its unlock level;
  - talent trees: tier count, talent point type, and nodes, each with its ability, bonus, recipe, or resource node, its tier and row, and its requirements;
  - bonuses (passive talents): ranks with unlock cost, requirements, and stat changes;
  - talent points: starting amount, maximum, and the ways a character gains them;
  - skills (professions): maximum level, level template, talent trees, stats, starting items, and action abilities;
  - level templates: the experience that each level requires;
  - effects: type, tag, duration, stack limit, pulses, and for each rank the damage, healing, stat changes, nested effects, and other outcomes;
  - enchantments: the items that accept them, and for each tier the costs, success chance, time, skill experience, and stats;
  - stats: limits, base value, regeneration, categories, stat bonuses, and on-hit effects;
  - factions: reputation stances with their thresholds, and default relations to other factions;
  - abilities: type, whether a character knows them by default, and for each rank the activation, cast and channel time, cooldown, range, target type, and applied effects.
- Talent nodes and bonus ranks keep their requirements through the requirement projection that the scan already uses for items, quests, and loot tables.
- **BREAKING** for evidence: the support evidence schema becomes `compendium.support.v2`. A catalog built from this change reads only v2 support evidence.
- The catalog decodes these records into typed facts and relations: which classes learn each ability and at which level or talent tier, which talent nodes unlock each recipe and resource node, and which abilities and effects apply each effect.
- One new scan of scene 44, the canonical target of build 25434619, and a catalog candidate from it. The new scan replaces the current scene 44 scan in the catalog plan. The other five scene scans stay unchanged.
- No page changes. The publication ignores the new facts in this change. Follow-up changes publish class, skill, effect, enchantment, faction, and reference pages. After them, a list change polishes the Places and Abilities lists, adds a Class column to the ability list, and specifies the list filters. The NPC Place filter, which matches each place of an NPC, has no spec yet.

## Capabilities

### New Capabilities

- `progression-data`: what the catalog records about classes, spellbooks, talent trees, bonuses, talent points, skills, level templates, effects, enchantments, stats, factions, and ability ranks, and the relations that it derives from them.

### Modified Capabilities

None.

## Impact

- Scan: `packages/scan/src/probes/collectors/support.csx` gains projections, and `packages/scan/src/collectors.ts` composes the support collector with the shared `conditions` module.
- Contracts: `packages/contracts/src/raw/database.ts` (`SupportSchema` v2) and `packages/contracts/src/catalog/facts.ts` (new fact types in `CatalogFacts`).
- Catalog: decoders, normalization, SQLite tables, and queries in `packages/catalog/src/`, with their tests.
- Runtime: one scan of scene 44 through HotRepl with the configured research character, a new catalog plan, and a catalog candidate.
- Publication, site, and the accepted publication: unchanged. The catalog candidate is accepted together with the first publication that uses its facts.
