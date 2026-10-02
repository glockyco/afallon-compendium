import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import type { EntityRef, PlacementRef, PublicProperty } from "@afallon/contracts/public";
import { baseDocument, type DocumentProjectionInput, optionalFactRef, publishedPlacements } from "./projection";

/** The for-sale signs of a property that the publication places on the map. */
function propertySigns(propertyKey: string, input: DocumentProjectionInput): PlacementRef[] {
  return publishedPlacements(input.placementIdsByKey.get(propertyKey) ?? [], input.placements);
}

/** The place of a property is the one scene that holds all of its published for-sale signs. */
export function propertySceneKey(propertyKey: string, input: DocumentProjectionInput): string | undefined {
  const scenes = new Set(propertySigns(propertyKey, input).flatMap((sign) => input.relations.placements.find((row) => row.placementId === sign.placementId)?.sceneKey ?? []));
  return scenes.size === 1 ? [...scenes][0] : undefined;
}

export function projectProperty(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicProperty {
  const fact = input.facts.properties.find((candidate) => candidate.entityKey === entity.entityKey);
  const currency = optionalFactRef(input.resolve, fact?.currency);
  const price = (amount: number | null | undefined) => amount !== null && amount !== undefined && amount >= 0 && currency ? { amount, currency } : undefined;
  const purchase = price(fact?.purchasePrice), sale = price(fact?.sellPrice), income = price(fact?.income);
  const locations = propertySigns(entity.entityKey, input);
  const sceneKey = propertySceneKey(entity.entityKey, input);
  const area = locations[0]?.label;
  const matchingPlaces = area && locations.every((sign) => sign.label === area)
    ? input.facts.places.flatMap((candidate) => {
      const place = input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey });
      return "name" in place && place.kind === "places" && place.slug && place.name === area ? [place] : [];
    }) : [];
  const place = matchingPlaces.length === 1 ? matchingPlaces[0]
    : sceneKey === undefined ? undefined : input.resolve({ entityKey: sceneKey, label: sceneKey });
  return {
    ...baseDocument(entity, ref, input),
    locations,
    facts: {
      ...(fact?.propertyType ? { propertyType: fact.propertyType } : {}), ...(purchase ? { price: purchase } : {}), ...(sale ? { sellPrice: sale } : {}),
      // A nonpositive interval turns the payments off.
      ...(income && (fact?.incomeInterval ?? 1) > 0 ? { income, ...(fact?.incomeInterval ? { incomeInterval: fact.incomeInterval } : {}) } : {}),
    },
    ...(place ? { place } : {}),
  };
}
