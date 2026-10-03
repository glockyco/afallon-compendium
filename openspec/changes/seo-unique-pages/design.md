## Context

The site prerenders every page from a selected static publication. Entity routes load the publication search corpus and document; lists use the published kind registry. The common head component mirrors title and description into sharing tags. Publication projection constructs typed documents and links before writing content-addressed resources.

## Goals / Non-Goals

**Goals:** Distinguish search results by real kind and facts, retain one page for indistinguishable effects, preserve old URLs, and validate the HTML actually deployed.

**Non-Goals:** Invent game facts, change game entity names, merge effects with different gameplay, or create metadata for filter query variants.

## Decisions

- Calculate shared names from all published search entries once per loaded index using case- and spacing-insensitive names. Keep the in-game name visible. Add kind only when another published page shares it, and a visible subtitle from a real effect fact if more than one page in that kind shares the name.
- Generate descriptions from type, source, level, location, effect action, and other already published facts. Add only complete sentences that fit, rather than clipping raw game prose or appending repeated wiki boilerplate.
- Compare projected effects' full player-visible gameplay fields before publication serialization. Retain the simplest slug, union application/world/check sources, retarget reference links, and withhold the equivalent page. Keep effects with different stack limits, ranks, or actions separate.
- Publish static `_redirects` rules for superseded addresses, as Cloudflare Workers Static Assets supports this file alongside `_headers`. Audit HTML heads during deployment assertion, exempting the noindex 404.
- Use the document's artwork or portrait before an icon only when both dimensions are at least 200 pixels. Otherwise retain the existing card and declare the actual image dimensions.

## Risks / Trade-offs

A publication with newly equivalent pages will need redirects for their prior live addresses. The strict built-HTML audit makes unexpected new collisions visible during release instead of silently shipping generic search results.
