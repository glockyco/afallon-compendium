## Context

The catalog keeps each talent rank's own stat changes and its pet stat changes. A pet stat change has a target type (`AllPets`, `SpecificNPC`, `Species`, or `HunterBeast`), an NPC reference, a species id, a stat, an amount, and a percentage flag. The catalog has no species entities. The publication projects only the own stat changes and the text of an empty rank.

The game writes the talent tooltip in `AbilityTooltip.GenerateBonusTooltip` (build 25653798, RVA `8951c0`, end `896043`). The decompiled method and the decoded string literals show this order:

1. An empty rank shows only its tooltip text.
2. Each own stat change is one line: the stat name, "Increased" or "Reduced", "by", and the amount. The line adds " %" when the change or its stat is a percentage (`RPGStat.isPercentStat`).
3. Each pet stat change whose stat exists is one line that starts with the pets and ": ". The pets are `tooltip.hunter_beast` ("Your beast") for `HunterBeast`, the NPC name for `SpecificNPC` when the NPC exists, and the species name for `Species` when the species exists. In every other case the pets are `tooltip.all_pets` ("Summons"). The same percentage rule applies.

The localization values come from the 0.16.3 canonical localization output. The evidence is recorded in `local/update-0-16-3/bonus-tooltip-rules-20261001.md` of the main checkout.

## Goals / Non-Goals

**Goals:** Show every stat change that the game's talent tooltip shows, with the same pets and the same percentages. Make a complete publication fail when a talent rank leaves out such a change.

**Non-Goals:**
- Use the game's "Increased by" wording. The page keeps its signed form, for example "+2% Damage Dealt".
- Show talent descriptions. The game adds a description only for talents in its code table `AbilityTuning`, and the catalog does not record that table.

## Decisions

- The catalog owns the percentage rule, as it does for item and gear-set stats. Progression normalization receives the same map of percentage stats as item normalization. It sets `isPercent` on a talent stat change and a pet stat change when the change or its stat is a percentage. Other progression stat rows keep their authored flag, because no native display rule for them is recorded.
- The catalog contract names the rank and pet change types (`ProgressionBonusRank`, `ProgressionPetStat`) instead of defining them inline.
- A talent rank gets `petStats`: groups of stat rows, one group for each set of pets, in the order of their first change. `pets` is a union tagged by `kind`, as other public contract unions are: `{ kind: "beast" }`, `{ kind: "summons" }`, or `{ kind: "npc", npc }`. The page writes "Your beast" and "Summons", which are the game's own words, and links the NPC when it has a page. One group is one line on the page.
- A `SpecificNPC` change whose NPC is missing names "Summons", as the game does. A pet change whose stat is missing is not shown, because the game skips it. A `Species` change is not published, because the catalog keeps no species names.
- The tooltip coverage audit compares each published talent rank with its catalog rank. The published stat rows must equal the own changes plus the pet changes whose stat exists. A shortfall, for example from a species change, is a publication issue. A complete publication fails on any issue, so the audit replaces an exception in the projection.
- The static class document id moves from v4 to v5.

## Risks / Trade-offs

The percentage rule changes the published amounts of 51 talents from flat to percentage. The rule comes from the decompiled tooltip, which uses one check for own and pet changes.

Like item stats, a talent change's `isPercent` then records how the game shows the change, not whether the authored row was a percentage. A later consumer that computes stat totals needs the authored flag and the stat's `isPercentStat` separately. That applies to item stats already.
