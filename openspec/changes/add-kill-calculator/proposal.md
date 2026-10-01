## Why

The Character Progression guide explains the rules for kill experience but offers only a single static example. Readers cannot compare the published creatures they can actually encounter or see how their level, Heroic status, and companions affect a kill without doing the arithmetic themselves.

## What Changes

- Publish build-specific kill calculator inputs from eligible, linked creature records, grouped by their published places, alongside the existing Character Progression curve and guide.
- Add an interactive calculator on `/mechanics/character-progression` for choosing a creature and player level, and for adjusting Heroic status, the number of living followers, and Experience Bonus percentage. Show the possible modeled kill-experience range, kills to next level from zero current experience, and linked creature facts, while distinguishing unmodeled game and world modifiers from the final in-game award.
- Apply only verified native arithmetic: an integer base roll excluding the authored maximum except when the two bounds match; the game-modifier stage as an unmodeled boundary; creature-specific level percentage contributions with their own integer truncation; Heroic multiplication with ties-to-even rounding; an integer companion split; and a positive Experience Bonus before the unmodeled world multiplier. Keep the bonus result unrounded because the game can convert the award to an integer only after world modifiers. Keep the level-curve visualization and quest/skill progression sections intact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mechanics-pages`: Character Progression publishes and displays an evidence-bounded, creature-aware kill experience calculator.

## Impact

- Public mechanics document contract and build-time projection of creature and place references; no new catalog scan or game constants in site code.
- Character Progression page UI, scoped behavior verification, and publication-contract tests.
- The current single-creature static kill example is superseded by the interactive calculator; Heroic Tier, quest, skill, and level-curve content remains available.
