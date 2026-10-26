# shared-level-control Specification

## Purpose
Let readers adjust comparable numeric values directly without relying on small browser spinner arrows or precise typing.

## Requirements

### Requirement: Numeric comparison controls share one interaction

Character, skill, corruption, and gear-score adjustments, and creature levels in the kill calculator, SHALL use a labelled number field between decrement and increment buttons. The Heroic creature-level picker MAY remain a select alongside the creature-and-place picker.

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

#### Scenario: Numeric comparison controls share one interaction
- **WHEN** The reader adjusts gear score.
- **THEN** The adjustment uses a labelled number field between decrement and increment buttons.

### Requirement: Sliders accompany steppers where required

A slider SHALL accompany the stepper wherever the layout has room and on mechanics pages, except a short bounded setting such as living followers where the stepper alone is sufficient.

#### Scenario: Sliders accompany steppers where required
- **WHEN** The reader adjusts a setting that is not short and bounded on a mechanics page.
- **THEN** A slider accompanies the stepper.

### Requirement: Phone stepper buttons provide tap targets

On phones, both buttons SHALL offer at least 44-pixel tap targets.

#### Scenario: Phone stepper buttons provide tap targets
- **WHEN** The reader uses a numeric adjustment stepper on a phone.
- **THEN** Both decrement and increment buttons offer at least 44-pixel tap targets.

### Requirement: Held stepper buttons repeat

Holding either button SHALL repeat after a short delay.

#### Scenario: Held stepper buttons repeat
- **WHEN** The reader holds the increment button.
- **THEN** The increment action repeats after a short delay.

### Requirement: Number fields hide native spinners

Native spinner arrows SHALL not appear.

#### Scenario: Number fields hide native spinners
- **WHEN** The reader views a numeric adjustment field.
- **THEN** Native spinner arrows do not appear.

### Requirement: Numeric controls use site styling without hover lift

Controls SHALL use the site's border, radius, surface, and accent colors without lifting on hover.

#### Scenario: Numeric controls use site styling without hover lift
- **WHEN** The reader hovers over a numeric adjustment control.
- **THEN** The control uses the site's border, radius, surface, and accent colors and does not lift.
### Requirement: Heroic comparison controls share grid rows

On wide screens, the Creature and place select and Character level stepper SHALL share the first row, while the Creature level select and Equipped gear score stepper SHALL share the second. Each pair SHALL align its labels and its select or stepper inputs at the top with matching input heights, with a reserved slider row below each select opposite the slider. On phones the controls SHALL stack in one column.

#### Scenario: Four Heroic controls on desktop
- **WHEN** the selected creature has more than one possible spawn level on a wide screen
- **THEN** the four controls form a two-column, two-row grid whose paired labels and inputs line up

#### Scenario: Heroic controls on a phone
- **WHEN** the same comparison opens on a narrow screen
- **THEN** the four controls stack vertically, with the selects and steppers the same height

### Requirement: Progression marker tracks the selected level

On a Places level axis, the reader SHALL be able to drag the level marker to a whole level and adjust it with the same keyboard commands as the control.

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

#### Scenario: Progression marker tracks the selected level
- **WHEN** The reader drags the Places level marker to level 25 and then uses the control's increment keyboard command.
- **THEN** The marker selects whole level 25 and then adjusts by the same increment as the control.

### Requirement: Marker pointer stays centered on the selected tick

The marker's pointer SHALL remain centered on the precise selected tick.

#### Scenario: Marker pointer stays centered on the selected tick
- **WHEN** The reader selects level 25 on the Places level axis.
- **THEN** The marker's pointer is centered on the precise level-25 tick.

### Requirement: Edge labels move without displacing the pointer

Near the chart edges, the marker's label SHALL move inward without moving the pointer from the selected tick.

#### Scenario: Edge labels move without displacing the pointer
- **WHEN** The reader selects a level near a chart edge.
- **THEN** The marker's label moves inward while its pointer remains on the selected tick.

### Requirement: Axis ticks have visible marks

Axis ticks SHALL have visible marks.

#### Scenario: Axis ticks have visible marks
- **WHEN** The reader views the Places level axis.
- **THEN** The axis ticks have visible marks.

### Requirement: Selected labelled tick hides its duplicate number

When the reader's level equals a labelled tick, that tick's number SHALL be hidden on the flagged axis because the flag already names that level.

#### Scenario: Selected labelled tick hides its duplicate number
- **WHEN** The reader selects a level equal to a labelled axis tick.
- **THEN** The tick's number is hidden on the flagged axis, where the flag already names that level.

### Requirement: Flag clears visible tick numbers

When the reader's level does not equal a labelled tick, the flag SHALL have at least six pixels of clear space above visible tick numbers.

#### Scenario: Flag clears visible tick numbers
- **WHEN** The reader selects a level between labelled ticks.
- **THEN** The flag has at least six pixels of clear space above visible tick numbers.

### Requirement: Accent line connects flag and aligned level markers

A thin accent line SHALL connect the flag's arrow to the axis tick and align with the selected-level markers in the rows below.

#### Scenario: Accent line connects flag and aligned level markers
- **WHEN** The reader selects a level on the Places axis.
- **THEN** A thin accent line connects the flag's arrow to the selected axis tick and aligns with the selected-level markers in the rows below.
