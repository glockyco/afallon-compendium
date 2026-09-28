## 1. Save evidence gate

- [ ] 1.1 Inspect at least four additional independent, consented saves beyond the three level 1–2 test saves. Cover different levels and known quest, kill, discovery, recipe, and talent states. Verify a private evidence matrix records each observed field path, action, save build or signature, and before-and-after transition without names or inventories. Do not interpret a field until this check passes.
- [ ] 1.2 Read the save serialization and state update paths for quest transitions, repeatable quests, recipe learning, kills, region discovery, and talent ranks. For any rule still undecided by saves, run a read-only HotRepl probe or bounded Ghidra decompilation under `.agent/skills/native-analysis/SKILL.md`. Verify that each rule used for an open, killed, undiscovered, or unlearned status has direct evidence. Mark other states unknown.
- [ ] 1.3 Determine whether the save carries a reliable game version. Verify the compatibility table distinguishes a supported version, an unknown or missing version, and an unsupported shape. Record supported structural signatures and field-level limits where no version exists. Do not infer a version from the file name or path.
- [ ] 1.4 Check the save's exact region strings and talent node data against the accepted catalog with read-only queries. Verify whether region identity has usable scene context, whether a saved talent node has a stable tree position, and how ranks are recorded. Record ambiguous or missing mappings before specifying any parser rule that depends on them.

## 2. Build-bound progress identity

- [ ] 2.1 Define and validate a public static progress identity contract in `packages/contracts/src/public`. Include the catalog and publication build identities, native-to-entity mappings, NPC variant anchors, quest zones, recipe refs, tree nodes, and region candidates. Verify a contract case rejects mismatched build identity or duplicate mappings.
- [ ] 2.2 Generate the identity resource in `packages/publication/src` from catalog rows and published references, zones, and map shards. Keep reachable unpublished records labeled. Verify with a projection case that grouped NPC variants stay distinct and duplicate region names remain ambiguous rather than becoming one map area.
- [ ] 2.3 Attach the resource to the publication manifest and static loader without adding save data to server requests. Verify graph and resource integrity checks detect an absent resource, a dangling published reference, or a different catalog build.

## 3. Private import and matching

- [ ] 3.1 Build a bounded browser-only JSON parser and compatibility classifier for the verified save fields. Reject malformed JSON without replacing the current selection. Verify with focused cases for malformed input, unknown shape, missing version, conflicting recipe fields, and a field without verified meaning.
- [ ] 3.2 Match parsed entries to the identity resource by exact native ID and verified region context. Produce an explicit unknown or unmatched result for zero or multiple candidates. Verify a focused case never marks a sibling NPC variant killed or assigns a duplicated region name to one region.
- [ ] 3.3 Add a tab-memory progress store and file picker with the usual Windows path, character name, compatibility warning, unmatched summary, and Clear save action. Verify in the browser that same-tab navigation retains selection, Clear save removes it, refresh discards it, and invalid import retains the prior valid selection. Verify network requests, URLs, and browser storage contain no raw or derived save data. Only the explicit planner action may encode talent selections.

## 4. Reader progress views

- [ ] 4.1 Add a hub view of verified open quests grouped by the published zones, with an unassigned group and links to quest pages. Add a confirmed killed-boss view with NPC variant and map links when available. Verify in a browser that a multi-zone quest appears in both groups, a repeatable quest follows its verified current state, and absent kill entries do not create a negative claim.
- [ ] 4.2 Add a selectable undiscovered-area view to `/map` using verified discovery evidence and published region identities. Keep ordinary map controls, markers, and full reachable region coverage. Verify in a browser that ambiguous regions remain unknown and that clearing the save restores the ordinary map.
- [ ] 4.3 Compose the recipe list's existing C4 filters with an unlearned status view and linked recipe detail status. Verify in a browser that known unlearned recipes appear, conflicting learning fields show unknown, and the complete recipe list remains reachable.
- [ ] 4.4 Resolve verified saved talents to C8 tree and node identities. Encode C9's `/planner?build=v1.<unpadded base64url UTF-8 JSON>` with the matching catalog ID, saved class and level, sorted talent tuples, and empty points and gear. Show a privacy notice before opening the link. Verify in a browser that the planner restores every matched rank and that unmatched nodes do not become different nodes. Verify that neither the character name nor raw save appears in the URL.
- [ ] 4.5 Check reader-facing labels across progress views. Verify in a browser that headings and columns use sentence case, names and category values use title case, quotes are straight, and no record ID or enum word appears. Keep status labels distinct for verified incomplete, unknown, unsupported, and unmatched records.

## 5. Publication and acceptance

- [ ] 5.1 Run a scan only if the evidence gate shows missing source facts. Build a catalog candidate and compare its rows against the accepted catalog `3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. Verify the report explains every row difference, including an empty difference when the catalog remains unchanged.
- [ ] 5.2 Publish a candidate against that catalog candidate, stage it against the accepted publication, and run graph and update parity checks. Verify the progress identity resource uses the candidate's build and catalog identities and no publication issues are introduced.
- [ ] 5.3 Verify the staged publication in a real browser at 1440 px and 390 px. Exercise file selection, malformed and unknown saves, each progress view, planner transfer, Clear save, reload, and ordinary no-save navigation. Verify each view fits without horizontal overflow. Verify no save content reaches the network, apart from talent selections in the reader-requested planner URL.
- [ ] 5.4 Create and review the update report, then accept the catalog and publication candidates together. Verify the accepted build points to both candidates and retains the previous publication for rollback.

## 6. Final checks

- [ ] 6.1 Run the affected contract and publication checks, the site type check, and `openspec validate show-save-progress --strict`. Verify all pass. Keep only tests that defend a real parsing, matching, privacy, or transition boundary.
