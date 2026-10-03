import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { entityPageEntries } from '$lib/server/page-entries';
import { serverMapLoader } from '$lib/server/publication';
import { isEntityRef, isPublicPageKind, type StaticDocument } from '@afallon/contracts/public';

export const entries: EntryGenerator = entityPageEntries;

type InlineItem = Extract<StaticDocument, { kind: 'items' }>['document'];

/** Resolve the item whose sources also explain how a currency can be obtained. */
export async function _loadGuideInlineItem(
  page: StaticDocument,
  loader: Pick<ReturnType<typeof serverMapLoader>, 'loadPageForRef'>,
): Promise<InlineItem | undefined> {
  const ref = page.kind === 'currencies' ? page.document.item
    : page.kind === 'mechanics' && page.document.topic === 'corruption' ? page.document.tryIt.defaultItem : undefined;
  if (!ref || !isEntityRef(ref) || !ref.slug) return undefined;
  const item = await loader.loadPageForRef(ref);
  if (item.kind !== 'items' || item.document.ref.key !== ref.key) {
    throw new Error(`Inline item ${ref.key} does not resolve to its published item page.`);
  }
  return item.document;
}

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverMapLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind || !isPublicPageKind(kind.kind)) error(404, 'This compendium section is unavailable.');
  const entry = indexes.entries.find((candidate) => candidate.ref.kind === kind.kind && candidate.ref.slug === params.slug && candidate.document);
  if (!entry?.document) error(404, 'This compendium page is unavailable.');
  const page = await loader.loadDocument(kind.kind, params.slug);
  const inlineItem = await _loadGuideInlineItem(page, loader);
  return { kind, page, inlineItem, documentPath: entry.document.path };
};
