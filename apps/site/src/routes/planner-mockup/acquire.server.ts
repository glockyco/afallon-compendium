// Throwaway: groups the planned items that are still to get by where a player goes to get them. Uses only published
// item sources, creature and vendor places, and the item facts that say which versions a source can give.
import type { ContainerRow, ListRow, PublicItem } from '@afallon/contracts/public';
import { dropRateText, formatNumber } from '$lib/format';
import { serverMapLoader } from '$lib/server/publication';

type Loader = ReturnType<typeof serverMapLoader>;
type Ref = { key?: string | null; kind?: string; name?: string; label?: string; slug?: string; icon?: { url: string } };
export type Need = {
  key: string; slot: string; version?: string; collected: boolean;
  item: { key: string; name: string; slug?: string; icon?: string; rarity?: string };
};
export type Way = {
  kind: 'drop' | 'bag' | 'vendor' | 'quest' | 'world' | 'chest' | 'pack' | 'drops';
  from: { name: string; href?: string };
  detail: string;
  price?: { amount: number; currency: string; currencyHref?: string };
  mapHref?: string;
  /** Other places where the same vendor or creature gives it. */
  alsoAt?: string[];
  /** Whether this way gives the planned version. Undefined when nothing special is planned. */
  version?: { ok: boolean; text: string };
};
export type Row = { need: string; ways: Way[]; also: string[] };
export type PlaceGroup = { id: string; name: string; href?: string; mapHref?: string; kind?: string; levels?: string; rows: Row[]; notes: string[] };

const nameOf = (ref: unknown) => { const value = ref as Ref; return value.name ?? value.label ?? '?'; };
const hrefOf = (ref: unknown) => {
  const value = ref as Ref;
  const route = { npcs: 'npcs', quests: 'quests', items: 'items', places: 'places', currencies: 'currencies' }[value.kind ?? ''];
  return route && value.slug ? `/${route}/${value.slug}/` : undefined;
};
const priceOf = (amount: number, currency: unknown) => ({ amount, currency: nameOf(currency), currencyHref: hrefOf(currency) });

