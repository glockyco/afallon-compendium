import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type PublicSkill } from "@afallon/contracts/public";
import { weaponSkillExperience } from "../crafting";
import { requiredLevel } from "../gathering";
import { placedRules } from "../placed-rules";
import { recipeAnchor } from "../references";
import { displayName } from "../text";
import { projectCraft } from "./items";
import { baseDocument, conditionsById, type DocumentProjectionInput, optionalCount, refName, type RelationIndexes, requirementsFor } from "./projection";

export function projectSkill(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicSkill {
  const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === entity.entityKey), details = fact?.kind === "skills" ? fact.details : undefined;
  const highest = details && details.maxLevel > 0 ? details.maxLevel : null;
  // The game reads a skill template row by its position, so row n holds the experience from level n to the next level.
  const template = details?.levelTemplate?.entityKey ? input.facts.progression.facts.find((candidate) => candidate.entityKey === details.levelTemplate!.entityKey) : undefined;
  const rows = highest !== null && highest > 1 && template?.kind === "levels" ? template.details.rows.slice(0, highest - 1).map((row, index) => ({ level: index + 1, toNext: Math.max(0, row.experienceRequired) })) : [];
  const curve = rows.length === highest! - 1 && rows.length > 0 ? { template: displayName(template!.name ?? "") || "Skill levels", cap: highest!, rows } : undefined;
  const recipes = input.facts.recipes.filter((recipe) => !input.excluded?.has(recipe.entityKey) && recipe.skill?.entityKey === entity.entityKey).map((recipe) => {
    const craft = projectCraft(recipe.entityKey, input, indexes);
    const product = craft?.product?.counterpart, recipeRef = input.resolve({ entityKey: recipe.entityKey, label: recipe.entityKey });
    const name = refName(recipeRef);
    return { recipe: { key: recipe.entityKey, name }, anchor: recipeAnchor(name),
      ...(product ? { product: isEntityRef(product) && product.slug ? { ...product, variant: "crafting" } : product } : {}),
      ...(craft?.station ? { station: craft.station } : {}),
      ...(craft?.ranks[0] ? { requiredLevel: craft.ranks[0].requiredLevel } : {}) };
  }).sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
  // The gathering nodes whose skill experience action names the skill, by required level.
  const conditions = conditionsById(input.relations.conditions);
  const nodes = input.facts.gatheringNodes.filter((node) => node.skill?.entityKey === entity.entityKey)
    .map((node) => ({ node, level: requiredLevel(node, conditions) ?? 0, ref: input.resolve({ entityKey: node.entityKey, label: node.name }) }))
    .sort((left, right) => left.level - right.level || refName(left.ref).localeCompare(refName(right.ref)))
    .map(({ node, ref: nodeRef }) => ({ node: nodeRef, requirements: node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, input.resolve),
      ...(optionalCount(node.skillExperience) === undefined ? {} : { experience: optionalCount(node.skillExperience) }) }));
  const weapon = weaponSkillExperience(input.facts);
  return {
    ...baseDocument(entity, ref, input),
    facts: { ...(highest === null ? {} : { highestLevel: highest }), automatic: details?.automaticallyAdded ?? true },
    recipes, ...(curve ? { curve } : {}), gatheringNodes: nodes,
    experience: { ...(weapon.skills.has(entity.entityKey) ? { autoAttack: { perHit: weapon.perHit } } : {}), crafting: recipes.length > 0, gathering: nodes.length > 0 },
    placedRules: placedRules(input.facts, "skills", { entityKey: entity.entityKey }, input.resolve),
  };
}

