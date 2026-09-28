import type { LayoutServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';

// Every page navigates by the registry of the selected publication and names its release in the footer.
export const load: LayoutServerLoad = async () => {
  const root = await serverMapLoader().loadRoot();
  return { registry: root.kinds, release: root.release };
};
