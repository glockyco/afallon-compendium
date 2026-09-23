## Context

See `proposal.md` for the user need. `AtlasSidebar.svelte` already has Map Options. `atlas-state.ts` owns URL-backed options, while `MapExplorer.svelte` passes them into `MapAdapterUpdate`. The icon layer uses each registry entry's fixed `iconSize.base` and global 14–44 pixel limits. Highlight circles derive their radius from the same base size, but pointer hover creates a separate highlight path.

## Goals / Non-Goals

**Goals:** Keep one global size value across sidebar, URL, icons, highlights, and map interactions. Make the former 140% rendering the new 100% appearance.

**Non-Goals:** Do not add per-category sizes, change the publication schema, scale map imagery or labels, or store a second preference in local storage.

## Decisions

1. Add an integer `markerSize` percentage to `AtlasState`, defaulting to 100. Add a `set-marker-size` action and a `marker-size` URL parameter. Accept integers from 50 through 200; malformed, noninteger, or out-of-range values read as 100. Omit 100 from serialized URLs. Use the controller's replace navigation for slider input and reset so dragging does not create history entries. Existing URLs continue to use the default.
2. Put one labeled native range input, a percentage readout, and a reset button in the Map Options section of `AtlasSidebar.svelte`. Use a one-percent step and keep the control operable from the keyboard. Pass the current value and callbacks from `MapExplorer.svelte`, including the value in its reactive `adapter.update` payload.
3. Pass the percentage through `MapAdapterUpdate` to `createPlacementIconLayer` and every `createHighlightLayers` call, including pointer hover. Multiply icon sizes, icon pixel limits, and highlight radii by the same scale. Include the scale in deck.gl size update triggers so existing placements resize without rebuilding publication or marker records. Move stack count offsets with the scaled icon edge while leaving text size fixed.
4. Define the range and baseline together in the marker registry. Convert the displayed percentage to a physical scale of `1.4 × markerSize / 100` for icons, pixel limits, highlights, and stack offsets. The former 140% rendering becomes the displayed 100%; the 50% and 200% endpoints render at the former 70% and 280%. This preserves category size differences without changing world coordinates, category filtering, clustering, picking, or the selected placement ID.

## Risks / Trade-offs

- [Global icon limits hide size changes] Scale both `sizeMinPixels` and `sizeMaxPixels` by the selected percentage, not only `getSize`.
- [Selected or hovered circles lag behind icons] Pass the same scale through selection, group, and pointer-hover highlight paths; check all four visually.
- [Larger markers overlap] At 200% (the former 280% physical size), nearby markers can obscure each other. Existing coincident-placement selection and stack counts remain available, and visitors can reduce the size.
- [Every slider tick adds navigation history] Replace the current URL entry while dragging. The size still survives reload and sharing, but Back does not undo individual slider movements.
