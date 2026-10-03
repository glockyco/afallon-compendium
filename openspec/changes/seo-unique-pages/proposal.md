## Why

Pages for different Afallon entities often share names or generic descriptions, so their search results cannot reliably tell players which game fact a link opens. The published HTML needs distinct, factual metadata and artwork that matches the page.

## What Changes

- Give every indexable page a unique title and description drawn from its actual publication facts.
- Qualify shared names with a reader-facing kind and, where necessary, a visible effect distinction, without changing in-game names.
- Consolidate genuinely equivalent effect pages, preserving their combined sources and old addresses through 301 redirects.
- Use a sufficiently large entity image for social previews when available and validate actual built page heads at deployment.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compendium-reference`: Make search metadata distinctive and truthful, keep social previews relevant, and preserve links to merged equivalent pages.

## Impact

Publication document and reference projection, SvelteKit SEO metadata for home, lists, entities and other routes, deployment assertions, and redirect rules change. Game source evidence and the primary Afallon Compendium name stay unchanged.
