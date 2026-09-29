import { PUBLIC_PAGE_KIND_VALUES, type CoverageGap, type EntityRef, type PublicDocument, type PublicItem, type PublicNpc, type PublicPageKind, type PublicPlace, type PublicRecipe, type StaticCoverage } from "@afallon/contracts/public";
import { countUnresolvedReferences } from "./documents";

const PAGE_KINDS: ReadonlySet<string> = new Set(PUBLIC_PAGE_KIND_VALUES);
const isPageKind = (kind: string): kind is PublicPageKind => PAGE_KINDS.has(kind);

const itemSources = (item: PublicItem) => item.droppedBy.length + item.soldBy.length + item.gatheredFrom.length + item.inContainers.length
  + item.collectedFrom.length + item.rewardedBy.length + item.givenBy.length + item.craftedBy.length + item.startingGearOf.length;

// Each gap names the published pages that lack the fact. The coverage page lists them, so references carry no icon.
const GAP_TESTS: ReadonlyArray<readonly [CoverageGap, (document: PublicDocument) => boolean]> = [
  ["itemWithoutSource", (document) => document.ref.kind === "items" && itemSources(document as PublicItem) === 0],
  ["npcWithoutLocation", (document) => document.ref.kind === "npcs" && (document as PublicNpc).locations.length === 0],
  ["npcWithoutLevel", (document) => document.ref.kind === "npcs" && (document as PublicNpc).locations.length > 0 && !(document as PublicNpc).facts.level],
  ["placeWithoutMap", (document) => document.ref.kind === "places" && (document as PublicPlace).space === null],
  ["unresolvedReference", (document) => countUnresolvedReferences(document) > 0],
  ["recipeWithoutTeacher", (document) => document.ref.kind === "recipes" && !(document as PublicRecipe).facts.learnedByDefault && (document as PublicRecipe).taughtBy.length === 0],
];

/** The pages of each kind and, for each gap, the pages that it affects. */
export function readerCoverage(documents: Iterable<PublicDocument>): Pick<StaticCoverage, "pages" | "gaps"> {
  const counts = new Map<PublicPageKind, number>();
  const gaps = new Map<CoverageGap, EntityRef[]>(GAP_TESTS.map(([gap]) => [gap, []]));
  for (const document of documents) {
    const kind = document.ref.kind;
    if (!isPageKind(kind)) throw new Error(`Document ${document.ref.key} has no page kind.`);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    const { icon: _icon, variant: _variant, ...ref } = document.ref;
    for (const [gap, test] of GAP_TESTS) if (test(document)) gaps.get(gap)!.push(ref);
  }
  return {
    pages: [...counts].map(([kind, count]) => ({ kind, count })),
    gaps: [...gaps].filter(([, pages]) => pages.length > 0).map(([gap, pages]) => ({ gap, pages: pages.sort((left, right) => left.name.localeCompare(right.name)) })),
  };
}
