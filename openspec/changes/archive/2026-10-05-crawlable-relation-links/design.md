## Context

See proposal.md. The shared relation table initially renders eight rows, and several other detail components apply the same preview gate. Place NPCs and merchant wares use those components. A static-page audit counts incoming links only inside the page's main content.

## Goals / Non-Goals

**Goals:** Include every linked extra row in static HTML and a no-JavaScript disclosure while preserving the hydrated preview and its existing controls.

**Non-Goals:** Invent relationships for pages with no published source, change the sitemap or ranking, or make hidden relations visually prominent on the first screen.

## Decisions

- A shared `StaticMore` renders a native details disclosure on the server. Its default slot contains the extra links or rows. On mount it replaces that disclosure with the original interactive Show more button supplied in its control slot. Thus no-JavaScript readers can expand the extra links, and hydrated pages retain their small first-view surface.
- Shared relation tables render the hidden rows' links in the native disclosure without changing their current incremental row-building behavior after hydration. For generic rows, render each column's existing cell slot so secondary links remain available too.
- Detail lists follow the same disclosure contract. The shared place creature section handles NPCs, creatures, and bosses without a place-page-specific duplicate.
- A class talent web and stat source page add native static indexes for linked entities that live only in inactive tabs, without changing the hydrated web or tab UI.
- A site-build link audit reads links within `<main>`, excluding nav and footer, compares them to generated detail routes, and reports remaining unlinked pages by kind.
- Search Escape handling belongs on the combobox and the result listbox, not on a static wrapper.

## Risks / Trade-offs

Prerendered HTML includes all hidden links, and hydration briefly creates the disclosure before replacing it. Measure page size and warm navigation on long pages; keep the hydrated rows incremental instead of mounting every hidden row for the lifetime of the page.
