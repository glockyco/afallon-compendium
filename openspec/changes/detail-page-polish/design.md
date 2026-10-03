## Context

Entity pages share DetailFrame, title, relation, tooltip, and section navigation components. The review covers their rendered responsive order and repetition, not publication data.

## Goals / Non-Goals

**Goals:** Keep the primary answer visible before secondary lists on phones, eliminate exact duplicates, and maintain readable wrapped facts and controls.

**Non-Goals:** Changes to list views, mechanics pages, map, character progression, kill calculator, or published game data.

## Decisions

- Reorder or preview existing entity sections within their pages at narrow widths, rather than changing every page's shared frame order or duplicating a long component. Preserve desktop placement and section links.
- Deduplicate exact item-source presentations at the point where summary and relation detail are composed. Preserve a distinct route or condition rather than suppressing entire source kinds.
- Keep a compact set bonus in item stats and use a link/disclosure for the full roster. Preserve the gear-set page as the full source.
- Make relation heading/value association explicit on phones. Suppress ambiguous floating navigation while retaining reachable in-flow section links if reserving clearance across all scrolling positions is not possible.
- Put the four verified combat values in a main-column section immediately after the NPC answer. Give the shared section heading an optional action slot for the existing compact level control, rather than making a second stepper. Put the related experience calculator immediately after the stat section, not in the side column.
- Keep the phone-only boss level and health preview before a long drops list, while retaining the full stat section after Drops. In the side facts, separate a scaling qualifier onto its own muted line instead of breaking it inside the level value.

## Risks / Trade-offs

- Responsive duplication of a short summary must not create duplicate interactive controls or inaccessible mobile/desktop copies. Verify both breakpoints and keyboard reachability.
- Existing sticky side content and the floating section control are sensitive to page height. Review scrolled viewports, not only first paint.
