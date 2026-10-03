## Context

The Places table publishes names, types, and boss counts, but its list rows only format level ranges as text. Published place documents contain numeric bounds and map-space availability. The hub already loads these documents. The shared reader-levels store holds `character` and skill-specific levels in browser storage.

## Goals / Non-Goals

**Goals:** Provide one typed progression model and renderer applicable to place ranges and later single-level gathering requirements. Preserve the existing table's URL filters and sorting.

**Non-Goals:** Draw a world map inside the overview or guess missing level/map information.

## Decisions

- Join place documents in the Places server load, using the existing publication loader, to supply numeric bounds, boss counts, and map-space availability. Do not parse range strings or create a second publication format. Render all place entries from that one set.
- Use a small shared progression model with optional range and group labels. Known entries order by starting level within type groups; groups order by earliest start. Places supplies plural group headings while another progression mode may use its own names. Unknown entries use a separate final group regardless of type. The full axis spans level 1 through the highest known endpoint (or chosen reader level), with one inclusive unit of width for a single-level entry. This lets gathering nodes use `{min: requiredLevel, max: requiredLevel}` in future.
- Render range start and end numerically immediately after each bar. Each known type group puts a round-number tick axis inside its box directly above the first row, with labels above unobstructed ticks and faint per-row grid lines aligned to those ticks. The axis extends to the highest level without an extra near-duplicate maximum label. Label the chosen level above the first group's tick labels only, retaining its marker line in every group. Explicit grid columns reserve place, expanding track, numeric range, boss facts, and right-aligned map link; phone rows keep bar, range, and Map on one line. Use the existing EntityLink for one identity image: published place artwork takes its image slot, otherwise the kind glyph does. The explicit control reads/writes the existing character key, highlights matching ranges, and never filters rows; nearby text explains the highlight.
- Select the view with `?view=table` on Places. Preserve other query parameters across view changes so table facets and sort survive a round trip. Use route search params on initial hydration and browser history changes.
- Shared prose balances in Firefox and uses `text-wrap: pretty` for longer paragraphs in browsers that support it. Short intros, section lines, descriptions, hints, card text, and headings balance in both browsers. A concise Places intro avoids line breaks next to the visible control at desktop widths. On narrow detail pages, compact art and heading type allow a short parenthesized item name to remain together without clipping.

## Risks / Trade-offs

Loading all place documents on the overview adds 32 small reads at build/server render time, not during client hydration. Axis bars shrink when the reader chooses a level beyond published ranges, but every range retains its exact numeric text label.
