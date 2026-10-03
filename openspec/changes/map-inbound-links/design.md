## Context

`MapExplorer` already fits place links after its renderer becomes ready. Selection and entity links never fit, while initial camera persistence can populate URL view state before search data arrives. `MapController` publishes the map and search indexes independently, and `MapSearchResults` normally shows placements restricted to the viewport. `render-data` groups precisely coincident coordinates; deck.gl renders all icon instances in one layer with the currently selected icon ordered by category rather than focus.

## Goals / Non-Goals

**Goals:** Frame initial linked spots, preserve explicit views and later live selection, show every linked entity spot, make exact stacks independently selectable, and keep selection and hover legible.

**Non-Goals:** No nearby clustering, selection panel redesign, structural `MapExplorer` split, map startup optimization, auto-hiding results, or zoom-limit change.

## Decisions

- Capture the link's initial focus and whether it has an explicit camera view before starting the map controller. Fit once when publication, relevant indexes, and renderer are ready. The saved initial intent avoids the controller's own delayed camera persistence turning an initially missing view into a false explicit-view signal. Later selection changes never trigger another fit.
- Compute framed bounds from published world coordinates plus their effective map translations. Use existing bounds-to-camera scaling, with padding for the icon and aspect ratio. Prefer the specific selected placement when present; otherwise frame all spots associated with an entity key.
- Filter entity results using the existing search index's key-to-placement mapping and bypass default categories for a linked entity, since enemies are disabled by default. Keep the complete entity result set even if some spots are outside a saved explicit view; count visible spots separately.
- Preserve exact-coordinate grouping and count badges. Keep click cycling and expose each group member as a keyboard-accessible button in its preview, including groups otherwise past the result-list limit. Draw focused icons after ordinary icons within the existing icon layer, without adding another registry or nearby aggregation.
- Clear old hover on actual view changes. Movement ranges are visual context, not selectable hit targets; markers and result entries remain selection controls. Mark renderer startup finished in all completion paths and guard against accidentally restarting an already-created renderer.

## Risks / Trade-offs

- The accepted publication currently contains 28 Bandit placement identities linked to `npcs:27`, rather than the 14 previously seen in the interface. Show all linked published identities rather than inventing a 14-spot cap.
- A single global hover preview can be obscured at narrow widths; keep group buttons visible inside the established preview and verify at mobile width in both browser engines.
