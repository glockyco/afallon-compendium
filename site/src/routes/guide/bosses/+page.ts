import { browser } from '$app/environment';
import { guideSlug, loadGuide } from '$lib/guide-load';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ fetch, url }) => { const id = browser ? url.searchParams.get('id') : null; return loadGuide(fetch, id ? `boss-${guideSlug(id)}` : 'bosses'); };
