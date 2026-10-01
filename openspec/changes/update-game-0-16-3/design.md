## Context

Build 25653798 adds 42 types, removes 5, and changes 85 (`local/update-0-16-3-build-comparison.json`). The database record types that change are `RPGItem`, `RPGLootTable`, `RPGEffect`, `RPGBonus` (a new pet bonus target), and `RPGAbility` (a clone source on ranks). `RPGNpc`, `RPGQuest`, `RPGTask`, and the crafting recipe type are unchanged. `AdventurerWorldSettings` gains kit upgrades. `GameState` now deactivates spawners outside a range with a margin of 10, and `AutoDisableByDistance` and the animator culling types are removed, so a scene read can find fewer active producers than in 0.16.2.1.

The mechanics rules record of 25434619 cites 21 bounded decompilations of that build's `GameAssembly.dll`. The catalog rejects a rules record of another build.

## Goals / Non-Goals

**Goals:**
- Publish build 25653798 with every 0.16.3 database field that a page or a later change reads.
- Keep every published rule backed by evidence of the new binary.
- Show the 0.16.3 weapon line in item tooltips.

**Non-Goals:**
- Hunter taming, adventurer gear, and item use effects: separate changes of this update.
- Interface-only changes of 0.16.3 (window positions, field of view, loot window animation, merchant right-click).

## Decisions

- **Database entry references, not enum names.** `weaponDamageType` and `WorldLootArmorType` are database entries (`RPGBDamageType`, `RPGBArmorType`), so the probes emit `{available, nativeId, name}` references like the other entry fields. `attackMode` and `physicalLabel` are enums and are emitted by name.
- **Rules re-verification by comparison.** For each evidence object of the 25434619 rules, the same functions are located in 25653798 through the regenerated Cpp2IL method map and decompiled again. Pseudocode that matches after removing addresses keeps its rule with the new evidence. A changed function is read again, and its rule is restated or marked open. The new record names binary `3625dbe8…`.
- **Producer counts are compared, not assumed.** Because far spawners can be inactive, `compare-catalogs.ts` output is checked for lost spawners and placements per scene before publication. A loss is investigated before it is accepted.
- **One canonical target.** Scene 44 is scanned alone as the artwork target (`speed-up-scans`), and the catalog plan names it as canonical.

## Risks / Trade-offs

- Spawner deactivation hides creatures from a scan → compare per-scene producer counts with 25434619; if a scene loses producers, hold the stream or position before collection, as the stream visit does.
- A rule's function is inlined or split in the new build → the comparison finds no counterpart; the rule is marked open in the record rather than kept on old evidence.
- New weapon types or slots reach a page that assumes two hands → the item and class pages are checked with a bow, a crossbow, and a two-handed mace.
