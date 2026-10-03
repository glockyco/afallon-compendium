## Context

The Places table publishes names, types, and boss counts, but its list rows only format level ranges as text. Published place documents contain numeric bounds and map-space availability. The hub already loads these documents. The shared reader-levels store holds `character` and skill-specific levels in browser storage.

## Goals / Non-Goals

**Goals:** Provide one typed progression model and renderer applicable to place ranges and later single-level gathering requirements. Preserve the existing table's URL filters and sorting.

**Non-Goals:** Draw a world map inside the overview or guess missing level/map information.

## Decisions

- Join place documents in the Places server load, using the existing publication loader, to supply numeric bounds, boss counts, and map-space availability. Do not parse range strings or create a second publication format. Render all place entries from that one set.
- Use a small shared progression model with optional range and group labels. Known entries order by starting level within type groups; groups order by earliest start. Unknown entries use a separate final group regardless of type. The full axis spans level 1 through the highest known endpoint (or chosen reader level), with one inclusive unit of width for a single-level entry. This lets gathering nodes use `{min: requiredLevel, max: requiredLevel}` in future.
- Render range start and end numerically next to each bar. Use the existing EntityLink, map link helper and visual tokens. The explicit control reads/writes the existing character key, highlights matching ranges, and never filters rows.
- Select the view with `?view=table` on Places. Preserve other query parameters across view changes so table facets and sort survive a round trip. Use route search params on initial hydration and browser history changes.

## Risks / Trade-offs

Loading all place documents on the overview adds 32 small reads at build/server render time, not during client hydration. Axis bars shrink when the reader chooses a level beyond published ranges, but every range retains a text label and a minimum visible bar width.
