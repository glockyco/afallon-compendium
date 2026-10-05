## Context

Entity pages share DetailFrame, title, relation, tooltip, and section navigation components. The review covers their rendered responsive order and repetition, not publication data.

## Goals / Non-Goals

**Goals:** Keep the primary answer visible before secondary lists on phones, eliminate exact duplicates, and maintain readable wrapped facts and controls.

**Non-Goals:** Changes to list views, mechanics pages, map, character progression, kill calculator, or published game data.

## Decisions

- Reorder or preview existing entity sections within their pages at narrow widths, rather than changing every page's shared frame order or duplicating a long component. Preserve desktop placement and section links.
- Deduplicate exact item-source presentations at the point where summary and relation detail are composed. Preserve a distinct route or condition rather than suppressing entire source kinds.
- Keep a compact set bonus in item stats and use a link/disclosure for the full roster. Preserve the gear-set page as the full source.
- Make relation heading/value association explicit on phones. Keep section navigation in flow within the content width, using a stable navigation label rather than repeating the next section heading; float it only in a clear outer margin.
- Put up to four verified combat values in a main-column section immediately after the NPC answer, omitting the section when none can be calculated. Give the shared section heading an optional action slot for the existing compact level control, rather than making a second stepper. Put the related experience calculator immediately after the stat section, not in the side column.
- Keep the phone-only boss level preview before long drops and add health there only when its complete value is known. Put calculation prose and other partial bonuses inside the disclosure, with only a relevant attack note outside it. In the side facts, separate a scaling qualifier onto its own muted line instead of breaking it inside the level value.
- Share one round glyph style between the ordinary How it works link and the chance Hint button; align both on the text baseline and leave the rate as a fact without a trailing period. Review tight 2× browser crops rather than inferring alignment from CSS alone.
- Split mixed creature-source rates into calculated and listed groups, each retaining one visible plain-language explanation. Use the shared relation table for every name, quantity, and chance table: on phones give names a full row, show quantity as a muted × amount below, and align the one-line chance heading over right-aligned values. Preserve the existing three-column desktop layout and the accessible Quantity label. A one-kind table still shows its explanation.
- Model each title identity fact as a separate wrapping item. Keep sidebar scaling and service names readable, and place a gathering requirement in the To gather card when that card exists rather than repeating it above the yield answer.

## Risks / Trade-offs

- Responsive duplication of a short summary must not create duplicate interactive controls or inaccessible mobile/desktop copies. Verify both breakpoints and keyboard reachability.
- Existing sticky side content and the floating section control are sensitive to page height. Review scrolled viewports, not only first paint.
