import { serverMapLoader } from '$lib/server/publication';
import { loadPlannerMock } from '../../data.server';
export const prerender = false;
export const load = async () => {
  const page = await serverMapLoader().loadDocument('places', 'tidefallen-grotto');
  return { mock: await loadPlannerMock(), document: page.document };
};
