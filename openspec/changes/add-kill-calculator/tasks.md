## 1. Publish Calculator Inputs

- [x] 1.1 Replace the public Character Progression static example contract with grouped eligible creature inputs, deterministic default creature, and optional captured Heroic multiplier; verify with a scoped contract validation using a published example and an excluded incomplete creature.
- [x] 1.2 Project creature-specific fixed level, valid experience bounds, and both level modifiers from published NPC records into published place groups (or Other when unplaced), preserving multi-place membership and actual linked references; verify a scoped publication test for missing fields, distinct modifiers, an unplaced creature, and a creature at two places.

## 2. Calculate and Display Experience

- [x] 2.1 Implement the calculator's ordered modeled stages with exclusive maximum roll, percentage-contribution truncation, Heroic ties-to-even rounding, integer follower division, and unrounded positive Experience Bonus; verify scoped cases covering equal/above/below levels, negative percentage contribution, half-integer Heroic result, 0/10 followers, and fractional bonus.
- [x] 2.2 Show full-width accessible controls, a modeled range, linked creature facts, the game/world-modifier caveat, and fresh-level kills-to-next-level bounds beside the existing guide, and synchronize the level-curve slider with the calculator level; verify directly in the running guide at desktop and 390 px, including the zero-award and level-cap boundaries.

## 3. Validate the Cutover

- [x] 3.1 Migrate every consumer and fixture from the obsolete one-creature example, remove unused schema and UI paths, and verify scoped publication and site checks for the updated Character Progression document.
- [x] 3.2 Validate this OpenSpec change strictly and exercise a published candidate's calculator against real linked creature and place facts while confirming the curve, quest/skill guidance, Heroic Tier page, and navigation still work; retain only verified completion marks.

## 4. Spawn Levels and Polish

- [x] 4.1 Publish one entry for each creature at each place where it spawns, with the union of its published location levels there, and leave out creatures without a published spawn; verify with focused publication tests for a fixed range, a scaling zone range, a non-scaling record at a scaling spawner, and an unplaced record.
- [x] 4.2 Add a creature level select of the levels at the selected place that resets to the character level, limited to those levels, on a new creature or character level, and keep the character level when the creature changes; verify the stage labels and the level comparison with focused calculator tests.
- [x] 4.3 Lay out the picker with one facts line, then the settings beside one result box with the experience per kill, the kills to the next level, the stages, and the caveat; verify in the running site at 1440 px and 390 px, and replace `local/design/implemented/kill-calculator-{1440,390}.jpg`.
