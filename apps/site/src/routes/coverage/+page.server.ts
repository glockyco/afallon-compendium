import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';

export const load: PageServerLoad = async () => {
  return { coverage: await serverMapLoader().loadCoverage() };
};
