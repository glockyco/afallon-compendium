## Context

The accepted 0.16.3 catalog is `076be02f1fcc7e88711645fa730cefde7fbbc5923d1abd7399ff7d2192f97779` (build 25653798), staged as publication `dade9f2e75c50ffbdfdbf92daa5e7aa9e2f716da6bf9494dd69172c75326bd76`. The catalog offers seven playable classes including Hunter, with 30 class-linked trees and 739 nodes in the current query. Seven Heroic Ascension trees use Heroic Essence, and the remaining class-linked trees use Talent Points. Cooking has no resolved point type and is not class-linked. The accepted Talent Points record starts with 1, caps at 180, and lists a character-level-up gain of 3; Heroic Essence has `maxPoints: 0` and no gain rule. Those fields alone do not prove final balances: game modifiers, initial grants, caps and other sources require native review. Requirement payloads include typed node and rank groups, and their native evaluator must not be replaced by presentation phrases.

`apps/site/src/lib/reader-levels.ts` currently stores character and skill levels in `compendium.reader-levels.v1`. The planner must move character level reading into one small shared module so it can own a remembered class and build while skill levels stay put. Class page projection in `packages/publication/src/documents/classes.ts` omits intermediate rank costs, so the planner needs its own typed payload instead of parsing page text.

## Goals / Non-Goals

**Goals:** A talent planner with evidence-backed checks, typed point balances, a canonical build link and one explicitly adopted remembered character that supplies class/level context on other pages. Complete class/tree/node coverage in the accepted build, including Hunter.

**Non-Goals:** Gear selection, stat calculation, combat simulation, build recommendations, account sync, or save-file reading. `plan-character-gear` handles equipment and stats on the same route and URL format.

## Decisions

### Evaluate requirements using build-matched native evidence

Use the build 25653798 `GameAssembly.dll` SHA-256 `3625dbe861e3a3d31a07378065f4d8862be07fa77e83f15592ebc080452a952c`. Registered native evidence under ignored `research/ghidra/25653798/`, selected assembly and bounded read-only runtime probes are summarized in `local/update-0-16-3/research/planner-requirements-confirmed-20261003.md`. The evaluator fails on a missed mandatory predicate and applies each optional group's threshold. Current class-linked node predicates use Ability or Bonus knowledge and optional rank comparisons; unknown external learning or a future predicate type remains `unverified`. The game's purchase path evaluates the talent node's groups, not rank-attached ability-use/effect groups. A failed known node condition is `blocked`, and `verified` requires supported node checks and typed point evidence. Preview versus committed selection is a separate axis.

Rank-up spends the authored next-rank cost for the tree's point type. A default-learned ability starts at rank one without buying that rank, and rank-down refunds can be changed by game modifiers. The confirmed cost and point paths are recorded in `local/update-0-16-3/research/planner-rank-costs-confirmed-20261003.md` and `planner-point-grants-confirmed-20261003.md`. Re-check selected ranks in a reproducible order with node purchase groups and typed budgets after every edit. Preserve invalid selections and their dependency chains. Talent Points have a verified base level grant, but a level alone cannot establish a full available balance where modifiers or external grants are unknown. Heroic Essence's zero-looking cap is not zero available points.

### Publish a compact typed talent payload

Project playable classes, published level bounds, all linked trees, node indexes and positions, icons, full rank data and costs, raw condition groups, point types and documented point grants from catalog to a versioned planner payload. Load this only on `/planner`, through the current publication loader. Use stable catalog entity keys internally and published names to readers. Compare projection against class documents and direct catalog counts, including Hunter, optional-count groups, later ranks and missing fields. Source publication identity comes from the accepted catalog; build a catalog candidate only where additional captured facts are required and review equal-row or changed-row comparisons.

### Keep one remembered character, not two saved levels

Use a single browser-only store under `compendium.character.v1` with schema version, source catalog, canonical v1 build payload, class and level, and an explicit active/inactive state. The store owns character-level reads and writes for the planner, progression and place controls. On first read, migrate the `character` entry from `compendium.reader-levels.v1` as an uncommitted class/level draft; retain skill entries there. An active class/level replaces that draft only by explicit selection. Avoid two long-lived character-level sources, and synchronize another tab through `storage` events. Preserve the full saved link and unresolved references across a catalog update, showing a data-change notice rather than silently discarding choices.

The URL workspace is separate from the active store: opening a link or editing and copying its preview changes no active state. “Use as My Character” commits the visible workspace explicitly and preserves focus. A malformed link does not write storage. A short “Stored only in this browser” sentence and a compact Character navigation entry explain the model without a profile bar or modal onboarding.

### Share one stable URL without claiming gear support

Use `/planner?build=v1.<base64url>` and serialize UTF-8 JSON keys in the exact order `catalog`, `class`, `level`, `points`, `talents`, `gear`; Planner 1 emits an empty `gear` array. Validate structural limits, keys, integers, duplicates and canonical sort before use. Treat another catalog ID as source provenance: re-match stable references and re-run checks, reporting both unmatched and newly blocked choices. Retain incoming valid gear pairs as unevaluated link choices, with a warning before copying a reduced Planner 1 URL. `plan-character-gear` will resolve those slots and items without changing the v1 shape. The existing save-progress change can emit v1 with empty `gear` and `points` without reading saves here.

### Present the planner and cross-site context in the existing visual system

At 1440 CSS pixels put character/balances in a narrow left column below the header band, tree web/list in the center and selected-node inspector at the top right. At 390 pixels use a one-column layout with a compact status summary, fitted web/list, and inline inspector. Preserve the existing tree icons, links, nodes and list text. Inspector: selected rank, verified next-rank cost, separate requirements and reasons, plus/minus, Undo, Reset Tree and confirmed Reset Build. Reserve status space and preserve focus and scroll; no hover lift, page-wide overflow or large unsolicited gear panel. Check 1100 pixels too.

Other pages consume only the shared active class and level: unobtrusive level comparisons on progression and place pages while preserving level curves and skill XP breakpoints, class context on item and ability pages only with published support, and “Gear Score Not Available” at Heroic Tier without an evidenced gear score. Inactive or unknown character adds no empty panel. Use existing DetailFrame, TitleBlock, AnswerCard, SideCard, Section, RelationTable, CompareTable, LinkGrid, TabSet and EntityLink patterns rather than a second visual vocabulary.

## Risks / Trade-offs

- Native predicates can depend on hidden game state or modifiers. Mark affected checks unverified and describe the missing input rather than mislabeling a legal purchase.
- An old URL or stored character can refer to removed nodes. Preserve a migration report and warn before a new link drops them.
- The planner payload can be large. Keep it route-scoped and measure navigation/hydration on an item-heavy page as well as `/planner`.
- A device can deny browser storage. Keep the character usable in memory for that session and explain that persistence is unavailable, without a server fallback.

## Migration Plan

First establish the shared character-level module and migration from the old level key, then publish verified planner data and the talent route. Stage against accepted 0.16.3 publication, inspect both desktop and phone layouts in Chromium and Firefox, test links and migration with an already remembered character, and accept catalog/publication updates together so preview and development stay aligned. Gear/stat work follows in `plan-character-gear`; no gear picker or stat calculation ships in this change.