export async function buildAcquisition(loader: Loader, needs: { need: Need; document: PublicItem; heroic: boolean; corruption: number }[]) {
  const npcPlaces = new Map<string, { label: string; spot?: string }[]>();
  const placesOf = async (ref: unknown) => {
    const value = ref as Ref;
    if (value.kind !== 'npcs' || !value.slug) return [];
    if (!npcPlaces.has(value.slug)) {
      const page = await loader.loadDocument('npcs', value.slug);
      const places = page.kind === 'npcs' ? page.document.places : [];
      npcPlaces.set(value.slug, [...new Map(places.map((place) => [place.label, { label: place.label, spot: place.placementIds[0] }])).values()]);
    }
    return npcPlaces.get(value.slug)!;
  };
  const placeRows = (await loader.loadList('places')).rows as (ListRow & { values?: Record<string, unknown> })[];
  const placeRow = (name: string) => placeRows.find((row) => row.ref.name === name);
  // Places where the Heroic tier pauses, as items that drop only there record them.
  const paused = new Set(needs.flatMap(({ document }) => document.facts.heroicPausedIn?.map(nameOf) ?? []));

  const placed: { place: string; need: string; way: Way }[] = [];
  const elsewhere: { need: string; way: Way }[] = [];
  const forSale = new Map<string, { amount: number; items: number; href?: string }>();
  for (const { need, document, heroic, corruption } of needs) {
    if (need.collected) continue;
    const version = (kind: Way['kind'], place?: string): Way['version'] => {
      if (heroic) {
        if ((kind === 'drop' || kind === 'drops') && place && paused.has(place)) return { ok: false, text: 'Never Heroic here' };
        if (kind === 'drop' || kind === 'drops') return { ok: true, text: 'Can drop Heroic' };
        return { ok: false, text: 'Not Heroic' };
      }
      if (corruption) return kind === 'bag' ? { ok: true, text: 'Corrupted' } : { ok: false, text: 'Not corrupted' };
      return undefined;
    };
    // Creatures in many places read as one line, not one row in every place.
    const dropPlaces = new Set((await Promise.all(document.droppedBy.map((row) => placesOf(row.counterpart)))).flat().map((place) => place.label));
    if (dropPlaces.size > 5) {
      const best = Math.max(...document.droppedBy.map((row) => row.killChance ?? row.chance ?? 0));
      elsewhere.push({ need: need.key, way: { kind: 'drops', from: { name: `Drops from ${document.droppedBy.length} kinds of creatures` }, detail: `Up to ${dropRateText({ killChance: best })} per kill`, version: version('drops') } });
    } else {
      for (const row of document.droppedBy) for (const place of await placesOf(row.counterpart)) {
        placed.push({ place: place.label, need: need.key, way: { kind: 'drop', from: { name: nameOf(row.counterpart), href: hrefOf(row.counterpart) }, detail: `${dropRateText(row) ?? 'Chance not known'} per kill`, version: version('drop', place.label), mapHref: place.spot ? `/map/?selected=${place.spot}` : undefined } });
      }
    }
    for (const row of document.facts.dungeonRewards ?? []) {
      placed.push({ place: nameOf(row.place), need: need.key, way: { kind: 'bag', from: { name: 'Timed run reward bag' }, detail: row.guaranteed ? 'Every timed run' : `From ${row.bosses.map(nameOf).join(' or ')}`, version: corruption ? { ok: true, text: 'Corrupted' } : version('bag') } });
    }
    let cheapest: { amount: number; currency: string; href?: string } | undefined;
    for (const row of document.soldBy) {
      const places = await placesOf(row.counterpart);
      const way: Way = { kind: 'vendor', from: { name: nameOf(row.counterpart), href: hrefOf(row.counterpart) }, detail: '', price: priceOf(row.price.amount, row.price.currency), version: version('vendor') };
      if (way.version?.ok !== false && (!cheapest || (cheapest.currency === way.price!.currency && row.price.amount < cheapest.amount))) cheapest = { amount: row.price.amount, currency: way.price!.currency, href: way.price!.currencyHref };
      if (!places.length) elsewhere.push({ need: need.key, way: { ...way, detail: 'Location not on the map' } });
      for (const place of places) placed.push({ place: place.label, need: need.key, way: { ...way, mapHref: place.spot ? `/map/?selected=${place.spot}` : undefined } });
    }
    if (cheapest) {
      const total = forSale.get(cheapest.currency) ?? { amount: 0, items: 0, href: cheapest.href };
      forSale.set(cheapest.currency, { ...total, amount: total.amount + cheapest.amount, items: total.items + 1 });
    }
    for (const row of document.rewardedBy) {
      elsewhere.push({ need: need.key, way: { kind: 'quest', from: { name: nameOf(row.counterpart), href: hrefOf(row.counterpart) }, detail: row.choice ? 'Reward you can choose' : 'Quest reward', version: version('quest') } });
    }
    if (document.worldLoot) {
      const levels = document.worldLoot.levels;
      elsewhere.push({ need: need.key, way: { kind: 'world', from: { name: 'World Loot' }, detail: `From creatures of levels ${levels[0]?.minLevel} to ${levels.at(-1)?.maxLevel ?? 'any'}`, version: version('world') } });
    }
    const containers = [...document.inContainers, ...document.collectedFrom];
    // A container kind found in many places reads as one line; a container in a few places joins those places.
    const placesByLabel = new Map<string, Set<string>>();
    for (const row of containers) placesByLabel.set(row.label, new Set([...(placesByLabel.get(row.label) ?? []), ...row.places.map((place) => place.label)]));
    const local = containers.filter((row) => row.places.length && placesByLabel.get(row.label)!.size <= 3);
    const spread = containers.filter((row) => !local.includes(row));
    const containerWay = (rows: ContainerRow[], many: boolean): Way => {
      const first = rows[0]!;
      const label = new Set(rows.map((row) => row.label)).size === 1 ? first.label : `${new Set(rows.map((row) => row.label)).size} kinds of container`;
      const where = first.counterpart && rows.every((row) => row.counterpart) ? (rows.length > 1 ? ` in ${rows.length} ${nameOf(first.counterpart).startsWith('Challenge Stone') ? 'challenge stones' : 'places'}` : ` in ${nameOf(first.counterpart)}`) : '';
      return {
        kind: 'chest', from: { name: `${label}${many ? ' in many places' : where}` },
        detail: first.oddsUnavailable ? 'Odds not known' : `Up to ${formatNumber(Math.max(...rows.map((row) => row.chance ?? 0)))}% per open`,
        price: first.cost ? priceOf(first.cost.amount, first.cost.currency) : undefined, version: version('chest'),
      };
    };
    if (local.length) {
      for (const place of new Set(local.flatMap((row) => row.places.map((entry) => entry.label)))) {
        placed.push({ place, need: need.key, way: containerWay(local.filter((row) => row.places.some((entry) => entry.label === place)), false) });
      }
    }
    if (spread.length) elsewhere.push({ need: need.key, way: containerWay(spread, true) });
    for (const row of document.fromItems) {
      elsewhere.push({ need: need.key, way: { kind: 'pack', from: { name: nameOf(row.source), href: hrefOf(row.source) }, detail: row.kind === 'pack' ? 'From Random Dungeon Finder runs' : 'Opened from an item', version: version('pack') } });
    }
  }

  // Only sources that give the planned version count. A place that has the item in another version says so once.
  const needName = (key: string) => needs.find((entry) => entry.need.key === key)!.need;
  const skipped = new Map<string, Set<string>>();
  for (const entry of placed) if (entry.way.version?.ok === false) skipped.set(entry.place, new Set([...(skipped.get(entry.place) ?? []), entry.need]));
  const placedOk = placed.filter((entry) => entry.way.version?.ok !== false);
  const elsewhereOk = elsewhere.filter((entry) => entry.way.version?.ok !== false);
  for (const [place, keys] of skipped) for (const key of keys) if (placedOk.some((entry) => entry.place === place && entry.need === key)) keys.delete(key);

  // A vendor or creature found in several places lists once, in the place that already offers the most planned items.
  const needsAt = (place: string) => new Set(placedOk.filter((entry) => entry.place === place).map((entry) => entry.need)).size;
  const identity = (entry: { need: string; way: Way }) => `${entry.need}|${entry.way.kind}|${entry.way.from.name}`;
  const home = new Map<string, string>();
  for (const entry of placedOk) {
    const id = identity(entry);
    if (home.has(id)) continue;
    const places = placedOk.filter((other) => identity(other) === id).map((other) => other.place);
    home.set(id, [...places].sort((a, b) => needsAt(b) - needsAt(a) || a.localeCompare(b))[0]!);
  }
  const kept = placedOk.filter((entry) => home.get(identity(entry)) === entry.place);
  const spots = new Map<string, string[]>();
  for (const entry of placedOk) if (home.get(identity(entry)) !== entry.place) spots.set(identity(entry), [...(spots.get(identity(entry)) ?? []), entry.place]);
  for (const entry of kept) {
    const others = spots.get(identity(entry));
    if (others?.length) entry.way = { ...entry.way, alsoAt: others };
  }

  const groupNames = [...new Set(kept.map((entry) => entry.place))];
  const rowsFor = (entries: { need: string; way: Way }[]) => [...new Set(entries.map((entry) => entry.need))].map((need) => ({ need, ways: entries.filter((entry) => entry.need === need).map((entry) => entry.way), also: [] as string[] }));
  const groups: PlaceGroup[] = groupNames.map((name) => {
    const row = placeRow(name);
    const rows = rowsFor(kept.filter((entry) => entry.place === name));
    const notes: string[] = [];
    const other = [...(skipped.get(name) ?? [])].map(needName);
    if (other.length) {
      const names = other.map((need) => need.item.name);
      const versions = [...new Set(other.map((need) => need.version?.startsWith('Corruption') ? 'corrupted' : need.version === 'Heroic' ? 'Heroic' : 'as planned'))];
      notes.push(`${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'} here too, but never ${versions.join(' or ')}${paused.has(name) && versions.includes('Heroic') ? ': the Heroic Tier pauses here' : ''}.`);
    }
    if (rows.some((entry) => entry.ways.some((way) => way.kind === 'bag'))) notes.push('A timed run ends with a reward bag. Corrupted versions come from it.');
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, rows, notes,
      kind: row?.facets.placeType?.[0], levels: row?.values?.levelRange ? String(row.values.levelRange) : undefined,
      href: row?.ref.slug ? `/places/${row.ref.slug}/` : undefined,
      mapHref: row?.ref.key ? `/map/?place=${encodeURIComponent(row.ref.key)}` : rows.flatMap((entry) => entry.ways).find((way) => way.mapHref)?.mapHref,
    };
  }).sort((a, b) => b.rows.length - a.rows.length || a.name.localeCompare(b.name));
  const other: PlaceGroup = { id: 'other-ways', name: 'Other Ways', rows: rowsFor(elsewhereOk), notes: [] };
  const all = [...groups, other];
  for (const group of all) for (const row of group.rows) row.also = all.filter((entry) => entry !== group && entry.rows.some((candidate) => candidate.need === row.need)).map((entry) => entry.name);
  return { groups, other, paused: [...paused], forSale: [...forSale].map(([currency, total]) => ({ currency, ...total })) };
}
