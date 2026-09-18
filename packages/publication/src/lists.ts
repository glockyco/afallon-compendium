import { partitionStaticRecords } from "./resources";
import type {
  ListRow,
  PublicAbility,
  PublicDocument,
  PublicItem,
  PublicKindEntry,
  PublicNpc,
  PublicPageKind,
  PublicPlace,
  PublicProperty,
  PublicQuest,
  PublicRecipe,
  Ref,
  StaticKindList,
} from "@afallon/contracts/public";

function refName(ref: Ref | undefined): string | null {
  if (!ref) return null;
  return ref.key === null ? ref.label : ref.name;
}

function facetValue(value: string | null | undefined): string[] {
  return value ? [value] : [];
}

function itemRow(document: PublicItem): ListRow {
  const sourceKinds = [document.droppedBy.length > 0 ? "drop" : null, document.soldBy.length > 0 ? "vendor" : null,
    document.gatheredFrom.length > 0 ? "gather" : null, document.inContainers.length > 0 ? "container" : null,
    document.rewardedBy.length > 0 ? "quest" : null, document.craftedBy.length > 0 ? "recipe" : null].filter((value): value is string => value !== null);
  return {
    ref: document.ref,
    values: { rarity: document.facts.rarity ?? null, itemType: document.facts.itemType ?? null, slot: document.facts.slot ?? null,
      levelRequirement: document.facts.levelRequirement ?? null, sellPrice: document.facts.sellPrice?.amount ?? null },
    facets: { slot: facetValue(document.facts.slot), itemType: facetValue(document.facts.itemType), rarity: facetValue(document.facts.rarity), sourceKind: sourceKinds },
  };
}

function npcRow(document: PublicNpc): ListRow {
  const level = document.facts.level ?? (document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null);
  const places = new Set(document.locations.map((location) => location.label));
  const place = places.size === 1 ? places.values().next().value! : places.size > 1 ? `${places.size} places` : null;
  const faction = refName(document.facts.faction);
  return { ref: document.ref, values: { level, role: document.facts.roles.join(", ") || null, place, faction },
    facets: { role: document.facts.roles, place: facetValue(place), faction: facetValue(faction) } };
}

function questRow(document: PublicQuest, documents: ReadonlyMap<string, PublicDocument>): ListRow {
  const giver = document.givers[0], giverDocument = giver?.key === null || !giver ? undefined : documents.get(giver.key);
  const giverPlace = giverDocument && "locations" in giverDocument ? giverDocument.locations[0]?.label ?? null : null;
  return { ref: document.ref,
    values: { chain: document.facts.chain?.name ?? null, levelRequirement: document.facts.levelRequirement ?? null, giver: refName(giver) },
    facets: { chain: facetValue(document.facts.chain?.name), repeatable: [String(document.facts.repeatable)], giverPlace: facetValue(giverPlace) } };
}

function placeRow(document: PublicPlace): ListRow {
  const range = document.facts.levelRange ? `${document.facts.levelRange.min}–${document.facts.levelRange.max}` : null;
  return { ref: document.ref, values: { placeType: document.facts.placeType, levelRange: range, bosses: document.bosses.length },
    facets: { placeType: [document.facts.placeType], guideIncluded: [String(document.facts.guideIncluded)] } };
}

function propertyRow(document: PublicProperty): ListRow {
  const place = refName(document.place);
  return { ref: document.ref, values: { place, income: document.facts.income ?? null }, facets: { place: facetValue(place) } };
}

function abilityRow(document: PublicAbility): ListRow {
  return { ref: document.ref, values: { usedBy: document.usedBy.map((ref) => refName(ref)).filter((value): value is string => value !== null).join(", ") || null }, facets: {} };
}

function recipeRow(document: PublicRecipe): ListRow {
  const station = refName(document.facts.station), skill = refName(document.facts.skill);
  return { ref: document.ref, values: { station, skill, product: refName(document.product?.counterpart) }, facets: { station: facetValue(station), skill: facetValue(skill) } };
}

export function buildKindLists(
  identity: { buildId: string; catalogId: string },
  registry: readonly PublicKindEntry[],
  documents: ReadonlyMap<string, PublicDocument>,
): ReadonlyMap<string, StaticKindList[]> {
  const rowsByKind = new Map<string, ListRow[]>();
  for (const document of documents.values()) {
    let row: ListRow;
    switch (document.ref.kind) {
      case "items": row = itemRow(document as PublicItem); break;
      case "npcs": row = npcRow(document as PublicNpc); break;
      case "quests": row = questRow(document as PublicQuest, documents); break;
      case "places": row = placeRow(document as PublicPlace); break;
      case "properties": row = propertyRow(document as PublicProperty); break;
      case "abilities": row = abilityRow(document as PublicAbility); break;
      case "recipes": row = recipeRow(document as PublicRecipe); break;
      default: continue;
    }
    const rows = rowsByKind.get(document.ref.kind) ?? [];
    rows.push(row);
    rowsByKind.set(document.ref.kind, rows);
  }
  const result = new Map<string, StaticKindList[]>();
  for (const entry of registry) {
    if (!entry.pages) continue;
    const kind = entry.kind as PublicPageKind;
    result.set(kind, partitionStaticRecords(rowsByKind.get(kind) ?? [], (rows, part): StaticKindList => ({
      schemaVersion: "compendium.static-kind-list.v1", ...identity, kind, part, rows,
    })));
  }
  return result;
}
