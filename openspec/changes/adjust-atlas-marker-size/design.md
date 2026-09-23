## Context

See `proposal.md` for the user need. `AtlasSidebar.svelte` already has Map Options. `atlas-state.ts` owns URL-backed options, while `MapExplorer.svelte` passes them into `MapAdapterUpdate`. The icon layer uses each registry entry's fixed `iconSize.base` and global 14–44 pixel limits. Highlight circles derive their radius from the same base size, but pointer hover creates a separate highlight path.

## Goals / Non-Goals

**Goals:** Keep one global size value across sidebar, URL, icons, highlights, and map interactions. Preserve the existing 100% appearance.

**Non-Goals:** Do not add per-category sizes, change the publication schema, scale map imagery or labels, or store a second preference in local storage.

## Decisions

1. Add an integer `markerSize` percentage to `AtlasState`, defaulting to 100. Add a `set-marker-size` action and a `marker-size` URL parameter. Accept integers from 75 through 300; malformed, noninteger, or out-of-range values read as 100. Omit 100 from serialized URLs. Use the controller's replace navigation for slider input and reset so dragging does not create history entries. Existing URLs continue to use the default.
2. Put one labeled native range input, a percentage readout, and a reset button in the Map Options section of `AtlasSidebar.svelte`. Use a one-percent step and keep the control operable from the keyboard. Pass the current value and callbacks from `MapExplorer.svelte`, including the value in its reactive `adapter.update` payload.
3. Pass the percentage through `MapAdapterUpdate` to `createPlacementIconLayer` and every `createHighlightLayers` call, including pointer hover. Multiply icon sizes, icon pixel limits, and highlight radii by the same scale. Include the scale in deck.gl size update triggers so existing placements resize without rebuilding publication or marker records. Move stack count offsets with the scaled icon edge while leaving text size fixed.
4. Use the existing `markerFor(id).iconSize.base` as the 100% baseline. A global multiplier preserves category size differences and the current 100% result. Do not scale world coordinates or change category filtering, clustering, picking, or the selected placement ID.

## Risks / Trade-offs

- [Global icon limits hide size changes] Scale both `sizeMinPixels` and `sizeMaxPixels` by the selected percentage, not only `getSize`.
- [Selected or hovered circles lag behind icons] Pass the same scale through selection, group, and pointer-hover highlight paths; check all four visually.
- [Larger markers overlap] At 300%, nearby markers can obscure each other. Existing coincident-placement selection and stack counts remain available, and visitors can reduce the size.
- [Every slider tick adds navigation history] Replace the current URL entry while dragging. The size still survives reload and sharing, but Back does not undo individual slider movements.
