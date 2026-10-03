import type { PublicEffect, PublicKindEntry, PublicSearchEntry, StaticDocument } from '@afallon/contracts/public';
import type { MapDataLoader, MapIndexes } from '../map-data';
import { effectImpact } from '../detail/effect-outcome';
import { formatNumber, nameOf } from '../format';

const namesByIndex = new WeakMap<MapIndexes, Map<string, PublicSearchEntry[]>>();

function nameKey(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
}

function sharedNamePages(indexes: MapIndexes, name: string): PublicSearchEntry[] {
  let names = namesByIndex.get(indexes);
  if (!names) {
    names = new Map();
    for (const entry of indexes.entries) {
      if (!entry.document || !entry.ref.slug) continue;
      const key = nameKey(entry.ref.name);
      let group = names.get(key);
      if (!group) { group = []; names.set(key, group); }
      group.push(entry);
    }
    namesByIndex.set(indexes, names);
  }
  return names.get(nameKey(name)) ?? [];
}

function effectOutcomeLabel(effect: PublicEffect): string {
  const scaling = effect.ranks[0]?.scaling;
  const actions = effect.ranks[0]?.actions ?? [];
  const damage = actions.find((action) => action.label === 'Authored Damage' && action.amount !== undefined);
  const category = actions.find((action) => action.label === 'Damage Category')?.detail;
  if (damage?.amount !== undefined && (!scaling || scaling.baseKind === 'flat')) return `${formatNumber(damage.amount)}${category ? ` ${category.replace(/ Damage$/i, '').toLowerCase()}` : ''} damage`;
  const change = actions.find((action) => action.label === 'Changes' && action.amount !== undefined && action.target);
  if (change?.amount !== undefined && change.target) return `${formatNumber(change.amount)}${change.unit === '%' ? '%' : ''} ${nameOf(change.target)}`;
  const summon = actions.find((action) => action.label === 'Summons' && action.target)?.target;
  if (summon) return `summons ${nameOf(summon)}`;
  const destination = actions.find((action) => action.label === 'Destination Scene' && action.target)?.target;
  if (destination) return `travels to ${nameOf(destination)}`;
  if (scaling?.weaponPercent) return `${formatNumber(scaling.weaponPercent)}% weapon damage`;
  if (scaling?.baseAmount && (scaling.baseKind === 'percentMax' || scaling.baseKind === 'percentCurrent') && scaling.baseStat)
    return `${formatNumber(scaling.baseAmount)}% of ${scaling.baseKind === 'percentMax' ? 'maximum' : 'current'} ${nameOf(scaling.baseStat)}`;
  if (scaling?.stats.length) return scaling.stats.map((row) => `${formatNumber(row.coefficientPercent)}% of ${nameOf(row.stat)}`).join(' + ');
  if (scaling?.baseKind === 'unknown' && scaling.baseAmount) return `recorded amount ${formatNumber(scaling.baseAmount)}`;
  return effectImpact(effect).split(' · ')[0]!.replace(/[.!?]$/, '');
}

function effectContext(effect: PublicEffect, peers: readonly PublicEffect[], maxLength: number): string | undefined {
  if (peers.every((other) => other === effect || other.stackLimit !== effect.stackLimit)) {
    return `stacks up to ${effect.stackLimit}`;
  }
  if (effect.ranks.length > 1 && peers.every((other) => other === effect || other.ranks.length !== effect.ranks.length)) {
    return `${effect.ranks.length} ranks`;
  }
  let sourceFallback: string | undefined;
  for (const row of effect.appliedBy) {
    const source = nameOf(row.source);
    if (source.length <= 35 && !/(?:\bNPC\b|^Chance to )/.test(source) && peers.every((other) => other === effect || !other.appliedBy.some((candidate) => nameOf(candidate.source) === source))) {
      if (source.length <= maxLength) return source;
      if (!sourceFallback || source.length < sourceFallback.length) sourceFallback = source;
    }
  }
  const outcome = effectOutcomeLabel(effect);
  if (outcome && peers.every((other) => other === effect || effectOutcomeLabel(other) !== outcome)) {
    return sourceFallback && outcome.length > maxLength && sourceFallback.length < outcome.length ? sourceFallback : outcome;
  }
  const stacksDiffer = peers.some((other) => other.stackLimit !== effect.stackLimit);
  if (stacksDiffer && outcome && peers.every((other) => other === effect || other.stackLimit !== effect.stackLimit || effectOutcomeLabel(other) !== outcome)) {
    return `stacks up to ${effect.stackLimit}, ${outcome}`;
  }
  for (const row of effect.worldSources) {
    const place = row.place && nameOf(row.place);
    if (place && place.length <= 35 && peers.every((other) => other === effect || !other.worldSources.some((candidate) => candidate.place && nameOf(candidate.place) === place))) {
      if (place.length <= maxLength) return place;
      if (!sourceFallback || place.length < sourceFallback.length) sourceFallback = place;
    }
  }
  return sourceFallback;
}

export async function pageTitle(
  page: StaticDocument,
  registry: readonly PublicKindEntry[],
  indexes: MapIndexes,
  loader: Pick<MapDataLoader, 'loadPageForRef'>,
): Promise<{ title: string; effectSubtitle?: string }> {
  const name = page.document.ref.name;
  const peers = sharedNamePages(indexes, name);
  if (peers.length < 2) return { title: `${name} | Afallon Wiki` };
  const label = page.kind === 'mechanics' ? 'Mechanics' : registry.find((kind) => kind.kind === page.kind)?.label;
  if (!label) throw new Error(`No reader-facing kind for ${page.kind}.`);
  const siblings = peers.filter((entry) => entry.ref.kind === page.kind);
  const kindPrefix = peers.some((entry) => entry.ref.kind !== page.kind) ? `${label}, ` : '';
  let context: string | undefined;
  if (siblings.length > 1) {
    if (page.kind !== 'effects') throw new Error(`${name} has multiple ${page.kind} pages without a visible distinction.`);
    const effects = await Promise.all(siblings.map(async (entry) => {
      const sibling = entry.ref.key === page.document.ref.key ? page : await loader.loadPageForRef(entry.ref);
      if (sibling.kind !== 'effects') throw new Error(`Expected effect for ${entry.ref.key}.`);
      return sibling.document;
    }));
    context = effectContext(page.document, effects, 60 - `${name} (${kindPrefix}) | Afallon Wiki`.length);
    if (!context) throw new Error(`${name} has several effect pages with no distinct player-facing facts.`);
  }
  const kindContext = context ? `${kindPrefix}${context}` : label;
  return { title: `${name} (${kindContext}) | Afallon Wiki`, effectSubtitle: context };
}
