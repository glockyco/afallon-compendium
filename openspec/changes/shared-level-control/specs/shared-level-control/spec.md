## Purpose

Let readers adjust comparable numeric values directly without relying on small browser spinner arrows or precise typing.

## ADDED Requirements

### Requirement: Numeric comparison controls share one interaction

Character, creature, skill, corruption, and gear-score adjustments SHALL use a labelled number field between decrement and increment buttons. A slider SHALL accompany the stepper wherever the layout has room and on mechanics pages. On phones, both buttons SHALL offer at least 44-pixel tap targets. Holding either button SHALL repeat after a short delay. Native spinner arrows SHALL not appear. Controls SHALL use the site's border, radius, surface, and accent colors without lifting on hover.

#### Scenario: Stepping and holding
- **WHEN** a reader clicks Raise Level once, then holds Lower Level
- **THEN** the value rises by one, then falls repeatedly after a short delay until the button is released or the minimum is reached

#### Scenario: Bounds and typed values
- **WHEN** a reader types a value outside the control's supported range and leaves the field or presses Enter
- **THEN** the field and computed result use the nearest supported value, never an invalid number
- **AND** the lower or upper button is disabled at its respective bound

#### Scenario: Keyboard and slider
- **WHEN** the reader focuses the number or its slider and uses Up or Right, Down or Left, Page Up or Page Down, Home, or End
- **THEN** these keys select plus one, minus one, plus ten, minus ten, the minimum, or the maximum respectively, clamped to the range
- **AND** both the field and slider have meaningful accessible labels

#### Scenario: Remembered character and skill values
- **WHEN** a reader chooses a character or skill level and visits another page or reloads
- **THEN** both the stepper and dependent results show the remembered level, limited to each page's available bounds without changing the stored value

### Requirement: Progression marker tracks the selected level

On a Places level axis, the reader SHALL be able to drag the level marker to a whole level and adjust it with the same keyboard commands as the control. The marker's pointer SHALL remain centered on the precise selected tick. Near the chart edges, its label SHALL move inward without moving the pointer from that tick. Axis ticks SHALL have visible marks. When the reader's level equals a labelled tick, its number SHALL be hidden on the flagged axis because the flag already names that level. Otherwise the flag SHALL have at least six pixels of clear space above visible tick numbers.

#### Scenario: Dragging the marker
- **WHEN** a reader drags the level marker across the Places axis to the position of level 30
- **THEN** the marker snaps to level 30, the matching place ranges highlight, and the remembered character level updates

#### Scenario: Marker keyboard and edges
- **WHEN** a reader focuses the marker and presses Page Up or End near the axis edge
- **THEN** the selected level advances by ten or reaches the upper bound, and the label remains inside the chart with its pointer exactly at the selected tick

#### Scenario: Selected tick stays clear
- **WHEN** the reader selects level 10 on an axis with a labelled level-10 tick
- **THEN** the flag shows You 10 directly above its tick, the separate 10 tick number is hidden, and the tick mark remains visible

#### Scenario: Level between ticks
- **WHEN** the reader selects level 15 or the upper bound just beyond a labelled tick
- **THEN** labelled ticks remain readable below the flag with at least six pixels of clear vertical space and visible tick marks
