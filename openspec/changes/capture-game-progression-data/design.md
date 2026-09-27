## Context

See proposal.md for the motivation. The support collector (`packages/scan/src/probes/collectors/support.csx`) reads the initialized `GameDatabase` and writes one support artifact per scan target. It projects gameplay for four tables only: abilities (tooltip text per rank), recipes, crafting stations, and gear sets. Every other table carries only its entry header. `SupportSchema` (`compendium.support.v1`) accepts any gameplay object, and the catalog decoders type the four projected tables. The catalog reads support evidence from the canonical target of its plan (`admitted.support`), so the support artifacts of other targets do not enter the catalog. The recovered declarations of build 25434619 declare every field that this change records, and the probes of tasks 2.2 and 2.3 show which fields hold values: `RPGClass`, `RPGSpellbook`, `RPGTalentTree`, `RPGBonus`, `RPGTreePoint`, `RPGSkill`, `RPGLevelsTemplate`, `RPGEffect`, `RPGEnchantment`, `RPGStat`, `RPGFaction`, and `RPGAbility`.

## Goals / Non-Goals

**Goals:** typed catalog facts for the tables in the spec, their requirement groups through the existing condition pipeline, and derived relations that pages can read without game knowledge.

**Non-Goals:**
- Pages, lists, and tooltips for the new facts. Follow-up changes publish them.
- Races, dialogues, combos, species, weapon templates, and game modifiers. Races were not chosen, and the other tables hold 0 to 5 records in build 25434619.
- Links from weapon spellbooks to weapon templates. Build 25434619 has no weapon templates, so the catalog records only the source of each spellbook.
- Visual, animation, sound, prefab, collider, layer mask, socket, and editor fields of the game types.
- Runtime evaluation of requirements. The catalog keeps them as authored.

## Decisions

### Extend the support collector

Each table gets a projection function in `support.csx`, like the existing gear set projection. A new collector was rejected: it would need its own artifact, schema, admission, and plan wiring, and the support collector already enumerates these tables for the canonical target. The support collector composes the `conditions` module, as `relationships` does, so talent tree nodes and bonus ranks project their requirement groups with the shared `projectGroup`. A node or rank that uses a requirements template records the requirement groups of that template and states that it uses the template.

Each projection records enum values as `{ value, name }`, as other collectors do. A null record, list, or list member produces an `unavailable` row, as the gear set projection does for a null tier, and the row names its field path.

### Version the evidence, type it in the catalog

The support artifact becomes `compendium.support.v2`. The raw contract keeps a permissive `gameplay` object, and catalog decoders own the typed shapes, as they do for gear sets today. A typed raw schema was rejected, because it would duplicate every decoder schema. A v2 table row is either a record or an unavailable row with its source key and field path, so a null game record stays visible. Normalization reports each unavailable row as a coverage issue. The version bump lets the catalog reject a v1 canonical target instead of reading missing fields as empty: the support load of the canonical target requires exactly one artifact with the v2 identity. The registry keeps `compendium.support.v1`, because admission validates every artifact of every target, and the five other scans of the plan carry v1 support evidence. The schema identity exception for `compendium.support.v1` in `packages/catalog/src/evidence.ts` does not extend to v2.

### Store links as rows and details as JSON

The catalog stores the links that queries join as relational rows: `progression_links` holds the talent trees and spellbooks of each class and skill, and `talent_nodes` and `spellbook_nodes` hold the nodes. `progression_facts` stores the detail that a page reads as a whole as one JSON document for each record: classes, skills, level templates, effects, enchantments, stats, factions, talent points, bonuses, talent trees, spellbooks, and the rank mechanics of abilities. The rank mechanics stay out of `ability_facts`, so the tooltip facts keep their shape. Entity rows keep the gameplay that v1 support evidence carried: the tooltip ranks of abilities, the weapon types of classes, and the recipe, crafting station, and gear set fields. So entity details do not change with the capture. Requirement groups of talent nodes, bonus ranks, and ability ranks enter the existing `conditions` table with the owner types `talentTreeNode`, `bonusRank`, and `abilityRank`, so their sentences read like every other requirement. The normalized output version becomes `compendium.normalized-output.v7`.

### Derive relations in queries

`queryCatalogFacts` derives, in its `progression` records, the learners of each ability, the unlocks of each recipe and resource node, and the appliers of each effect from the typed facts. It sorts them by class or skill, then by level, tier, and row. Stored relation tables were rejected, because the facts already hold every link and a second copy could drift.

### One new scan of the canonical scene

The canonical target of the accepted catalog is scene 44, and its scan also supplies the scene evidence of scene 44. The change runs the existing plan `local/scan-25434619-scene-44.json` again with the configured research character. The new catalog plan replaces the scene 44 manifest with the new one and keeps the other five scans. The catalog build follows `local/catalog-rescan-25434619.sh`: a bootstrap coverage review, a bootstrap catalog, the complete coverage review, and the final catalog. A different canonical target was rejected: the scene 44 scan also carries the property settings, and a new target would change more evidence than this change needs. `tools/update/compare-catalogs.ts` compares the candidate with the accepted catalog 80fe12e0. The expected differences are the new facts and the new condition rows. Any other difference stops the change for review.

## Risks / Trade-offs

- IL2CPP interop can fail on a nested list. → Each list read catches the failure and records `unavailable` with the field path and the error.
- The 843 effects with their ranks enlarge the support artifact. → The projections record only the listed fields. Task 2.3 reports the artifact size.
- A native enum value without a name. → The decoder keeps the number and reports an unsupported-enum issue, as other decoders do.
- The scan can leave the runtime unclean. → The scan follows the HotRepl runtime procedure and requires a clean receipt.
- The new scene 44 scan can differ from the old one in scene evidence, for example in streamed sources. → The comparison with the accepted catalog shows every such difference, and the change stops for review.
- The game data can name IDs that no record has. → Each one becomes a missing-reference coverage issue, as for other typed facts. The candidate build lists them, and the change stops for review when one appears.
- The catalog id changes. → The candidate is accepted with the first publication that uses its facts. Until then, the accepted catalog stays selected.

## Migration Plan

Implement the collector, contract, and catalog changes. Run the canonical scan, build the catalog candidate, and compare it with the accepted catalog. Keep the candidate for the follow-up publication change, which accepts both. Rollback needs no step, because nothing is selected before that acceptance.
