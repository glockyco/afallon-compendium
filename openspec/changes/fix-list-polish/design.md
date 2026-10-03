## Context

See proposal.md. Gallery and table consume the same static list rows, but previously rendered search controls independently. The selected publication is immutable and changes to list/search projections require a new verification-only candidate.

## Goals / Non-Goals

**Goals:** Match control positions by sharing markup and CSS, render supported facts in both browse views, and keep long lists responsive.

**Non-Goals:** Change entity detail pages, mechanics articles, the map renderer, or the Places By Level component layout beyond duplicate range wording.

## Decisions

- `ListSearchCount` owns both filter and count markup. Slots retain table-only filter actions and sticky count chips without duplicating search styles.
- A property's amount and optional currency come from its list relations. Only display a currency when present. Income intervals come from its list values. Scene art uses the same cover frame regardless of which image field supplied it.
- List projections supply available creature/quest counts and node search placement truth. Registry columns and existing row filtering then present those facts. Rebuild a candidate publication for browser verification without accepting an update.
- A single delegated pointer listener assigns native titles only to cut text under the pointer, avoiding one listener per table cell and the static-element interaction warning.
- Show invariant starting place and class availability for races. Hide only redundant skill cells, not their filterable projection values. At 1100–1280 px, omit Quest Giver and wrap the remaining name columns within the card.

## Risks / Trade-offs

New projection fields cannot appear on a previously staged publication. The candidate build must validate its graph and stage the new static data before browser review. Omitting Giver at mid-width trades one secondary fact for readable primary names; the full Giver column remains available on wider desktops and phone cards.
