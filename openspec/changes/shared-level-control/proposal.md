## Why

Small browser number spinners make it cumbersome to compare nearby levels and gear scores. Places also shows a reader marker that cannot be dragged and whose flag can point away from the chosen tick.

## What Changes

- Replace level-like numeric inputs with one shared, labelled stepper with optional range slider, held-button repeat, keyboard navigation, and bounded typed values.
- Keep saved character and skill levels synchronized across pages through the existing browser storage. Preserve the separately stored equipped gear score.
- Let readers drag and keyboard-adjust the Places level marker, snapping to whole levels and pointing its arrow exactly at the selected tick even when the flag must move inward at the edges.
- Remove the superseded ReaderLevel and LevelSlider components.

## Capabilities

### New Capabilities
- `shared-level-control`: Shared input interaction and progression-axis marker behavior.

### Modified Capabilities
- `detail-pages`: Saved character and skill levels use the shared control.
- `compendium-hub`: Hub place sorting responds to the new stepper.
- `mechanics-pages`: Progression and kill settings use the new stepper.
- `item-property-presentation`: Corruption version uses the new control.

## Impact

The site UI changes in the home toolbar, Places level overview, mechanics calculators, item comparison, crafting and gathering sections, and creature details. Published game facts and storage keys do not change.
