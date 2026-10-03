import { base } from '$app/paths';
import type { RequestHandler } from './$types';
import { entityPageEntries, listPageEntries } from '$lib/server/page-entries';

export const prerender = true;

// Lists and relation previews build only their first rows, so their HTML does not link every page. The sitemap names
// every page from the same entries that the routes prerender, so a search engine still finds each one.
const ORIGIN = 'https://afallon.compendiums.org';

export const GET: RequestHandler = async () => {
  const [lists, entities] = await Promise.all([listPageEntries(), entityPageEntries()]);
  const paths = ['/', '/map/', '/coverage/', ...lists.map(({ kind }) => `/${kind}/`), ...entities.map(({ kind, slug }) => `/${kind}/${slug}/`)];
  const urls = paths.map((path) => `  <url><loc>${escapeXml(`${ORIGIN}${base}${path}`)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
