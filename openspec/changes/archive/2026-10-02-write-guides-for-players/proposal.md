## Why

The mechanics guides read like paraphrased game code, not like a wiki that players use. For example, the kill experience rule says "A kill starts from a random whole number from the creature's minimum experience up to one less than its maximum. If the two are equal, it starts from that number." Notes such as "These are the highest levels of these creatures. Characters still gain experience at higher levels." only qualify other text. Rules that name items must end with a list of names, so they end in sentences such as "The pack is Adventurer's Supply Pack".

## What Changes

- Every rule phrase, section lead, overview, and computed sentence of the five guides is rewritten for players: it says what the player gets or must do, in plain sentences, and leaves out code paraphrase and data-source notes. The claims, statuses, and evidence of the rules stay the same.
- **BREAKING** A rule phrase can name a link inside the sentence with `{#n}`, where `n` is the index of the link. A phrase without such tokens keeps its closing list of links, which now reads as a list ("A, B, and C"). The mechanics document schema gets a new id, because its phrases now carry link tokens.
- Catalog creation rejects a link token without a link, and a phrase that names some of its links inline but not all.
- The level curve labels its totals as totals from the first level and drops its fresh-start note. The creature counts of kill experience read as one sentence and drop their note.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mechanics-pages`: Guide text is written for players, rules name their links inline or in a closing list, and the level curve labels its totals.
- `progression-data`: Rule phrases can place their links inline, and catalog creation validates these places.

## Impact

- Evidence: a new rules record for build 25653798 with rewritten phrases and without the operands that no phrase names. The evidence objects, statuses, and placements do not change.
- Catalog: link token validation in `packages/catalog/src/mechanics.ts`.
- Contracts: the documentation of rule phrases and the static mechanics schema id.
- Publication: the guide leads and overviews in `packages/publication/src/guide-sections.ts`.
- Site: `RulePhrase.svelte`, the five guide pages, `LevelCurve.svelte`, and `KillCalculator.svelte`.
- Artifacts: a catalog with the new rules record, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
