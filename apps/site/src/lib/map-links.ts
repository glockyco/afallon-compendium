import { base } from '$app/paths';

// Pages open the map with one selection. The map reads these parameters in `readMapUrl`.
function mapHref(parameters: Record<string, string>): string {
  return `${base}/map/?${new URLSearchParams(parameters).toString()}`;
}

/** Every spot of an NPC or a property. */
export const entityOnMap = (key: string) => mapHref({ entity: key });

/**
 * Every resource, container, and object that gives an item. The item filters the map to its sources, and most sources
 * are in categories that the map hides by default, so the link shows all categories.
 */
export const itemOnMap = (key: string) => mapHref({ item: key, categories: 'all' });

/** The area of a place, optionally with only one category of markers. */
export const placeOnMap = (key: string, category?: string) => mapHref(category ? { place: key, categories: category } : { place: key });

/** One spot. */
export const spotOnMap = (placementId: string) => mapHref({ selected: placementId });
