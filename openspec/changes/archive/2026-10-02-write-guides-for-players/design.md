## Context

The rules record phrases were written as close paraphrases of the decompiled methods, so that each phrase matched its evidence word for word. That made them precise for a reviewer but hard to read for a player. The site renders each phrase with its links as a closing comma list, so a phrase that names one entity must end with it. The guide pages add computed sentences and notes in the same style.

## Goals / Non-Goals

**Goals:**
- Guide text that a game wiki editor would write: direct, second person where it helps, numbers where they matter.
- Rule phrases that keep the claims of their evidence and drop detail that does not change what a player does.
- Links inside sentences where a sentence names one or two entities.

**Non-Goals:**
- New rules, new evidence, or new placements.
- Changes to the item, NPC, or other entity pages.

## Decisions

### Rewrite the phrases in a new rules record

The phrases live in the reviewed rules record, so a new record carries the new wording. Each phrase keeps the claim of its rule. A detail that does not change a player's choice can go, such as the case where the minimum and maximum experience are equal. A phrase can drop an operand that no code reads, such as the percent divisor of Experience Bonus or the 0 to 100 roll range. The operands that code reads stay: the crafting gate and bands, the auto-attack experience, and the gathering yield bonus.

### Link tokens

`{#n}` names link `n` inside the phrase. A phrase uses tokens for all its links or for none, so a reader never sees a name twice or a name that the sentence skips. Without tokens, the links form a closing list joined like "A, B, and C". The catalog validates the tokens, and the site renders them. The static mechanics schema id changes, because an older site would show the tokens as text.

### Remove qualifying notes

The level curve names its totals "Total experience to reach level N" and "Experience from level N to the cap", so its fresh-start note goes. The creature counts of kill experience become one sentence that says how many creatures follow the player's level and how many have a fixed level, so their note goes.

## Risks / Trade-offs

- Shorter phrases leave out edge cases that the old phrases named. → The evidence keeps them, and each remaining phrase stays true.
- Free wording can drift from the evidence. → Each phrase is checked against its original claim before the record is registered.
