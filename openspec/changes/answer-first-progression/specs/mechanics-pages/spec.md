## ADDED Requirements

### Requirement: Character Progression answers for one remembered level

The Character Progression page SHALL lead its curve section with the published experience from the selected character level to the next, and a conditional range of whole kills of a linked published creature at a published place and spawn level, based on the verified kill calculation without followers, Heroic empowerment, or Experience Bonus. The example SHALL name these conditions and explain that other game and world effects can change an actual award. At the cap it SHALL not promise another level or a finite number of kills. The selected-level answer and experience journey SHALL appear in aligned cards above one always-visible complete labeled logarithmic curve. Its axis and level tick labels SHALL remain legible at small text size across viewport widths, and its selected point SHALL follow the remembered level. A named disclosure SHALL retain every published level breakpoint without repeating the chart. The journey bar SHALL report the selected level's share of total published experience to the cap in numbers as well as visually, and SHALL identify the experience share in the last ten levels as experience distribution, not time or predicted effort.

The page SHALL offer exactly one character-level control shared by its curve answer, kill calculator, and level-up talent point example. Its saved value SHALL use the same browser-local reader level used by the site's other character examples, with a visible fallback when no level has been saved and no silent change to a previously selected level when the creature changes. The kill calculator SHALL show its selected-creature result near the creature selection on phones before optional modifiers, while keeping all modifier controls, stages, source facts, and caveats accessible. The creature selector SHALL match the width of the settings card below it. On wide screens, the always-open settings and result cards SHALL sit side by side with aligned tops and equal heights; on phones, the result SHALL appear before the settings. A creature with more than one available spawn level SHALL offer its level selector in that settings card. The result SHALL label the modeled experience award and separate its footnote and stages consistently. The Heroic creature comparison SHALL likewise align its creature-and-place selector and character/gear level controls within their columns.

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

#### Scenario: One visible curve with inspectable breakpoints
- **WHEN** a reader opens Character Progression at 1440, 1100, or 390 px
- **THEN** the answer and journey cards precede one visible full curve, with a marked selected level and readable, muted axis labels
- **AND** the table of all level breakpoints remains in a disclosure below that curve, with no second chart

#### Scenario: Aligned calculator and Heroic controls
- **WHEN** a reader compares a creature's kill experience at 1440 px
- **THEN** the creature select spans the same column width as an open settings card with applicable controls, while that settings card and the result card align with equal heights and the award identifies experience
- **AND** the Heroic creature-and-place select and level controls fit their comparison columns without mismatched widths

#### Scenario: Level cap and small screen
- **WHEN** the selected level is the cap on a 390 px screen
- **THEN** the page shows completion instead of a next-level kill count, keeps a readable numerical journey share and selected curve marker state, and offers the full chart and breakpoints without horizontal page overflow
- **AND** the calculator's immediate answer precedes optional settings and detailed calculation stages in reading order
