import { serverMapLoader } from '$lib/server/publication';
import { loadPlannerMock } from '../../data.server';
export const prerender = false;
export const load = async () => {
  const page = await serverMapLoader().loadDocument('items', 'hat-of-the-arcanist');
  return { mock: await loadPlannerMock(), document: page.document };
};
