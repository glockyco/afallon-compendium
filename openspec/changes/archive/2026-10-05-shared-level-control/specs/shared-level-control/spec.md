## Purpose

Let readers adjust comparable numeric values directly without relying on small browser spinner arrows or precise typing.

## ADDED Requirements

### Requirement: Numeric comparison controls share one interaction

Character, skill, corruption, and gear-score adjustments, and creature levels in the kill calculator, SHALL use a labelled number field between decrement and increment buttons. The Heroic creature-level picker MAY remain a select alongside the creature-and-place picker. A slider SHALL accompany the stepper wherever the layout has room and on mechanics pages, except a short bounded setting such as living followers where the stepper alone is sufficient. On phones, both buttons SHALL offer at least 44-pixel tap targets. Holding either button SHALL repeat after a short delay. Native spinner arrows SHALL not appear. Controls SHALL use the site's border, radius, surface, and accent colors without lifting on hover.

#### Scenario: Stepping and holding
- **WHEN** a reader clicks Raise level once, then holds Lower level
- **THEN** the value rises by one, then falls repeatedly after a short delay until the button is released or the minimum is reached

#### Scenario: Bounds and typed values
- **WHEN** a reader types a value outside the control's supported range and leaves the field or presses Enter
- **THEN** the field and computed result use the nearest supported value, never an invalid number
- **AND** the lower or upper button is disabled at its respective bound

#### Scenario: Keyboard and slider
- **WHEN** the reader focuses the number or its slider and uses Up or Right, Down or Left, Page Up or Page Down, Home, or End
- **THEN** these keys select plus one, minus one, plus ten, minus ten, the minimum, or the maximum respectively, clamped to the range
- **AND** both the field and slider have meaningful accessible labels

#### Scenario: Focused slider
- **WHEN** the reader focuses a slider with the keyboard
- **THEN** its focus indicator stays near the thumb rather than outlining the full track, and disappears after focus leaves

#### Scenario: Short follower range
- **WHEN** the reader adjusts the number of living followers between zero and ten
- **THEN** the stepper remains available without an additional slider, with a label and stepper aligned in size and position with neighbouring calculator settings

#### Scenario: Remembered character and skill values
- **WHEN** a reader chooses a character or skill level and visits another page or reloads
- **THEN** both the stepper and dependent results show the remembered level, limited to each page's available bounds without changing the stored value

### Requirement: Heroic comparison controls share grid rows

On wide screens, the Creature and place select and Character level stepper SHALL share the first row, while the Creature level select and Equipped gear score stepper SHALL share the second. Each pair SHALL align its labels and its select or stepper inputs at the top with matching input heights, with a reserved slider row below each select opposite the slider. On phones the controls SHALL stack in one column.

#### Scenario: Four Heroic controls on desktop
- **WHEN** the selected creature has more than one possible spawn level on a wide screen
- **THEN** the four controls form a two-column, two-row grid whose paired labels and inputs line up

#### Scenario: Heroic controls on a phone
- **WHEN** the same comparison opens on a narrow screen
- **THEN** the four controls stack vertically, with the selects and steppers the same height

### Requirement: Progression marker tracks the selected level

On a Places level axis, the reader SHALL be able to drag the level marker to a whole level and adjust it with the same keyboard commands as the control. The marker's pointer SHALL remain centered on the precise selected tick. Near the chart edges, its label SHALL move inward without moving the pointer from that tick. Axis ticks SHALL have visible marks. When the reader's level equals a labelled tick, its number SHALL be hidden on the flagged axis because the flag already names that level. Otherwise the flag SHALL have at least six pixels of clear space above visible tick numbers. A thin accent line SHALL connect the flag's arrow to the axis tick and align with the selected-level markers in the rows below.

#### Scenario: Dragging the marker
- **WHEN** a reader drags the level marker across the Places axis to the position of level 30
- **THEN** the marker snaps to level 30, the matching place ranges highlight, and the remembered character level updates

#### Scenario: Marker keyboard and edges
- **WHEN** a reader focuses the marker and presses Page Up or End near the axis edge
- **THEN** the selected level advances by ten or reaches the upper bound, and the label remains inside the chart with its pointer exactly at the selected tick

#### Scenario: Selected tick stays clear
- **WHEN** the reader selects level 10 on an axis with a labelled level-10 tick
- **THEN** the flag shows You 10 directly above its tick, the separate 10 tick number is hidden, and an accent line connects its arrow to the visible tick mark and aligned row markers

#### Scenario: Level between ticks
- **WHEN** the reader selects level 15 or the upper bound just beyond a labelled tick
- **THEN** labelled ticks remain readable below the flag with at least six pixels of clear vertical space and visible tick marks
