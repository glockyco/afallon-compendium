## Why

The compendium's entity tooltips reuse reduced page cards, while the scan and publication omit native ability mechanics, item use text, requirement semantics, and some percentage metadata. This produces incomplete or incorrect tooltips, prevents the remaining gear-set work from matching the game, and contradicts the existing screenshot-first parity goal.

## What Changes

- Publish native ability tooltip content for every authored rank, including activation, target or range, cooldown, description, damage, healing, effects, and other generated mechanic lines.
- Publish native item use and buff text, and apply the game's effective percentage rule to item, gem, and gear-set stats.
- Preserve typed requirement predicates, separate equipment requirements from use conditions, render each equipment requirement once, and apply the declared synthetic state in which all character-dependent requirements are fulfilled.
- Render item tooltips in the game's observed order, including inline gear-set members and tier bonuses. The current item is the only active member; all other members are inactive, and the synthetic equipped count is one.
- Replace generic compact item and ability cards with dedicated, non-lossy tooltip presentations. Define useful compact content for the remaining page kinds instead of suppressing all relation-backed facts uniformly.
- Repair pointer, keyboard, scrolling, dismissal, and assistive-technology behavior so long tooltips remain readable without trapping focus.
- Replace unbounded ability-user disambiguation labels with concise stable labels while retaining full usage relations on entity pages.
- **BREAKING**: revise the static item, ability, requirement, and related public document schemas in one clean cutover. Do not retain deprecated aliases or dual document shapes.
- Move ownership of the unfinished gear-set tooltip work from `build-compendium-reference` into this complete parity change so the two changes do not claim the same implementation task.

## Capabilities

### New Capabilities

- `compendium-tooltips`: Defines complete native-derived tooltip data, deterministic synthetic state, per-kind presentation, interaction behavior, and parity verification for compendium entity links.

### Modified Capabilities

- None.

## Impact

- Scan collectors and their typed decoders gain native ability-rank tooltip output and item use or buff output.
- Catalog facts and condition queries gain complete requirement semantics and effective percentage metadata.
- Public contracts and publication projection change for abilities, items, requirements, NPC ability references, gems, and gear-set tiers; affected static document schema IDs must be versioned together.
- Site tooltip loading and rendering gain dedicated item and ability presenters, referenced gear-set loading, per-kind compact policies, concise duplicate labels, and corrected interaction semantics.
- Publication fixtures, contract tests, loader tests, browser verification, deployment graph checks, and current-build parity evidence must be updated.
- The existing `build-compendium-reference` change remains the source of the base page model, but its pending task 7.4 is superseded by this change.