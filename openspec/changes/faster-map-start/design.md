## Context

`MapController` currently starts map and search requests together. `MapDataLoader.loadMaps` couples essential placement parts with imagery metadata for all spaces. `MapExplorer` receives viewport changes from the renderer. Marker icons are drawn from SVGs to a 64-pixel-per-category canvas atlas on every fresh visit. The root publication already gives world bounds and references for each space, so the client can select manifest requests without changing published resource identities.

## Decisions

- The controller starts search only for a nonempty query, document-linked selection, or explicit `ensureSearch` call from search focus. `MapDataLoader` continues to own successful and pending request deduplication and retry.
- If the URL has an explicit camera and no individually named imagery layer, the controller intersects a conservative startup camera rectangle with published map bounds before loading imagery. It still fetches all map parts and geometry. The canvas reports its actual viewport through `ensureImagery`, which requests newly visible map manifests and composes their layers without resetting the camera. Default world-fit startup retains all visible map imagery. Individually named imagery layer links load all manifests so their layer IDs can be validated without erasing the saved choice.
- A checked-in PNG atlas and generated JSON mapping are rendered by a browser-driven generator using exactly the former canvas drawing instructions. Runtime decodes the PNG and copies it to the atlas canvas. The generator is invoked only when registry pixels change, not at every page load.
- Both logo placements use a 72-pixel lossless WebP image for their 32- and 36-pixel display sizes. Existing 512-pixel PNG is no longer downloaded on map entry.
- Graphics changes must preserve marker glyphs and layers. Stage shader families across hidden frames only when `KHR_parallel_shader_compile` is present. Firefox and software GL lack that extension and use one pass, avoiding redundant draws without delaying their final appearance. Compare three cold loads per browser on production builds and inspect desktop and phone screenshots before accepting shader changes.

## Risks and Validation

A conservative camera rectangle can overfetch on narrow viewports, but the actual camera requests any missed spaces. Map startup must continue to report a retryable failure when a required initial manifest or geometry fails. A late manifest error must remain visible rather than drawing a complete-looking map. Test these transitions with fixture resources and observe live browser pan, search, inbound links, and screenshots. The production build never invokes the sprite generator or requires a browser executable.
