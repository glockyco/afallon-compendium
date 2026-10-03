## Why

A first-time visitor cannot tell what game this reference covers from its home page, and its provenance and non-affiliation are buried in repository documentation. Search and shared links also lose useful context on entity and list pages, while the map has no initial readable content.

## What Changes

- Introduce Afallon and link its Steam store and interactive-map guide on the home page.
- Add a publication-aware About page with game facts, reference provenance, useful links, and the full rights disclaimer, plus a compact notice and About link in every footer including the map.
- Supply factual, length-limited entity summaries, canonical and social metadata, structured site and breadcrumb identities, static map context, and About sitemap discovery.
- Preserve 404 status and noindex for unknown URLs through the existing Cloudflare static-assets 404 fallback and production preview.

## Capabilities

### New Capabilities

- `about-and-discovery`: Reader-facing game introduction, About, affiliation notice, and discoverable metadata for the static reference.

### Modified Capabilities

None. Existing reference and map capabilities retain their behavior.

## Impact

Home, About, shared shell, map route, list/entity/Coverage head metadata, sitemap, and focused summary tests. No publication schema or runtime backend changes.
