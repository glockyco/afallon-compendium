## Why

Prerendered detail pages omit links to relations behind Show more controls. Readers without JavaScript and crawlers cannot reach hundreds of otherwise published items, NPCs, abilities, and stats from related pages.

## What Changes

- Publish links for every extra relation and detail-list row in native disclosures in the static HTML.
- Preserve the short previews, Show more controls, sorting, and anchor navigation for interactive readers.
- Keep the header search Escape interaction while removing its static-element accessibility warning.
- Audit generated page-to-page links and distinguish remaining pages with no incoming relationship.

## Capabilities

### Modified Capabilities
- `detail-pages`: Static and no-JavaScript readers can access all linked relation rows even when interactive previews stay compact.

## Impact

Shared relation tables and detail-page list components; prerendered HTML grows with its links, but hydrated pages keep their existing short previews and incremental reveal behavior.
