import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import type { PublicReferenceKind } from "@afallon/contracts/public";
import { PUBLIC_KIND_BY_KIND, publicKindForCatalogKind } from "./kind-registry";
import { displayName } from "./text";

// The game gives one character or one ability several authored records, one for each pose, time of day, story stage,
// or user. Players see only the shared name, so these kinds publish one page for each name.
const GROUPED_KINDS: ReadonlySet<PublicReferenceKind> = new Set<PublicReferenceKind>(["npcs", "abilities"]);

export interface EntityGroup {
  kind: PublicReferenceKind;
  /** The key of the member with the lowest native id. It identifies the page. */
  key: string;
  name: string;
  /** In native id order. */
  members: readonly CatalogEntityRow[];
}

/** Names compare without case, apostrophe style, or extra spaces, so "Lysander blazeborn" and "Lysander Blazeborn" are one name. */
export function nameKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replaceAll("’", "'").replaceAll(/\s+/g, " ").trim();
}

export function baseName(entity: CatalogEntityRow, kind: PublicReferenceKind): string {
  return displayName(entity.name ?? "") || `${PUBLIC_KIND_BY_KIND[kind].label} ${entity.nativeId}`;
}

// The title uses the most frequent spelling in the group, and a tie takes the spelling of the lowest native id.
function pageTitle(members: readonly CatalogEntityRow[], kind: PublicReferenceKind): string {
  const spellings = new Map<string, { count: number; first: number }>();
  members.forEach((member, index) => {
    const name = baseName(member, kind), spelling = spellings.get(name);
    if (spelling) spelling.count++;
    else spellings.set(name, { count: 1, first: index });
  });
  return [...spellings].sort(([, a], [, b]) => b.count - a.count || a.first - b.first)[0]![0];
}

export function groupEntities(entities: readonly CatalogEntityRow[]): EntityGroup[] {
  const groups = new Map<string, { kind: PublicReferenceKind; members: CatalogEntityRow[] }>();
  for (const entity of entities) {
    const kind = publicKindForCatalogKind(entity.kind);
    if (kind === null) continue;
    const key = GROUPED_KINDS.has(kind) ? `${kind}\u0000${nameKey(baseName(entity, kind))}` : `${kind}\u0000${entity.entityKey}`;
    const group = groups.get(key);
    if (group) group.members.push(entity);
    else groups.set(key, { kind, members: [entity] });
  }
  return [...groups.values()].map(({ kind, members }) => {
    const sorted = [...members].sort((left, right) => left.nativeId - right.nativeId || left.entityKey.localeCompare(right.entityKey));
    return { kind, key: sorted[0]!.entityKey, name: pageTitle(sorted, kind), members: sorted };
  });
}

/** The page key and page name of each record of `kind`, by record key. */
export function pagesOfRecords(entities: readonly CatalogEntityRow[], kind: PublicReferenceKind): ReadonlyMap<string, { key: string; name: string }> {
  return new Map(groupEntities(entities).filter((group) => group.kind === kind).flatMap((group) => group.members.map((member) => [member.entityKey, { key: group.key, name: group.name }] as const)));
}
