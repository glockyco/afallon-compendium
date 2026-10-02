import type { CatalogFacts } from "@afallon/contracts/catalog";
import { isEntityRef, PUBLIC_PAGE_KIND_VALUES, type CoverageGap, type EntityRef, type PublicDocument, type PublicItem, type PublicNpc, type PublicPageKind, type PublicPlace, type PublicSkill, type StaticCoverage } from "@afallon/contracts/public";
import { countUnresolvedReferences } from "./documents";

const PAGE_KINDS: ReadonlySet<string> = new Set(PUBLIC_PAGE_KIND_VALUES);
const isPageKind = (kind: string): kind is PublicPageKind => PAGE_KINDS.has(kind);

const itemSources = (item: PublicItem) => item.droppedBy.length + item.soldBy.length + item.gatheredFrom.length + item.inContainers.length
  + item.collectedFrom.length + item.rewardedBy.length + item.givenBy.length + Number(item.crafting !== undefined) + item.startingGearOf.length
  + item.fromItems.length + (item.clothDrop ? 1 : 0) + item.questPickups.length + (item.dungeonFinder ? 1 : 0) + (item.facts.dungeonRewards?.length ?? 0);

// Each gap names the published pages that lack the fact. The coverage page lists them, so references carry no icon.
const GAP_TESTS: ReadonlyArray<readonly [CoverageGap, (document: PublicDocument) => boolean]> = [
  ["itemWithoutSource", (document) => document.ref.kind === "items" && itemSources(document as PublicItem) === 0 && (document as PublicItem).adventurers.length === 0],
  ["itemAdventurerOnly", (document) => document.ref.kind === "items" && itemSources(document as PublicItem) === 0 && (document as PublicItem).adventurers.length > 0],
  ["npcWithoutLocation", (document) => document.ref.kind === "npcs" && (document as PublicNpc).locations.length === 0],
  ["npcWithoutLevel", (document) => document.ref.kind === "npcs" && (document as PublicNpc).locations.length > 0 && !(document as PublicNpc).facts.level],
  ["placeWithoutMap", (document) => document.ref.kind === "places" && (document as PublicPlace).space === null],
  ["unresolvedReference", (document) => countUnresolvedReferences(document) > 0],
];

/** The pages of each kind and, for each gap, the pages that it affects. */
export function readerCoverage(documents: Iterable<PublicDocument>, facts?: CatalogFacts): Pick<StaticCoverage, "pages" | "gaps"> {
  const counts = new Map<PublicPageKind, number>();
  const gaps = new Map<CoverageGap, EntityRef[]>(GAP_TESTS.map(([gap]): [CoverageGap, EntityRef[]] => [gap, []]));
  gaps.set("recipeWithoutTeacher", []);
  gaps.set("recipeWithoutProduct", []);
  const recipes = new Map<string, { ref: EntityRef; product: boolean; learnedByDefault?: boolean; taught: boolean }>();
  const learnedByDefault = new Map(facts?.recipes.map((recipe) => [recipe.entityKey, recipe.learnedByDefault]) ?? []);
  const taughtRecipes = new Set<string>();
  for (const document of documents) {
    const kind = document.ref.kind;
    if (!isPageKind(kind)) throw new Error(`Document ${document.ref.key} has no page kind.`);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    const { icon: _icon, variant: _variant, ...ref } = document.ref;
    for (const [gap, test] of GAP_TESTS) if (test(document)) gaps.get(gap)!.push(ref);
    if (kind === "items") {
      const item = document as PublicItem, craft = item.crafting;
      if (item.teaches) taughtRecipes.add(item.teaches.recipe.key);
      if (craft) recipes.set(craft.recipe.key, { ref: { ...ref, name: craft.recipe.name, variant: "crafting" }, product: true,
        learnedByDefault: craft.learnedByDefault, taught: craft.taughtBy.length > 0 });
    }
    if (kind === "skills") for (const row of (document as PublicSkill).recipes) {
      if (recipes.has(row.recipe.key)) continue;
      recipes.set(row.recipe.key, { ref: { ...ref, name: row.recipe.name, variant: row.anchor }, product: !!row.product && isEntityRef(row.product) && !!row.product.slug,
        learnedByDefault: learnedByDefault.get(row.recipe.key), taught: false });
    }
  }
  for (const [key, recipe] of recipes) {
    if (!recipe.product) gaps.get("recipeWithoutProduct")!.push(recipe.ref);
    if (recipe.learnedByDefault === false && !recipe.taught && !taughtRecipes.has(key)) gaps.get("recipeWithoutTeacher")!.push(recipe.ref);
  }
  return {
    pages: [...counts].map(([kind, count]) => ({ kind, count })),
    gaps: [...gaps].filter(([, pages]) => pages.length > 0).map(([gap, pages]) => ({ gap, pages: pages.sort((left, right) => left.name.localeCompare(right.name)) })),
  };
}
