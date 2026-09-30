import { base } from '$app/paths';
import { nodePlaceKey } from './map-state';

// Pages open the map with one selection. The map reads these parameters in `readMapUrl`.
function mapHref(parameters: Record<string, string>): string {
  return `${base}/map/?${new URLSearchParams(parameters).toString()}`;
}

/** Every spot of an NPC or a property. */
export const entityOnMap = (key: string) => mapHref({ entity: key });

/** Every published spot of a gathering node, including categories hidden by default. */
export const nodeOnMap = (key: string) => mapHref({ entity: key, categories: 'all' });
/** Every spot of a node in one published place, including distinct areas on the same map. */
export const nodePlaceOnMap = (key: string, place: { mapSpaceId: string; label: string }) =>
  mapHref({ entity: key, 'node-place': nodePlaceKey(place), categories: 'all' });

/**
 * Every resource, container, and object that gives an item. The item filters the map to its sources, and most sources
 * are in categories that the map hides by default, so the link shows all categories.
 */
export const itemOnMap = (key: string) => mapHref({ item: key, categories: 'all' });

/** All published spots of one item source row, distinguished even when source labels repeat. */
export const itemSourceOnMap = (key: string, relation: 'gatheredFrom' | 'inContainers' | 'collectedFrom', index: number) =>
  mapHref({ item: key, 'item-source': `${relation}:${index}`, categories: 'all' });

/** The area of a place, optionally with only one category of markers. */
export const placeOnMap = (key: string, category?: string) => mapHref(category ? { place: key, categories: category } : { place: key });

/** One spot. */
export const spotOnMap = (placementId: string) => mapHref({ selected: placementId });
