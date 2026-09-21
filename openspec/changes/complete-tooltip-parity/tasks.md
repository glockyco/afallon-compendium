## 1. Runtime Tooltip Evidence

- [x] 1.1 Mark `build-compendium-reference` task 7.4 and its neutral-requirement decision as superseded by this change, and verify both change directories still pass OpenSpec validation.
- [x] 1.2 Extend the canonical item observation with the exact non-empty native use or buff text and generation diagnostics, and verify live probes still produce the observed Minor health potion, sharpening-stone, food, mount, and pack lines without a character.
- [x] 1.3 Extend support ability observations with every authored rank and its native-generated tooltip text, and verify a live probe reports 370 abilities, 373 non-empty rank blocks, and all four Healing potion ranks.
- [x] 1.4 Preserve authored ability rank and source index on NPC phase and item action-ability observations, and verify a focused scan fixture retains a non-zero rank instead of reducing the row to an ability ID.
- [x] 1.5 Extend scan contracts and decoders for the new item, ability-rank, and contextual-reference observations; verify focused decoder tests reject missing rank identity, malformed generated text, and generation failures while accepting the current-build samples.

## 2. Catalog Semantics

- [x] 2.1 Add an exhaustive TextMeshPro tooltip parser that produces ordered lines and escaped typed spans for supported colour and italic tags; verify focused tests cover nested supported tags, blank lines, named colours, hex colours, malformed nesting, and unsupported tags.
- [x] 2.2 Add normalized catalog storage and typed facts for item use lines, ability ranks, parsed tooltip spans, and contextual ability ranks; verify an in-memory catalog round trip preserves source order, identity, provenance, and empty-line boundaries.
- [x] 2.3 Compute each item, random-item, gem, and gear-set stat's effective percentage as the logical OR of row and canonical stat flags; verify focused normalization tests cover Lifesteal, Frost Resistance, Movement Speed, a gem stat, and a set-tier stat.
- [x] 2.4 Replace reduced requirements with complete typed predicates and exhaustive equipment-versus-use scope classification; verify focused query tests render level and class groups, `Potion Sickness inactive`, equipped weapon subtypes, region and combat-state gates, and no generic `Item` or `inline-requirements` labels.
- [x] 2.5 Deduplicate requirement predicates by typed identity and merge the scalar level fact with an equivalent condition; verify Oathbreaker's Edge and the full current-build item set publish each equipment requirement once.
- [x] 2.6 Extend catalog queries for ordered ability ranks, item use lines, contextual ability references, scoped requirements, and effective stats; verify query tests return complete typed rows without deriving user-facing wording from fallback labels.

## 3. Public Document Cutover

- [x] 3.1 Replace the public tooltip contracts with typed native-text spans, ability rank facts, contextual ability references, scoped requirement predicates, and item use lines; bump every static page-document schema ID together and verify contract decoding rejects every prior document version.
- [x] 3.2 Project complete item and ability tooltip facts, scoped requirements, effective percentages, and contextual ranks into public documents; verify publication tests cover Oathbreaker's Edge, Minor health potion, Rough Sharpening Stone, Red gem of lifesteal, Cleave #0, and all Healing potion ranks.
- [x] 3.3 Change duplicate ability references to deterministic `Name (#nativeId)` labels while retaining full `usedBy` and `taughtBy` relations; verify reference tests produce concise stable labels and unchanged relation lists.
- [x] 3.4 Add whole-publication invariants for rank coverage, non-empty native blocks, item use-line preservation, requirement classification, schema consistency, and resolved set members; verify a deliberately missing block, unclassified predicate, or mixed schema version fails complete publication with coverage evidence.
- [x] 3.5 Update publication fixtures, resource references, loader schemas, list and search fixtures, and graph audits for the clean schema cutover; verify focused package tests and `bun run check:packages` pass without compatibility aliases.

## 4. Tooltip Presentation

- [ ] 4.1 Add a safe native-text renderer and non-interactive entity-reference presentation for tooltips; verify rendered text preserves line order, semantic tones, and italics without using raw HTML or focusable descendants.
- [ ] 4.2 Add the dedicated item tooltip presenter in native fact order, including sign-first effective stats, use lines, sockets or gem effects, one green copy of each equipment requirement, and sell price last; verify the full item page separately shows page-only facts and semantically worded use conditions.
- [ ] 4.3 Load an item's referenced gear-set document through the existing verified request cache and render authored members and tiers with current-item-only active state and synthetic equipped count one; verify Adept Leather hood matches the reference armor screenshot's ordering and active states.
- [ ] 4.4 Add the dedicated ability tooltip and page presentation with contextual-rank selection and labelled context-free multi-rank content; verify Cleave #0 shows activation, range, cooldown, description, and damage, and Healing potion exposes four ordered ranks.
- [ ] 4.5 Add explicit compact presenters for recipes, quests, gear sets, NPCs, places, and properties using the design's per-kind fact and summary policy; verify a recipe shows product and materials, a quest shows objective and reward summaries, and high-cardinality NPC or place relations remain summarized.
- [ ] 4.6 Replace generic `FactCard compact` dispatch and remove obsolete compact page-card branches after every caller migrates; verify item, ability, recipe, quest, gear-set, NPC, place, and property links all open the new presenters.
- [ ] 4.7 Repair tooltip ownership and accessibility with a stable `aria-describedby` ID, shared owner-and-tooltip pointer lifetime, overflow scrolling, Escape dismissal, focus retention, and normal touch navigation; verify the actual site with pointer, keyboard, screen-reader inspection, and a touch-emulated viewport.

## 5. Current-Build Proof and Handoff

- [ ] 5.1 Run a fresh build-25419293 scan and catalog normalization, and verify reports account for all 373 ability ranks, all 87 non-empty item use blocks, all effective percentage rows, all scoped item predicates, and all 184 set members with no silent tooltip loss.
- [ ] 5.2 Publish and stage the new graph, then verify every affected document uses the new schema generation, all resource hashes and identities pass, and missing tooltip evidence blocks complete mode.
- [ ] 5.3 Verify the actual production-stage UI for Oathbreaker's Edge, Frost loop, Red gem of lifesteal, Minor health potion, Rough Sharpening Stone, Adept Leather hood, Cleave #0, and Healing potion against live output or the checked-in reference screenshots.
- [ ] 5.4 Exercise a long tooltip by moving the pointer into it and scrolling, then verify Escape, keyboard focus association, 360-pixel layout, and touch navigation on the actual site.
- [ ] 5.5 Run focused tests, `bun run check`, `bun run check:dependencies`, `bun run build:production`, and `bun run verify:deployment`; verify the new site and publication root pass as one deployment pair and rehearse rollback to the previous pair.
- [ ] 5.6 Update current behavior documentation and measured evidence, remove throwaway audit scripts and stale neutral-requirement or generic-compact wording, and verify no obsolete schema aliases, duplicated set snapshots, or superseded tooltip task remains active.
