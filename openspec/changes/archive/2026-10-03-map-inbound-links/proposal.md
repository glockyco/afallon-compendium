## Why

Links to a selected map spot or an entity open on a distant world view, leaving the linked content hard to find. The result list can show unrelated places, and coincident markers need a clear way to reach every member without grouping nearby locations.

## What Changes

- Frame inbound spot and entity links when they have no explicit camera view, preserving live camera position on subsequent selection and explicit views.
- List the linked entity's published spots even when its category is normally hidden, and describe map counts in player-facing terms.
- Render selected and hovered markers above other marker icons, clear stale hover when the view changes, and expose every member of an exact-position stack to pointer and keyboard selection.
- Keep movement geometry from capturing selection clicks, and release the renderer's startup flag when startup ends.
- Replace the unimplemented nearby aggregation requirement with exact-position grouping while keeping nearby markers separate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: inbound navigation framing, entity-specific results, exact-position marker access, hover and draw order.
