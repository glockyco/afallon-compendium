## 1. Installation update boundary

- [x] 1.1 Add typed Steam manifest and appended-log readers for app 2597810. Cover wrong app IDs, missing fields, unfinished state, successful removal, suspended work, and unrelated log entries with focused tests.
- [x] 1.2 Add `compendium update --config FILE --version VERSION`. Start or reuse Steam through CrossOver, request `steam://validate/2597810`, and wait for successful scheduler and manifest completion. Verify updated, already-current, timeout, failed-result, and delayed-manifest cases with a temporary bottle and scripted process runner.
- [x] 1.3 Register an immutable update receipt with previous and current manifests, extraction input hashes, release label, and completion evidence. Verify a failed update writes no success receipt and changes no artifact reference.
- [x] 1.4 Run the command for Afallon 0.16.2. Confirm the installed manifest reports `StateFlags` 4, record the new Steam build and hashes, and confirm `buildIdentity` returns the receipt identity.
  - Receipt run `96bf6a32-b147-4e7b-9118-5812a9063ef0` records Steam build `25419293`, metadata `373c53d331e7ed38176c446e2ffc72a2e32fe1c03ef84a397f2a510181d8ff43`, GameAssembly `5faa4038fe718ebc4716dab4b65aa967021d12bc70879e32283350d3d2dec17b`, UnityPlayer `eea205beca44a252e1751e57ec5a1f866eee2a9b4066263e5089bde7d70c7350`, and manifest `8a4cfd564fb9a4d0a2ab8d34014f62ec87cc7e6a5b880039b38ac2b4c0658956`. The final manifest has `StateFlags` 4. A separate `buildIdentity` call reproduced all four values.

## 2. Build comparison and discovery

- [x] 2.1 Add a pinned Cpp2IL snapshot command with ignored staging, atomic promotion, build-and-metadata-hash naming, a stable current pointer, and one-previous retention. Verify interrupted recovery preserves the prior pointer and same-build recovery is reproducible.
  - Snapshot `steam-25419293-373c53d331e7` uses pinned Cpp2IL `2022.1.0-development.1736+5fb2030.5fb20304df698ffd3d0e664b2a698cd911dc9d57`. Candidate registration run `88114ff5-c742-482a-b95c-ab8eac1a590c` binds its receipt.
- [x] 2.2 Snapshot the 0.16.2 declarations and compare them with build 25153357. Record changed types and fields that can affect collectors, decoders, map identity, equipment, quests, NPCs, loot, stats, and travel.
  - Comparison run `e05ecd8d-4a57-4557-96a3-611803f820ce` records 194 added, 1 removed, 431 modified, and 1,250 unchanged types. Contract-affecting changes include `RPGNpc` adventurer/economy/flight fields, `RPGClass.AllowedWeaponTypes`, `RPGBArmorSlot.ItemSlot`, `RPGStat.ProcCooldown`, major-region identity, and the new flight network. `RPGItem`, `RPGLootTable`, and `RPGWorldPosition` fields are unchanged.
- [ ] 2.3 Launch 0.16.2 once to regenerate MelonLoader interop assemblies, then run a candidate current-scene scan. Verify the connected product and installation identity, and retain the inventory, canonical data, collector failures, and prior-build semantic comparison.
- [x] 2.4 Add and validate the patch-specific update-report contract. Require immutable references for the update receipt, schema snapshot, build comparison, scans, reviewed inputs, catalog, publication, checks, and every 0.16.2 risk disposition.

## 3. Data-contract reconciliation

- [ ] 3.1 Repair only collector and decoder contracts contradicted by the declaration diff or candidate evidence. Add observable contract tests for each changed shape, then confirm the 0.16.2 current-scene candidate passes without fallback values.
- [ ] 3.2 Reconcile authored adventurer templates, class and role facts, bankers, auctioneers, and flight-network data. Record each domain as supported unchanged, supported changed, not authored, or unsupported, with evidence and targeted catalog checks.
- [ ] 3.3 Reconcile the three dungeon quests, their six rewards, new swords and trinkets, equipment slots, weapon proficiencies, Healing Power, and loot changes. Verify observed identities, relations, slot and stat semantics, and loot sources in a candidate catalog rather than asserting release-note counts alone.
- [ ] 3.4 Inspect mail, banks, auctions, friends, Dungeon Finder, and adventurer progression boundaries. Verify the update report excludes sampled player or session state unless a stable authored-data source exists.

## 4. Merged-world spatial rebuild

- [ ] 4.1 Replace restoration and traversal configuration with current 0.16.2 scene and streamed-source identities. Verify a cancelled candidate scan restores the research character to a safe merged-world location.
- [ ] 4.2 Rebuild the 0.16.2 map-space profile from current landmarks, map zones, geometry, and runtime controls. Verify every outdoor placement uses one `world-surface` binding and no retired Coalway Woods, Coalway Swamp, or Chillwind Heights scene binding remains.
- [ ] 4.3 Resolve current teleport and flight endpoints through the rebuilt profile. Verify each supported connection has current-build source and destination coordinates, while unresolved endpoints remain explicit coverage blockers.
- [ ] 4.4 Recapture changed game-map imagery and regenerate only selected optional terrain imagery. Verify hashes and capture metadata belong to 0.16.2 and inspect representative seams and merged-world alignment in the browser.

## 5. Candidate pipeline and acceptance

- [ ] 5.1 Generate and review the complete 0.16.2 target plan from current discovery. Run the full scan in candidate mode and verify every required scene, streamed source, collector family, artwork object, and cleanup receipt has an attributable successful disposition.
- [ ] 5.2 Assemble a sealed candidate catalog from only 0.16.2 evidence and reviewed inputs. Verify build agreement, referential integrity, spatial resolution, deterministic query results, patch-specific entity checks, and coverage accounting.
- [ ] 5.3 Build a candidate preview publication and run targeted repository checks. Verify the merged map, search, representative new quests and equipment, NPC and travel relations, artwork, and coverage metadata against the actual site in a browser.
- [ ] 5.4 Add an acceptance command that verifies the completed update report and atomically selects one accepted-build descriptor plus the local production stage. Test failure before and during staging, compare-and-swap protection, retained rollback identity, and the rule that acceptance never deploys.
- [ ] 5.5 Complete the 0.16.2 update report, accept the verified candidate, and update build-specific repository documentation. Confirm the selected descriptor and local stage identify the same build, catalog, publication, and retained prior publication.
