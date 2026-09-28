## Context

See `proposal.md` for the motivation. `Section.svelte` owns section IDs and headings. `RelationTable.svelte:26-41` reads the fragment on mount and `hashchange`. It expands a row after position 15 and then scrolls. `TalentTreeSection.svelte:23-24` passes published talent row anchors to that table. `ClassPage.svelte`, `NpcPage.svelte`, `PlacePage.svelte`, and `ItemPage.svelte` render conditional sections. `QuestPage.svelte` can also render at least four sections. The detail-page spec requires cards to remain in one content column.

## Goals / Non-Goals

**Goals:** Keep tabs and row links usable on direct load and history traversal. List actual rendered sections without copying conditional section rules into a second manifest. Keep each section card full-width in its content column.

**Non-Goals:** Add zone or talent views. Change the published data, section IDs, table limit, or map navigation. Restyle section cards.

## Decisions

### URL state belongs to a shared tab set

Add one `TabSet` under `apps/site/src/lib/detail/`. Its inputs are stable tab keys and reader-facing labels. It reads `tab` from the current URL for initial selection. It uses SvelteKit shallow history state to push a selection without refetching the static document. It observes browser history and fragment changes. Explicit tab selection removes an old fragment that belongs to another view and preserves all other query fields. An unknown tab selects the first tab and replaces the invalid key in the same history entry. Use native buttons with `tablist`, `tab`, and `tabpanel` roles, one roving tab stop, `aria-selected`, and matching control and panel IDs. Arrow, Home, and End keys activate and focus tabs. A browser history change updates selection but does not steal focus. This avoids a second, private state that can disagree with the address.

Use the page URL as the source of truth when several tab sets share List and Grid keys. A change in one tree selects that view in every tree. Namespace generated control and panel IDs by tree so accessible labels remain unique.

### A fragment owns its tab

Give each tab the anchor IDs of the content it renders. The class tree consumer in `show-talent-trees` can derive List row IDs from `tree.rows[].anchor`. A tree section anchor remains outside the view tabs if the section stays visible in both views. The zone consumer in `publish-overworld-zones` supplies its own anchor IDs. On direct load, fragment navigation, and history traversal, resolve a known fragment before the query selection. Replace a conflicting `tab` query value in the same history entry. Keep the fragment and other parameters. Render only the selected panel. Give `RelationTable` a way to register an asynchronous `revealAnchor(id)` callback for its rows. Wait for that callback before scrolling a target beyond the 15-row limit. Handle same-fragment links through the tab set because `hashchange` does not fire for a repeated fragment. An unknown fragment does not force a tab change.

### A section registers its existing heading

Add a page-scoped section registry and an `OnThisPage` component under `apps/site/src/lib/detail/`. `Section.svelte` registers its existing `id`, `title`, and element when mounted, and removes them when destroyed. Keep entries in DOM order. Render the list only when four or more registered sections are present. This uses the same condition that actually renders the section, including a section that becomes absent when a document changes. Do not duplicate row-presence tests in page components. Keep registration browser-local. The detail page and its section content stay server-rendered. Insert the list and its layout around sections in class, NPC, place, and item pages. Audit the remaining detail kinds and use the same wrapper on any page that can render four sections, including quests. A hidden tab panel does not contribute links to the visible section list.

At wide widths, position a narrow sticky navigation beside the single section-content column, not beside a card in that column. At 390 px, place a native `details` disclosure immediately before the sections in reading order. Its summary reads "On this page". An opened list has normal fragment links and closes after a link is chosen. The outline preserves focus visibility and scroll space for section headings. At widths without room for the side list, use the narrow layout instead of causing horizontal scroll.

### No publication cycle

This change only reads existing published section and row anchors. The archived `publish-class-and-skill-pages` change already supplies talent row anchors. No catalog candidate, publication candidate, or acceptance step is needed because neither projection nor public data changes. The later zone and talent changes own any publication changes and their full acceptance cycles.

## Risks / Trade-offs

- [A selected tab contains a row beyond the table limit] → Wait for row expansion before scrolling. Check direct load and a same-fragment click in a browser.
- [Registration happens after hydration] → Do not shift the page content column when the outline appears. Check layout and section count at 1440 px and 390 px.
- [A hidden panel contributes a stale section] → Remove registrations on unmount and check the visible list after changing tabs and documents.
- [Browser Back restores an anchor inside a hidden tab] → Resolve fragment ownership before scrolling and check Back and Forward with conflicting `tab` values.

## Migration Plan

Add the shared components and page wrappers without changing routes or published documents. Preserve section and row anchor IDs. Roll back by removing the site-only components and wrappers. No data migration is needed.
