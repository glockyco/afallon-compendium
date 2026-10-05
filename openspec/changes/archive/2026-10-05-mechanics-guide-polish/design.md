## Context

See proposal.md. Publication keeps guide introductions and section leads in `guide-sections.ts`, but the verified rule phrases live in an external mechanics rules record. `GuideSection` renders all verified phrases in order unless its caller passes a filtered set.

## Goals / Non-Goals

**Goals:** Preserve every verified loot rule, avoid repeated opening facts, and keep topic sections easy to scan on phones.

**Non-Goals:** No changes to calculators, Heroic comparisons, or other detail pages.

## Decisions

- Reorder only the Heroic Tier opening answers, not its three detailed parts. The detailed Getting started part owns the full console list and level advice.
- Change guide introductions and redundant leads in publication's single text source, rather than hiding rendered paragraphs in the page component.
- Keep the first Creature Drops rule visible. Render the remaining six verified rules inside one native disclosure with three headed groups, while preserving unknown rules in the existing disclosure.
- Reword redundant Heroic, chest, and Creature Drops rule phrases in new fragments merged over the latest candidate with `reword-rules.py`. Keep evidence and operands unchanged.

## Risks / Trade-offs

A closed disclosure requires another click to reach the details. The visible lead and first rule answer the primary question, and all further verified rules remain accessible under descriptive headings. The candidate rules wording is not live until the next publication accepts it.
