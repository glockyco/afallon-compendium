## ADDED Requirements

### Requirement: Character Progression answers for one remembered level

The Character Progression page SHALL lead its curve section with the published experience from the selected character level to the next, and a conditional range of whole kills of a linked published creature at a published place and spawn level, based on the verified kill calculation without followers, Heroic empowerment, or Experience Bonus. The example SHALL name these conditions and explain that other game and world effects can change an actual award. At the cap it SHALL not promise another level or a finite number of kills. The selected-level answer SHALL sit beside the one always-visible complete labeled logarithmic curve on wide screens and stack above it on phones. Its axis and level tick labels SHALL remain legible at small text size across viewport widths, and its selected point SHALL follow the remembered level. A full-width experience journey strip SHALL follow the answer and chart. A named disclosure SHALL retain every published level breakpoint without repeating the chart. The journey bar SHALL report the selected level's share of total published experience to the cap in numbers as well as visually, and SHALL identify the experience share in the last ten levels as experience distribution, not time or predicted effort.

The page SHALL offer exactly one character-level control shared by its curve answer, kill calculator, and level-up talent point example. Its saved value SHALL use the same browser-local reader level used by the site's other character examples, with a visible fallback when no level has been saved and no silent change to a previously selected level when the creature changes. The opening example SHALL prefer a published ordinary open-world creature at the selected level over challenge variants, named elites, or internal names with parenthetical qualifiers when such a creature is available. The Heroic creature comparison SHALL align its creature-and-place selector and character/gear level controls within their columns. One comparison card SHALL show Normal and conditional Heroic kill experience side by side, with Heroic health and damage factors relative to Normal in separate rows and dashes instead of invented absolute Normal values. It SHALL explain that only some creatures become Heroic while the tier is active and retain its affix and Essence conditions below the table; absolute combat values SHALL remain absent until verified and published.

#### Scenario: Linked kill estimate
- **WHEN** a reader selects level 40 with Enraged Ent at its published Oakshade Logging Camp spawn, alongside level-matched challenge-stone variants and an elite
- **THEN** the opening estimate names Enraged Ent at creature level 40 and shows 24,496 experience to the next level with about 598 kills at 41 experience each
- **AND** it links the ordinary creature and place, without an internal parenthetical variant name, and states the absent followers, Heroic status and Experience Bonus and possible other effects

#### Scenario: Journey proportion
- **WHEN** a reader selects a level below the cap
- **THEN** earned and remaining percentages use cumulative published experience and sum to 100 percent before display rounding
- **AND** the share for levels 50 through 60 is calculated from the same published rows, rather than being a fixed label

#### Scenario: Remembered level
- **WHEN** a reader saved a character level on another page and opens Character Progression
- **THEN** the visible control, opening answer, kill calculator, and level-up talent point example all use that saved level
- **AND** changing it updates all those results and the saved value

#### Scenario: One visible curve with inspectable breakpoints
- **WHEN** a reader opens Character Progression at 1440, 1100, or 390 px
- **THEN** the answer card sits beside one visible full curve on wide screens and above it on phones, with a marked selected level and readable muted axis labels
- **AND** the full-width journey strip follows those two, and the table of every breakpoint stays in a disclosure without a second chart

#### Scenario: Aligned calculator and Heroic controls
- **WHEN** a reader compares a creature's kill experience at 1440 px
- **THEN** the open settings card contains the creature select as its first control, while that settings card and the result card align with equal heights and the award identifies experience
- **AND** the Heroic creature-and-place select and level controls fit their comparison columns without mismatched widths

#### Scenario: Heroic relative strength without empty baselines
- **WHEN** a reader compares a normal eligible creature with its conditional Heroic outcome
- **THEN** one card shows Normal and Heroic columns with kill experience in each and no 1× baseline rows
- **AND** Maximum health and Damage rows show dashes for Normal and verified relative factors for Heroic, with affix and Essence conditions beneath the table

#### Scenario: Level cap and small screen
- **WHEN** the selected level is the cap on a 390 px screen
- **THEN** the page shows completion instead of a next-level kill count, keeps a readable numerical journey share and selected curve marker state, and offers the full chart and breakpoints without horizontal page overflow
- **AND** the calculator's immediate answer precedes optional settings and detailed calculation stages in reading order

## MODIFIED Requirements

### Requirement: Character Progression relates kills to the level curve

For the selected player level, the page SHALL show the template's experience needed to advance from zero current experience at that level and the range of whole kills needed using the calculator's modeled minimum and maximum, with the shortest count based on the maximum and longest on the minimum. These counts SHALL round the quotient upward. An estimated kill amount of zero SHALL NOT produce a finite kill count. At the level cap, the page SHALL show no next-level requirement or misleading finite kill count. The settings card SHALL lead with the creature picker and SHALL offer the selected creature level when several published spawn levels are possible, living followers, nonnegative Experience Bonus and conditional Heroic empowerment. The selected creature's page link and place SHALL accompany the result, and its levels, base roll, and level modifiers SHALL remain accessible in a named disclosure. The settings and the result SHALL sit side by side with aligned tops and equal heights on wide screens. On narrow screens the result SHALL precede the settings card so the answer is visible before the controls, with the source facts following both. The result box SHALL identify the experience per kill, the kills to the next level with the experience that this level needs, a disclosure of the stages that produced the range, and the caveat about world and game modifiers. The level curve, the quest and skill guidance, and the talent progression SHALL remain available.

#### Scenario: Kill count range
- **WHEN** the next level needs 20 experience and the modeled possible award is 6 to 9
- **THEN** the page shows 3 to 4 modeled kills, using ceiling of 20 ÷ 9 and 20 ÷ 6 respectively

#### Scenario: Zero award or level cap
- **WHEN** the model's minimum award is zero, or the player selects the level cap
- **THEN** the page does not show a finite upper kill count for a zero minimum or a next-level kill count at the cap

#### Scenario: Calculator layout
- **WHEN** a reader opens the Character Progression page at 390 px
- **THEN** the result appears before the settings card, and every calculator control, result, and linked creature fact remains readable without horizontal page overflow
- **AND** the curve and progression guidance remain accessible

#### Scenario: Wide calculator
- **WHEN** a reader opens the Character Progression page at 1440 px
- **THEN** the open settings and result cards sit side by side at equal height, with the creature picker first inside the settings card
- **AND** the result card contains disclosed stages and a visible caveat
