## 1. Publish Calculator Inputs

- [x] 1.1 Replace the public Character Progression static example contract with grouped eligible creature inputs, deterministic default creature, and optional captured Heroic multiplier; verify with a scoped contract validation using a published example and an excluded incomplete creature.
- [x] 1.2 Project creature-specific fixed level, valid experience bounds, and both level modifiers from published NPC records into published place groups (or Other when unplaced), preserving multi-place membership and actual linked references; verify a scoped publication test for missing fields, distinct modifiers, an unplaced creature, and a creature at two places.

## 2. Calculate and Display Experience

- [x] 2.1 Implement the calculator's ordered modeled stages with exclusive maximum roll, percentage-contribution truncation, Heroic ties-to-even rounding, integer follower division, and unrounded positive Experience Bonus; verify scoped cases covering equal/above/below levels, negative percentage contribution, half-integer Heroic result, 0/10 followers, and fractional bonus.
- [x] 2.2 Show full-width accessible controls, a modeled range, linked creature facts, the game/world-modifier caveat, and fresh-level kills-to-next-level bounds beside the existing guide, and synchronize the level-curve slider with the calculator level; verify directly in the running guide at desktop and 390 px, including the zero-award and level-cap boundaries.

## 3. Validate the Cutover

- [x] 3.1 Migrate every consumer and fixture from the obsolete one-creature example, remove unused schema and UI paths, and verify scoped publication and site checks for the updated Character Progression document.
- [x] 3.2 Validate this OpenSpec change strictly and exercise a published candidate's calculator against real linked creature and place facts while confirming the curve, quest/skill guidance, Heroic Tier page, and navigation still work; retain only verified completion marks.
