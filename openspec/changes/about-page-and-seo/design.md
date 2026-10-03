## Context

The site prerenders detail and list pages, while the map starts with a client loader. The existing site origin is https://afallon.compendiums.org, routes use trailing slashes except /404, and the Cloudflare static-assets host already specifies `not_found_handling = "404-page"`. Production preview likewise serves `404.html` with status 404. Publication release fields are available on the shared layout and About route.

## Goals / Non-Goals

**Goals:** Keep all search/share content in initial HTML, and share metadata generation and the source of truth for the unofficial-project notice.

**Non-Goals:** SearchAction, JSON noindex, invented page dates, retail Product schema, a new map layout, or a runtime search engine.

## Decisions

- Use one small metadata component for title/description, canonical, social tags, and optional WebSite data, plus a matching breadcrumb list generated from the shared shell's visible crumbs. Read canonical from the route path rather than query parameters. Render no canonical on the 404 page.
- Use a pure type-aware description helper over published documents. Prefer specific item rarity/type and verified acquisition, NPC type/level/place. Fall back to a meaningful kind-and-name sentence. Limit to 155 characters at a word boundary; never turn a creature-level-limited world drop into an unrestricted creature drop. Use the site's wide preview artwork rather than stretching an inventory icon.
- Put map's prerendered explanatory text and footer below its full-height workspace to leave first-screen interaction untouched. Give category links direct map query URLs and ensure map remains usable when hydration completes.
- Place the full README disclaimer verbatim in About. A shared string supplies the identical shorter notice in both footers. About uses publication release fields rather than build time.
- Keep the home hero focused on the site's own map, search and item actions. Put plain Steam store and Steam Guide text links together below those actions, with the same unembellished \"Steam Guide\" link in About and both footers. Do not describe the guide because its content changes independently. Wrap each release fact as an unbreakable group so mobile dates do not split across lines.
- Retain the existing host's real 404 fallback and validate it through the production preview, since replacing unknown routes with an SPA fallback would produce soft 404s.

## Risks / Trade-offs

Map context below the viewport is less immediately visible, but does not displace the map workspace or its controls. A description is necessarily shorter than full item sourcing, so mention one representative source without claiming it is the only way to obtain an item.
