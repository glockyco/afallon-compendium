import type { EntityDetail } from "@afallon/contracts/catalog";
import type { PublicDetailRow, PublicDetailSection, PublicEntity } from "@afallon/contracts/public";

const nativeLineBreaks = /<br\s*\/?>/gi;
const nativeFormatTags = /<\/?(?:color|size|b|i|u|s|font|font-weight|mark|link|align|alpha|cspace|indent|line-height|line-indent|margin|margin-left|margin-right|mspace|nobr|pos|rotate|space|style|sub|sup|voffset|width|uppercase|lowercase|smallcaps)(?:=[^>]*|\s[^>]*)?>/gi;

export function plainText(value: string): string {
  return (value.includes("<") ? value.replace(nativeLineBreaks, "\n").replace(nativeFormatTags, "") : value).trim();
}

export function projectPublicEntities(entities: readonly EntityDetail[], availablePlacementIds?: ReadonlySet<string>): PublicEntity[] {
  const names = new Map(entities.map((entity) => [entity.entityKey, plainText(entity.name ?? "") || "Unnamed entry"]));
  return entities.map((entity) => ({
    entityKey: entity.entityKey,
    kind: entity.kind,
    nativeId: entity.nativeId,
    name: names.get(entity.entityKey)!,
    description: entity.description === null ? null : plainText(entity.description),
    placementIds: availablePlacementIds ? entity.placementIds.filter((id) => availablePlacementIds.has(id)) : [...entity.placementIds],
    sections: sectionsFor(entity, names),
  }));
}

function label(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll(/[-_]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function scalarRows(value: unknown, prefix = ""): PublicDetailRow[] {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [{ label: label(prefix || "Value"), value: plainText(String(value)) }];
  const rows: PublicDetailRow[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (/^source$|source.*(path|name)|path$|hierarchy|instanceid|native(type|method)|saver|savedstate|runtime|provenance|icon|localization|guid|serialized|file(name)?|^text$|^component|^current|observation|^active(Self|InHierarchy)$|^enabled$|^spawnedCount$|^ownerEntityKeys$|^sourceLabel$/i.test(key)) continue;
    rows.push(...scalarRows(child, prefix ? `${prefix} / ${label(key)}` : label(key)));
  }
  return rows;
}

function sectionsFor(entity: EntityDetail, names: ReadonlyMap<string, string>): PublicDetailSection[] {
  const sections: PublicDetailSection[] = [];
  const add = (title: string, rows: PublicDetailRow[]) => {
    if (rows.length === 0) return;
    const section = sections.find((candidate) => candidate.title === title);
    if (!section) { sections.push({ title, rows: [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()] }); return; }
    const existing = new Set(section.rows.map((row) => JSON.stringify(row)));
    for (const row of rows) if (!existing.has(JSON.stringify(row))) { section.rows.push(row); existing.add(JSON.stringify(row)); }
  };
  const itemRow = (id: number | null, value: string): PublicDetailRow | null => {
    const key = id === null ? "" : `items:${id}`;
    if (!key || !names.has(key)) return null;
    return { label: names.get(key)!, value, entityKey: key };
  };
  const relationships = entity.relationships;
  add("Vendor stock", relationships.merchantStock.flatMap((row) => {
    const currency = row.currencyId === null ? undefined : names.get(`currencies:${row.currencyId}`);
    const item = itemRow(row.itemId, typeof row.cost === "number" ? `${row.cost}${currency ? ` ${currency}` : ""}` : "");
    return item ? [item] : [];
  }));
  add("Drops", relationships.lootEntries.flatMap((row) => {
    const minimum = row.min ?? row.max, maximum = row.max ?? row.min;
    const item = itemRow(row.itemId, typeof minimum === "number" && typeof maximum === "number" ? `Quantity ${minimum === maximum ? minimum : `${minimum}–${maximum}`}` : "");
    return item ? [item] : [];
  }));
  add("Gathering outputs", relationships.resourceYields.flatMap((row) => {
    const values = [typeof row.rank === "number" ? `Rank ${row.rank}` : "", typeof row.min === "number" && typeof row.max === "number" ? `Quantity ${row.min === row.max ? row.min : `${row.min}–${row.max}`}` : ""].filter(Boolean);
    const item = itemRow(row.itemId, values.join(" · "));
    return item ? [item] : [];
  }));
  add("Quest associations", relationships.questAssociations.flatMap((row) => {
    if (row.questId === null) return [];
    const key = `quests:${row.questId}`, name = names.get(key);
    return name ? [{ label: label(row.associationKind), value: name, entityKey: key }] : [];
  }));
  for (const association of relationships.questAssociations) add(`Quest details — ${label(association.associationKind)}`, scalarRows(association.context));
  for (const condition of relationships.conditions) add("Requirements", scalarRows(condition.payload));
  add("Properties", scalarRows(entity.publicData.gameplay));
  return sections;
}
