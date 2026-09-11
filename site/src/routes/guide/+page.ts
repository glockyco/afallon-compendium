import { loadGuide } from '$lib/guide-load';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch }) => loadGuide(fetch, 'overview');
