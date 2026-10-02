import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type PublicCraftingStation, type Ref, type StationRecipeRow } from "@afallon/contracts/public";
import { placeSpots } from "../place-spots";
import { projectCraft } from "./items";
import { baseDocument, type DocumentProjectionInput, mergeRefs, publishedPlacements, refName, type RelationIndexes } from "./projection";

/**
 * A crafting station's page: the recipes made at it with their products, skills, and required levels, the skills of
 * those recipes, and the published spots where the station stands, grouped by place.
 */
export function projectCraftingStation(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicCraftingStation {
  const recipes: StationRecipeRow[] = input.facts.recipes.filter((recipe) => !input.excluded?.has(recipe.entityKey) && recipe.station?.entityKey === entity.entityKey).map((recipe) => {
    const craft = projectCraft(recipe.entityKey, input, indexes), product = craft?.product?.counterpart;
    return {
      recipe: input.resolve({ entityKey: recipe.entityKey, label: recipe.entityKey }),
      ...(product ? { product: isEntityRef(product) && product.slug ? { ...product, variant: "crafting" } : product } : {}),
      ...(craft?.skill ? { skill: craft.skill } : {}),
      ...(craft?.ranks[0] ? { requiredLevel: craft.ranks[0].requiredLevel } : {}),
    };
  }).sort((a, b) => (a.requiredLevel ?? Number.MAX_SAFE_INTEGER) - (b.requiredLevel ?? Number.MAX_SAFE_INTEGER) || refName(a.recipe).localeCompare(refName(b.recipe)));
  const skills = mergeRefs(recipes.flatMap((row): Ref[] => row.skill ? [row.skill] : []), input);
  const places = placeSpots(publishedPlacements(input.placementIdsByKey.get(entity.entityKey) ?? [], input.placements));
  return { ...baseDocument(entity, ref, input), skills, recipes, places };
}
