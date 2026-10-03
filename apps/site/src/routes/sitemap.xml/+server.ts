import { base } from '$app/paths';
import type { RequestHandler } from './$types';
import { entityPageEntries, listPageEntries } from '$lib/server/page-entries';
import { serverMapLoader } from '$lib/server/publication';

export const prerender = true;

// Lists and relation previews build only their first rows, so their HTML does not link every page. The sitemap names
// every page from the same entries that the routes prerender, so a search engine still finds each one.
const ORIGIN = 'https://afallon.compendiums.org';

export const GET: RequestHandler = async () => {
  const [lists, entities] = await Promise.all([listPageEntries(), entityPageEntries()]);
  const effects = entities.filter((entry) => entry.kind === 'effects');
  const teleportSlugs = new Set<string>();
  const loader = serverMapLoader();
  for (let start = 0; start < effects.length; start += 48) {
    const pages = await Promise.all(effects.slice(start, start + 48).map((entry) => loader.loadDocument('effects', entry.slug)));
    for (const [index, page] of pages.entries()) {
      if (page.kind === 'effects' && page.document.type === 'Teleport') teleportSlugs.add(effects[start + index]!.slug);
    }
  }
  const paths = ['/', '/map/', '/coverage/', '/about/', ...lists.map(({ kind }) => `/${kind}/`),
    ...entities.filter(({ kind, slug }) => kind !== 'effects' || !teleportSlugs.has(slug)).map(({ kind, slug }) => `/${kind}/${slug}/`)];
  const urls = paths.map((path) => `  <url><loc>${escapeXml(`${ORIGIN}${base}${path}`)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
