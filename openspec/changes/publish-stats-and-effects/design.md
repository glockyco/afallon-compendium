## Context

Reference links already use `EntityRef`, and page admission happens before document projection. The accepted catalog holds 121 stat definitions and 928 effect definitions, while captured world actions reside in `source_details` rather than the general relation query. The research files under the operator's `local/research/` directory distinguish recorded data from rules supported by bounded native evidence.

## Goals / Non-Goals

**Goals:** Keep page selection reproducible from the same accepted catalog, with no dead links or oversized effect documents. Describe only verified behavior and publish all useful authored data as configuration where behavior is unknown.

**Non-Goals:** Reconstruct exact live recovery scheduling or stacking behavior, assert that an authored teleport reaches any particular map arrival, publish orphan effects, or alter other reference kinds or unrelated game systems.

## Decisions

### Stat admission and sources

Keep a reviewed code-level exclusion of the eight stat IDs 42, 44, 90, 115, 116, 117, 118, and 122. Seven have no identified player-facing sources or contextual references and blank or self-referential descriptions. Melee stat (122) has Berserker's recorded starting value but no linked bonus, talent, effect, item, or gem, so its role remains unverified. These are page decisions, not proof native code never reads the stats. Keep zero-source stats with meaningful game descriptions and Item power, which appears on hundreds of items. The same admission predicate controls reference slugs and document projection. Build reverse source edges from captured item, gem, set, bonus talent, effect, enchantment, and class facts, not merely the abbreviated item list rows. A talent links its owning class's talent anchor. Enchantments have no pages yet, so their names remain text rather than dead links.

### Effect admission and source identity

Select effects by keyed edges from ability ranks, item effect actions, on-hit stats, creature abilities, NPC invitation effects, named requirements, and scanned world actions, including nested game actions. This yields the research inventory's 779 connected effect candidates. The remaining 149 are unconnected under these captured sources, not proven inaccessible. A checked technical-looking EffectChecker is retained because its conditions are a real source edge, while an orphan named helper is not promoted by its name. Teleport-to-dungeon-scene actions qualify when a scanned world interactable applies their effect, but the effect page only names the recorded destination, never an invented arrival or availability guarantee. Six connected unnamed effects get type-and-ID fallback names. World sources group by source identity and then place/family rather than embedding every placement. Condition ownership is linked when the catalog exposes the owner; world-only checks show their recorded requirement wording and grouped context.

Three otherwise orphan effects also appear in game actions attached to region/template records or NPC phase actions. Two lack entity owners and one has NPC phase owners whose phase game actions are not shown on NPC pages. These do not become reference pages until a page can present the source action. Region/template sources and NPC phase actions remain a separate presentation question; the linked-source inventory stays at 779 effects.

### Schemas and evidence

New `compendium.static-stat.v1` and `compendium.static-effect.v1` schemas keep page-specific facts compact. Mechanics changes shape only once, to `compendium.static-mechanics.v17`, for a Combat guide carrying recorded recovery entries. The rules record merges seven stat rules, two gear set rules, and six effect rules with 12 registered decompilation objects (one shared hash). The fragments' page placements are removed because these kinds instead link directly to Combat guide sections. Combat links and rule IDs remain stable. A recorded pulse count may differ from effective runtime pulses due to an unresolved short-interval adjustment, so authored count and calculated duration/count interval are shown as a recorded schedule only, with the guide explaining effective timing rather than promising exact live ticks.

## Risks / Trade-offs

- World effect actions and NPC invitations require dedicated read-only catalog queries to avoid silently dropping effects absent from normalized relation rows.
- Rank payloads include irrelevant defaults for other types. Project only fields meaningful for each rank's actual effect type.
- Persistence verifies save/restore of states, not survival through death. Manual removability and stack limits are authored flags, not promises about a clickable action or stacking admission.
- Per-page budget must be checked against the 262,144-byte limit after world aggregation, especially for frequently checked effects.
