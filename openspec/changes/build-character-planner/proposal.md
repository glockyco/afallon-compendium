## Why

Class pages show talents but cannot hold a proposed build or produce a link that another reader can open. A planner can let readers compare their own class, level, talent, gear, and stat choices without ranking builds.

## What Changes

- Add a planner at `/planner` with class and level selection, talent ranks, point balances by type, and shareable URLs.
- Trace the game's general requirement evaluator before the planner judges a talent purchase. Show an unmet or unverified requirement instead of claiming that an unchecked build is legal.
- Add a later gear and stat phase in this change. Verify equip rules and stat calculations before showing computed totals. Keep unsupported modifiers visible and exclude them from totals.
- Define a stable, versioned build URL that the later save-progress change can produce. The planner reads no save file.
- Publish the planner data from the accepted catalog. Compare any new catalog candidate with the accepted catalog, stage a publication candidate, and accept both artifacts together.

## Capabilities

### New Capabilities

- `character-planner`: Class and level selection, talent purchases, gear and stat presentation, and the versioned build URL.

### Modified Capabilities

None.

## Impact

- Research: `RequirementsManager.RequirementsMet` and `IsRequirementMet`, talent rank-up and point rules, equip checks, and stat calculation on build 25434619.
- Contracts, catalog, and publication: typed planner facts, requirements, point rules, gear facts, and a public planner data document derived from the accepted catalog.
- Site: `/planner`, shared talent icons and tree views from `show-talent-trees`, URL state, and gear and stat controls.
- Artifacts: a catalog candidate if evidence capture changes, a staged publication candidate, a browser review, and joint catalog and publication acceptance.
