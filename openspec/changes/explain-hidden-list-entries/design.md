## Context

Static publication creates facet values in list rows and supplies facet metadata through its kind registry. The site renders those values in both its filter panel and selected chips. A single result-bar component renders reveals for all three kinds.

## Goals / Non-Goals

**Goals:** Preserve the existing search, filter counts, selection, and URL behavior while explaining each hidden category in player language. Separate facet identity from presentation so the three kinds can share one known/unknown predicate without sharing an unclear label.

**Non-Goals:** Reclassifying which game documents have acquisition, encounter, or use evidence, or changing the visibility of any row.

## Decisions

- Publish `known` and `unknown` as stable availability facet keys and add a small `valueLabels` dictionary in each facet's registry metadata. Filter matching and URLs continue using keys, while the filter panel and chips display labels from the same registry entry.
- Publish `null` for an ability's Source and no source-kind facet value when it has no known learner or user. Availability remains the one filter for these rows, while Source filters only by actual class, creature, item, or interaction evidence.
- Build reveal text from the list kind and the matched count in the shared table. Show the same explanation in an anchored help bubble on hover and focus, and use a tappable help control for touch. The reveal button still directly selects the hidden facet.

## Risks / Trade-offs

Availability URL parameters now contain `unknown` rather than `No Known Way`, so links containing the previous value will not retain the selection. The clean cutover avoids carrying an obsolete ambiguous value and makes new links readable as filter keys.
