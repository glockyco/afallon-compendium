import type { LayoutServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';

// Every page navigates by the registry of the selected publication and names its release in the footer.
export const load: LayoutServerLoad = async () => {
  const loader = serverMapLoader();
  const root = await loader.loadRoot();
  // Only names and weapon facts enter public-page hydration. Complete class/talent documents
  // are read here at prerender time, never requested by the header or a character switch.
  const classRows = root.kinds.some((kind) => kind.kind === 'classes' && kind.list)
    ? (await loader.loadList('classes')).rows : [];
  const characterClasses = (await Promise.all(classRows.flatMap((row) => row.ref.slug
    ? [loader.loadDocument('classes', row.ref.slug)] : [])))
    .flatMap((page) => page.kind === 'classes'
      ? [{ key: page.document.ref.key, name: page.document.ref.name, weapons: page.document.facts.weapons, icon: (page.document.art.icon ?? page.document.ref.icon)?.url }] : []);
  return { registry: root.kinds, release: root.release, characterClasses };
};
