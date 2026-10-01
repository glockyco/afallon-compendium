## Why

The older Mechanics guides read stiffly and expose internal records. Examples are "That the stat is health is an inference." and "The game treats the full range as two bands that meet at +10 levels." Steps repeated the overview or their own rules. Rules that link names ended a full sentence and then listed the names without a lead-in. A shields rule still linked three skills that the game trains since 0.16.3. The worked craft showed the internal split of the full band as "First full" and "Second full". The publication also patched two phrases in code instead of publishing the reviewed wording.

## What Changes

- Rewrite the phrases of the Character Progression, Heroic Tier, and Crafting and Gathering rules in plain language, in a new rules record. Rules that link names lead into them. Unknown rules state their claim after the "Unknown:" label.
- Rewrite the overviews and steps of these guides and the Corruption rules, so that a step does not repeat the overview or its rules.
- Publish one full experience band instead of two, and drop the operand of the internal split from the band rule.
- Remove the shields rule's stale links and placement, and the curly apostrophes of two Loot rules.
- Publish the phrases of the rules record unchanged.
- **BREAKING** Bump the static item and static mechanics document schema identifiers once for the band names.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mechanics-pages`: Steps do not repeat the overview or their rules, and linked names follow a lead-in.
- `crafting-and-gathering`: A worked craft shows one full experience band.

## Impact

Rules record (data), guide steps, Corruption rules, crafting band projection and its contract, the Crafting and Gathering page, and rule projection.
