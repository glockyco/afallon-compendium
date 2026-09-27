## Context

The catalog keeps one canonical entity for each native record. `buildEntityReferences` (`packages/publication/src/references.ts`) gives each record its own page and adds a level, area, place, or native-ID suffix when names collide. It keeps a separate "stable" slug suffix so that published URLs survive. `publication-parity.ts` enforces that survival.

Evidence from build 25434619:

- The game authors one NPC record per pose, time of day, story stage, and flight point. Internal names show the purpose, for example "Fenric Doryn Fishing trader sitting". 41 NPC names cover 119 records. 13 names differ only in place, time, services, or quests. 28 names also differ in combat facts. Loot differs in 4 names.
- `RandomActivator` enables `numberToEnable` distinct targets when it becomes active. 162 of 164 NPC activator observations match. The 2 others are under an inactive event object. 37 of 82 activators observed twice chose differently. The catalog marks the family `unsupported`.
- Runtime at player level 2: NPCs from 1,529 spawners with fixed levels 1–2, "scale with player", and a zone range were level 15–18 in zone 15–30 and level 3 in zone 1–20. `TryGetZoneRangeFor` returns the spawner zone range or the scene range. Adventurers without spawners were level 23–28 against record levels 1–30. Fixed spawners without scaling and summoned NPCs were not observed.
- `killNPC` stores one `npcToKillID`. `killNPCFamily` is unused, and no NPC has a family.
- Same-name items differ in real facts. Same-name abilities are per-user copies.

## Goals / Non-Goals

**Goals:** one page per NPC or ability name with variants, confirmed levels, alternatives for random spawns, faction hostility, readable qualifiers, correct tooltips and quest layout, entity-coverage parity, a clean quit tool.

**Non-Goals:** redirects or retired-slug records, grouping items or places, publishing player-state levels for a specific character.

## Decisions

### Group in the publication, not the catalog

The catalog stays one row per native record, because evidence, relations, and coverage are record-scoped. The publication builds groups: `groupKey(kind, name)` over normalized names for `npcs` and `abilities`. A group has one `EntityRef` whose `key` is the group's lowest-native-ID record key. A resolver maps every member key to the group ref plus a variant anchor. Alternative considered: new catalog entity kind "character". Rejected, because it duplicates identity that only presentation needs.

### Variant model

Each grouped document carries `variants: [{ key, anchor, label, facts }]`. `facts` holds only the facts that differ inside the group. Shared facts stay on the document. The anchor comes from the first player-visible fact that separates the variant (place, time of day, quest stage, level, rank), else `n<nativeId>`. `EntityRef` gains an optional `variant` anchor so that record-specific references link to `/<kind>/<slug>/#<anchor>`.

### Where-to-find

`spawnConditions` become location entries grouped by place. Each entry carries its availability (time of day, quest gates) and, for activator placements, `alternative: { group, enabled, weight, total }`. Story-stage ordering follows the chain order of the quests in each stage's gates.

### Random activators

The catalog admits `randomActivator` sources whose targets resolve to placements. It stores `placement_alternatives(group_id, placement_id, weight, enabled_count)`. Weight counts repeated target entries. Inactive activators keep the rule. It applies when the activator becomes active. Map shards carry the alternative group, and the marker text says "one of N".

### Levels

Targeted Ghidra decompilation of `MobCombatEntity.InitNPCLevel`, `GetScaledPlayerLevel`, `ZoneLevelRules.*`, and the adventurer spawn path, using `research/ghidra` and `DecompileTargets.java` for build 25434619, decides the remaining rules. Confirmed rules become one function `effectiveLevel(placement)` in the publication, used by map shards, documents, lists, and qualifiers. The zone fallback reads the scene's zone scaling from place facts. Unconfirmed producers give no level. `map-shards.ts` loses its own precedence heuristic.

### Hostility

`npcRoles` drops `isCombatEnabled → enemy` and uses the enemy, neutral, and friendly placement roles that map shards already map from faction standing.

### Slugs and parity

Slugs become `slugify(displayName)`, with native-ID suffixes only for exact collisions. The stable-suffix branch is removed. Parity compares entity keys covered by pages, variants, and search records, not `kind/slug=key` strings.

### Tooltips

`EntityTooltip.svelte` uses `@floating-ui/dom`: `computePosition` with `offset`, `flip`, `shift`, and `size` (max height from the available space), and `autoUpdate` while open. The stylesheet drops `top: 0` and its inline height cap.

### Quit tool

The quit probe registers `Application.Quit()` as a runtime cleanup callback, so the release writes a clean receipt and then the game quits at the end of that frame. The tool then waits for the port to close.

## Risks / Trade-offs

- Old NPC, ability, item, and place URLs break → accepted clean cut.
- A decompiled rule may still hide branches → each rule is checked against runtime observations before use, and unconfirmed branches publish no level.
- Merged anchors change when facts change → anchors are page-local and carry no compatibility promise.
- Registering quit as cleanup relies on the receipt being written before the frame ends → verify in the game before the tool relies on it.

## Migration Plan

Rebuild the catalog from the accepted scan manifests, unless the level analysis needs new collector fields. In that case rescan the affected scenes. Publish, accept with the relaxed parity, and stage. Deployment stays a separate decision.

## Open Questions

- The adventurer level rule and whether it needs data that the scans do not record.
