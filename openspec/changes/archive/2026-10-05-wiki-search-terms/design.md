## Context

SvelteKit route components supply titles and descriptions to one shared SeoHead component, which mirrors titles into Open Graph and Twitter metadata. Home alone emits WebSite JSON-LD. A separate static 404 route supplies its own title.

## Goals / Non-Goals

**Goals:** Keep all generated route titles consistent and retain the Afallon Compendium identity in branding and site metadata while making wiki searches find recognizable page titles.

**Non-Goals:** Change the site name, accept hand-edited pages, alter URLs, or add search structured actions.

## Decisions

- Set route-specific title strings at existing SeoHead call sites. Keep the shared head responsible for mirroring titles to sharing tags so they cannot diverge.
- Add `alternateName` only to the home WebSite JSON-LD. Keep `og:site_name` and WebSite `name` unchanged.
- Keep useful entity facts in descriptions and mention the wiki once where space permits. Do not substitute generic keyword text for item source restrictions or NPC location facts.
- Update deployment title assertions to inspect actual title patterns and preserve the 404 noindex behavior.

## Risks / Trade-offs

Long game-supplied names or descriptions can consume a meta description's word-boundary limit, so wiki phrasing must not displace important item or NPC facts. Static HTML sampling must include long and ordinary entity entries.
