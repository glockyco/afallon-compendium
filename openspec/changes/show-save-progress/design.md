## Context

See `proposal.md` for the motivation and `specs/save-progress/spec.md` for behavior. The site prerenders pages (`apps/site/src/routes/+layout.ts`) and loads build-bound static documents through `apps/site/src/routes/[kind]/[slug]/+page.server.ts`. The publication has catalog entity references, grouped NPC pages, quest and recipe lists, and map regions (`packages/publication/src/documents.ts`, `lists.ts`, and `map-shards.ts`).

The evidence brief's save section names JSON fields and a Windows path. It reports only three test characters at levels 1–2. Recovered `CharacterData.cs:17-35,61-93` declares the relevant arrays. `CharacterEntries.cs:129-135,359-385,409-432,503-517` declares their entries. The quest state enum is in `QuestManager.cs:12-22`. These declarations establish field shape, not the rules for populating or updating a save. The accepted catalog has 136 quests, 132 recipes, 478 NPC records, 160 regions, and 660 talent nodes. A read-only query groups 30 region names across multiple rows, so a name alone is not a safe region key.

This work consumes the routes `/` and `/map` from `build-compendium-hub`, the zone links from `publish-overworld-zones`, list controls from `add-list-filters`, tree icons and grid identifiers from `show-talent-trees`, and the `/planner` URL contract from `build-character-planner`. It does not change those contracts.

## Goals / Non-Goals

**Goals:**
- Keep private character data separate from static publication data.
- Match a saved fact to exactly one published entity or report uncertainty.
- Retain all published records while offering character-specific views.

**Non-Goals:**
- Server storage, accounts, or automated access to the reader's file system.
- Save editing, exporting a save, or a claim that every absence in a save means incomplete progress.
- Automatic gear or stat import into the planner. The talent build is the only planned transfer.

## Decisions

### Verify save semantics before interpreting absence

First inspect at least four additional independent, consented saves. Cover different character levels, quest transitions, repeatable quests, boss kills, discovered and undiscovered regions, learned recipes, and spent talent ranks. Compare paired saves around a known action when possible. Strip names and inventories from recorded evidence. Use a read-only HotRepl probe or bounded Ghidra decompilation under `.agent/skills/native-analysis/SKILL.md` only for cases where save observations do not decide a rule. Record exact field paths, state transitions, version markers, and the supported build or structural signature. Do not implement a completion rule before its evidence exists. The three current low-level saves alone are insufficient. A rule that remains unverified yields an unknown status, not a guessed result.

Open evidence questions are the meaning and precedence of `Quests[].state`, `Recipes[].known` and `LearnedRecipes[]`, `KilledNPCs[].killedAmount`, `EnteredRegions[]` and `DiscoveredRegions[]`, and `TalentTrees[].nodes[]` with `Bonuses[]` and `Abilities[]`. The enum declaration does not prove whether a completed quest remains open before turn-in or how repeatable quest rows reset. `RegionEnteredEntry.regionName` has no scene key in the declaration. The save model exposes no dedicated build field in its declared leading fields. Confirm whether a reliable marker exists elsewhere before claiming a version match.

### Publish a compact identity resource for the accepted build

Generate a versioned static progress identity resource from the catalog and the publication's reference index. It maps validated native IDs to canonical `kind:id` entity keys. Quest and recipe keys map to their published refs and zone or list identity. NPC keys map to a grouped page plus their record anchor, boss role, and map spot. Talent tree IDs map to the class-owned tree and node position or node identity, not just a shared bonus ID. Region entries map an exact saved region string to all candidate region identities and map spaces. Include scene context only if verification proves that the save contains reliable context. If several regions remain, mark all as ambiguous rather than assign the first.

The reader never sees native IDs or enum words. Internal lookups use the same catalog build identity as the loaded publication. The resource includes coverage for unpublished and unmatched reachable records, with a readable label when available. A duplicate or missing match becomes an issue instead of an overwrite. This is preferable to matching by display name or deriving IDs in site code, since NPC pages group records and map regions can share names. Project only the fields needed for progress to avoid sending a second full catalog to each browser.

