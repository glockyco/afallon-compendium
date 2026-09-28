## Context

See proposal.md for motivation and `specs/character-planner/spec.md` for behavior. `packages/contracts/src/catalog/progression.ts` models class stats, point rules, talent nodes, and rank costs. `packages/publication/src/documents.ts:901-942` projects display rows, but class documents show only the first and last passive ranks. Their requirement groups are display phrases, not a verified evaluator. The planner needs a separate typed publication payload.

Evidence from the accepted catalog (`artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`): the join of `talent_nodes.condition_id` to `conditions` contains 406 Bonus predicates, 220 Ability predicates, and 46 Level predicates. Nine of 619 requirement groups set `checkCount`. The `treePoint` field names Talent Points for 23 trees and Heroic Essence for six. Cooking has no point key. `progression_facts` has both `stats` and `customStats` for Druid. These facts do not prove how the game combines stats or evaluates requirements.

`research/ghidra/25434619/talent-requirement-functions-20260928.json` shows that `BonusManager.CheckRequirements` calls the general requirements evaluator when groups are present. The recovered `RequirementsManager.cs:55-88` declares `GetValidOptionalCount`, `IsRequirementMet`, and three `RequirementsMet` overloads. Their native bodies have not yet been reviewed. `research/ghidra/25434619/cpp2il-method-addresses-20260928.json` lists their RVAs and lengths. The general evaluator's group combination, optional-count rule, and Bonus, Ability, and Level comparisons are open questions. No legality claim follows from the declaration alone.

## Goals / Non-Goals

**Goals:**
- Produce an evidence-bound planner document with every reachable class and its tree nodes.
- Implement the talent phase before the gear and stat phase, then deliver both phases in this change.
- Give `show-save-progress` a precise build-link contract without depending on save-file parsing.

**Non-Goals:**
- Reading or storing save files in the planner.
- Ranking builds or simulating combat outcomes.
- Claiming exact final stats when random gear rolls or native stat rules are missing.

## Decisions

### Trace the evaluator before implementing purchase validation

Follow `.agent/skills/native-analysis/SKILL.md` in the main checkout. Verify the installed binary identity against the recorded build. Use the recorded addresses only after confirming the binary and each exclusive function range against PE unwind data. Decompile bounded `RequirementsManager.RequirementsMet`, `GetValidOptionalCount`, and `IsRequirementMet`. Review the group loop, the selected predicate branches, and calls from both Bonus and Ability managers. Check uncertain branches against assembly and, if needed, a read-only HotRepl probe. Save new research under ignored `research/ghidra/25434619/` or `local/`. Do not infer group semantics from the catalog's display `mode`.

The validator then implements only the evidenced subset. For unsupported predicates or missing context, it returns `unverified` with the named condition. The planner keeps such nodes visible and offers a marked preview. It never turns a missing fact into a passing predicate. This is better than a broad, inaccurate Boolean validator. It also avoids making a fixed set of three predicate names a permanent assumption if a later catalog contains more types.

### Publish typed planner facts beside existing class pages

Add a versioned planner payload to the publication and load it through the existing staged publication loader. It holds offered classes, class level limits, all linked trees and nodes, each rank's authored cost and conditions, point types and gain rules, and evidence-backed gear inputs. Use stable catalog keys and node indexes as internal identity. Display names and icons come from publication, not from URL keys. Keep the class reference pages unchanged except for their C8 icon and grid work. A separate payload avoids bloating each class page and avoids trying to parse presentation phrases as rules. Its catalog ID identifies the current data for the link comparison.

Derive level-granted point balances from the catalog's point rules only after confirming how the initial amount, cap, and world modifiers apply. Activity-granted totals are reader input and keep their source label. A tree without a resolved point type remains on screen without a verified purchase. Check ranks in the order selected, with current state and every node and rank group. Recompute after any class, level, point, or rank change. A reduction preserves selected ranks and displays failures instead of silently deleting a dependent rank.

### Define one versioned URL for both phases

Use `/planner?build=v1.<base64url>` with unpadded base64url of UTF-8 JSON. Serialize keys in this exact order: `catalog`, `class`, `level`, `points`, `talents`, `gear`. The spec defines all types, order, duplicate policy, and empty arrays. Keep the full source catalog ID as provenance. Parsing checks size, structure, known JSON fields, and key syntax before applying state. When the source catalog differs, match stable class, tree, node, point, slot, and item keys against current publication data. Apply matching selections, re-check every selected rank and item with current rules, and show an older-build notice. Report missing or newly blocked selections without claiming legality. If the class no longer exists, leave it unresolved rather than assigning another class. Keep unmatched entries in a migration report, not as valid active selections. Do not silently discard them when the reader copies a new link. Canonical output sorts arrays and omits zero-rank talents. Save progress can construct this URL from its own read-only save parser after it validates the same keys. A hash-only or session-storage design would not give C12 a portable link.

### Separate talent work from gear and stat work

First release the class, level, point, and talent planner with the URL's `gear` array empty. The second phase in this change adds equip slots and stat totals without changing the v1 URL shape. Trace the native equip check, slot and hand interactions, class stat-list precedence, level growth, stat stacking, caps, and item effects before implementing those calculations. Compare each rule with the accepted catalog's item and progression facts. Capture missing inputs if needed. Do not equate an uncaptured random roll or corrupted value with zero. Show partial contributions and an incomplete total until the evidence covers them. A generic sum of item rows would give a false answer for Druid and for rolled gear.

### Keep artifacts in one accepted build

Even if research shows the existing catalog contains all required facts, build a catalog candidate and compare its rows with the accepted catalog. If data is missing, update capture and scan only the needed scope, then compare again. Build the planner publication from that candidate. Stage it against the accepted publication and check the planner in the browser at 1440 px and 390 px before one joint acceptance. This follows the archived `publish-class-and-skill-pages` cycle and prevents development and preview data from diverging.

## Risks / Trade-offs

- General requirement branches may need character state beyond the planned inputs. → Show `unverified` and do not assert legality. Keep all reachable nodes visible.
- Point gains may depend on world modifiers or kills. → Verify level-only rules first. Label external totals as reader-supplied.
- Gear can have random rolls or modifiers that are not captured. → Show known parts and an incomplete stat total, not an invented number.
- The catalog can change after a link is shared. → Match stable keys, re-check current rules, and show missing or blocked choices before any new link omits them.
- A large planner payload can slow initial navigation. → Measure its size and load it on `/planner`, not on every route.

## Migration Plan

Ship the talent phase and then the gear and stat phase under the same v1 URL schema. Publish and stage against the accepted build after catalog row review. Verify each phase in the browser at both widths. Accept the new catalog and publication together with an update report. Keep the previous publication as rollback. No redirect or legacy planner path exists.
