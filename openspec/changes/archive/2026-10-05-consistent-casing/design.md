## Context

See proposal.md. SvelteKit prerenders routes against a staged publication; a list's gallery and table are alternate client views of one route. Labels may be authored in the site or materialized in publication JSON. The built HTML cannot cover a table view that is only activated in the browser.

## Goals / Non-Goals

**Goals:** Audit representative pages of every route kind and both list views, correct shared formatting at the source, reject regressions on prerendered labels, and check client-only labels in a browser.

**Non-Goals:** Rewrite game-authored names, accept or deploy a candidate, or change the map panel and shared progression implementations being rebuilt separately.

## Decisions

- Reuse the existing shared gallery/table search-and-count control; format home-card facts as sentence-case counts. Short command controls use Title Case, while explanatory links and section navigation keep the sentence-like heading they name.
- Audit built HTML via an HTML parser rather than source regexes. Distinguish title-like headings from sentence-like headings and use sentence case for field labels, facts, counts, filter values, and placeholders. Crawl every list and mechanics route and at least three detail pages per kind for diagnosis; deployment validation crawls all routes.
- Keep the reveal exception and game-provided names explicit. Report ambiguous contextual strings for review, but gate deployment only on clear structural violations. Record excluded map and progression labels separately rather than silently treating them as compliant.
- Publication-generated guide titles appear in a verification-only candidate; do not accept, deploy, or replace the accepted publication.

## Risks / Trade-offs

Prerendered HTML omits controls that appear only after hydration or changing views, so browser checks and a regression test of the shared list control complement the built-HTML check. Dynamic game names may carry source casing; avoid normalizing them automatically. A heuristic cannot decide every heading's grammar, so strict deployment validation must not turn uncertain labels into false positives.