### Parse locally and retain a tab-scoped snapshot

The picker uses a browser `File` read and parses JSON on the client. A bounded parser validates the root and each relevant array before making a derived progress snapshot. Reject malformed JSON without replacing the previous snapshot. A save without a verified version marker gets an explicit version-unknown warning even if a verified structural profile permits some fields. An unsupported shape gets a warning and no claims from incompatible fields. Match the snapshot to a publication build before presenting status. On an update or a mismatch, recompute against the new identity resource or show unknown. Never persist the raw file, parsed save, progress snapshot, file name, or character name to local storage, session storage, cookies, IndexedDB, server requests, or URLs. Clear save replaces the snapshot with empty state. Reload discards it. A static site still makes normal requests for its public data, so keep save-derived data out of those request URLs and telemetry.

A tab-scoped Svelte store supplies progress to the hub, `/map`, relevant lists, and detail pages. The picker stays available from the hub and a shared progress control. Navigation in the same tab preserves the snapshot without local storage. This approach is simpler than persistent client storage and provides a clear privacy boundary. It also means a refresh requires a new file selection. Show that fact beside the picker.

### Build conditional progress views

Quest status uses verified save state transitions only. Group each verified open quest by the zone association from `publish-overworld-zones`. Show a quest in each relevant zone. Keep an unassigned group and the full quest list. The boss view uses a verified positive kill count for a specific NPC record. It does not turn absence into a negative kill claim. The map uses a selectable undiscovered-area overlay from published regions only when the verified save rules can prove the status. Ambiguous names or absent evidence remain unknown. The recipe list composes the `add-list-filters` controls with a status view. Conflicting learning fields produce unknown. None of these views removes ordinary records or changes their public facts.

A verified talent snapshot resolves each saved tree and node to the C8 tree layout. Use C9's `/planner?build=v1.<unpadded base64url UTF-8 JSON>` contract. The ordered JSON fields are `catalog`, `class`, `level`, `points`, `talents`, and `gear`. Encode the matching full catalog ID, saved class and level, sorted `talents` tuples `[talentTrees:<id>, nodeIndex, positive rank]`, and empty `points` and `gear` arrays. The action exposes only the selected build through its URL, so explain the link and browser history before opening it. An unverified node remains unmatched and is never replaced with a visually similar one. Do not put the character name or save JSON in the link. The site shows sentence-case headings and columns, title-case category values and names, and straight quotes.

### Rebuild and accept one coherent publication

If evidence requires a scan or catalog projection, scan only what is needed. In all cases, build a catalog candidate and compare its rows to the accepted catalog at `artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. An unchanged catalog should have no unexpected row differences. Publish a candidate against that candidate catalog. Stage it against the accepted publication and run the graph and update parity checks. Check the imported-save flows and the ordinary anonymous site in a browser at 1440 px and 390 px. Review an update report, then accept the catalog and publication candidates together. Do not replace an accepted build with an identity resource for a different catalog. Roll back the pair together if staged checks fail.

## Risks / Trade-offs

- Save fields can change without a visible version marker. → Treat missing markers as unknown, verify structural profiles, and limit status to proven fields.
- An absent row may not mean an undiscovered area or unlearned recipe. → Verify update behavior across more than three saves before using absence as a negative status.
- Several regions share a name, and several NPC records share a page. → Keep all candidate keys and record anchors, and reject ambiguous matches.
- Planner URLs disclose a chosen talent build. → Explain this before opening the planner and omit all other save data.
- Refresh loses the selected save. → Explain the tab-only lifetime and offer a clear reselect control.
- A new catalog can renumber native IDs or alter published page grouping. → Bind identity data to its exact build and accept both artifacts together.

## Migration Plan

Complete the save evidence gate. Add the build-bound identity resource and client parser, then add the conditional views. Build and compare the catalog candidate, publish and stage the matching publication candidate, verify the browser flows, and accept both with one report. Keep old accepted artifacts as rollback. No old save-progress state, route, or redirect needs migration.
