import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { listPageEntries } from '$lib/server/page-entries';
import { serverMapLoader } from '$lib/server/publication';
import { categoryLabel, isPublicPageKind } from '@afallon/contracts/public';
import { formatNumber } from '$lib/format';
import { placeOnMap } from '$lib/map-links';
import type { ProgressionEntry } from '$lib/progression-overview';

export const entries: EntryGenerator = listPageEntries;

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverMapLoader();
  const registry = await loader.loadRegistry();
  const kind = registry.find((entry) => entry.list && entry.route === params.kind);
  if (!kind || (!isPublicPageKind(kind.kind) && kind.kind !== 'recipes')) error(404, 'This compendium section is unavailable.');
  const list = await loader.loadList(kind.kind);
  const places: ProgressionEntry[] = kind.kind === 'places'
    ? await Promise.all(list.rows.map(async (row) => {
      const page = row.ref.slug ? await loader.loadDocument('places', row.ref.slug) : null;
      const place = page?.kind === 'places' ? page.document : null;
      const bosses = place?.bosses.length ?? Number(row.values.bosses ?? 0);
      return {
        ref: row.ref, group: categoryLabel(place?.facts.placeType ?? String(row.values.placeType ?? 'Other')),
        range: place?.facts.levelRange ?? null,
        detail: bosses > 0 ? `${formatNumber(bosses)} ${bosses === 1 ? 'Boss' : 'Bosses'}` : undefined,
        artwork: place?.art.artwork ?? null,
        ...(place?.space ? { mapHref: placeOnMap(row.ref.key, place.variantOf ? 'all' : undefined) } : {}),
      };
    }))
    : [];
  return { kind, list, places };
};
