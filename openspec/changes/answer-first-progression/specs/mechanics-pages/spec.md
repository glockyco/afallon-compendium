## ADDED Requirements

### Requirement: Character Progression answers for one remembered level

The Character Progression page SHALL lead its curve section with the published experience from the selected character level to the next, and a conditional range of whole kills of a linked published creature at a published place and spawn level, based on the verified kill calculation without followers, Heroic empowerment, or Experience Bonus. The example SHALL name these conditions and explain that other game and world effects can change an actual award. At the cap it SHALL not promise another level or a finite number of kills. A compact curve with the selected point SHALL remain visible, while the complete labeled logarithmic curve and every published level breakpoint SHALL be available in a named disclosure. A journey bar SHALL report the selected level's share of total published experience to the cap in numbers as well as visually, and SHALL identify the experience share in the last ten levels as experience distribution, not time or predicted effort.

The page SHALL offer exactly one character-level control shared by its curve answer, kill calculator, and level-up talent point example. Its saved value SHALL use the same browser-local reader level used by the site's other character examples, with a visible fallback when no level has been saved and no silent change to a previously selected level when the creature changes. The kill calculator SHALL show its selected-creature result near the creature selection on phones before optional modifiers, while keeping all modifier controls, stages, source facts, and caveats accessible.

#### Scenario: Linked kill estimate
- **WHEN** a reader selects level 40 and a published creature scales to level 40 at a published place
- **THEN** the opening estimate uses that creature at level 40 and the verified whole-kill range for the published level-to-next requirement
- **AND** it links the creature and place, and names the absent followers, Heroic status and Experience Bonus as well as possible other effects

#### Scenario: Journey proportion
- **WHEN** a reader selects a level below the cap
- **THEN** earned and remaining percentages use cumulative published experience and sum to 100 percent before display rounding
- **AND** the share for levels 50 through 60 is calculated from the same published rows, rather than being a fixed label

#### Scenario: Remembered level
- **WHEN** a reader saved a character level on another page and opens Character Progression
- **THEN** the visible control, opening answer, kill calculator, and level-up talent point example all use that saved level
- **AND** changing it updates all those results and the saved value

#### Scenario: Level cap and small screen
- **WHEN** the selected level is the cap on a 390 px screen
- **THEN** the page shows completion instead of a next-level kill count, keeps a readable numerical journey share and selected curve marker state, and offers the full chart and breakpoints without horizontal page overflow
- **AND** the calculator's immediate answer precedes optional settings and detailed calculation stages in reading order
