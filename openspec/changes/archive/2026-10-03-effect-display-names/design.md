## Context

See proposal.md. The catalog precomputes requirement labels from game names and separately stores typed spans. Publication constructs all references before documents. Base-6 explicitly excludes effects:280 as a content-free record, so its reference is plain text and there is no effect page or search entry. The existing `compendium.publication-presentation.v2` schema rejects extra properties.

## Goals / Non-Goals

**Goals:** Preserve reviewed effect page coverage and existing page URLs while replacing the internal name across published text. Require a reviewed evidence statement for each override and fail on ambiguous names.

**Non-Goals:** Do not infer progress increments, resets, status-icon behavior, or change loot and requirement logic.

## Decisions

- Extend v2 with an optional `effectDisplayNames` array of `{key, name, evidence}`. The schema addition permits both old registered records and the new record, without migrating published site readers. Reject duplicate keys at schema validation and unknown effect keys or collisions after loading the catalog. The evidence string points at the catalog and game-code investigation; no unregistered asset is required to verify provenance.
- Pass the mapping through `application.ts`, `build.ts`, and `index-resources.ts` into `buildEntityReferences`. Compare names using the existing `nameKey` normalization after formatting effect names, including unoverridden effect names. Only effects have eligible keys. Reject any mapped name colliding with a different public effect record, even if that record lacks a page.
- Apply the override to both grouped page references and excluded effect references. The excluded effects:280 remains unlinked but resolves to plain text “Challenge Progress.” For effects with pages, derive the page slug from the original grouped effect name rather than the override. This avoids breaking old addresses on a static host without redirects.
- Rebuild published requirement labels by joining resolved span text and reference names rather than reusing catalog labels. The catalog stays source-of-truth for comparison words and numbers; publication supplies the reviewed reference name.
- Copy base-6 into a new base-7 presentation file and register the new artifact in the object store. Do not mutate the original reviewed input.

## Risks / Trade-offs

The excluded effect retains no public page. Existing effect pages that receive an override can display a title different from their stable URL. Validation runs against all catalog effect names so a newly added same-name effect in a later build requires a deliberate editorial review rather than implicit disambiguation.
