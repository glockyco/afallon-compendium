import { loadPlannerMock } from '../../data.server';
export const prerender = false;
export const load = async () => ({ mock: await loadPlannerMock() });
