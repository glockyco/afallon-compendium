// Throwaway: explore published data for the planner mockup.
import { json } from '@sveltejs/kit';
import { serverMapLoader } from '$lib/server/publication';
import { loadPlannerMock } from '../data.server';

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const loader = serverMapLoader();
  const what = url.searchParams.get('what');
  if (what === 'doc') {
    const page = await loader.loadDocument(url.searchParams.get('kind') as 'items', url.searchParams.get('slug')!);
    const field = url.searchParams.get('field');
    const value = field ? field.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown> | undefined)?.[key], page.document) : page.document;
    return json(value ?? null);
  }
  if (what === 'acquire') {
    const mock = await loadPlannerMock();
    const nameOfNeed = (key: string) => mock.needs.find((need) => need.key === key)?.item.name ?? key;
    const show = (group: { name: string; kind?: string; levels?: string; href?: string; notes: string[]; rows: { need: string; ways: { kind: string; from: { name: string }; detail: string; price?: { amount: number; currency: string }; version?: { ok: boolean; text: string } }[]; also: string[] }[] }) => ({
      head: `${group.name} [${group.kind ?? '-'}${group.levels ? ` ${group.levels}` : ''}] ${group.rows.length} items ${group.href ?? ''}`, notes: group.notes,
      rows: group.rows.map((row) => `${nameOfNeed(row.need)}: ${row.ways.map((way) => `${way.kind}:${way.from.name} · ${way.detail}${way.price ? ` · ${way.price.amount} ${way.price.currency}` : ''}${way.version ? ` · ${way.version.ok ? '✓' : '✗'}${way.version.text}` : ''}`).join(' | ')}${row.also.length ? ` || also: ${row.also.join(', ')}` : ''}`),
    });
    return json({ forSale: mock.acquisition.forSale, groups: mock.acquisition.groups.map(show), other: show(mock.acquisition.other) });
  }
  if (what === 'sources') {
    const mock = await loadPlannerMock();
    const nameOf = (ref: unknown) => { const value = ref as { name?: string; label?: string }; return value.name ?? value.label ?? '?'; };
    const npcPlaces = new Map<string, string[]>();
    const placesOf = async (ref: unknown) => {
      const value = ref as { kind?: string; slug?: string; key?: string };
      if (value.kind !== 'npcs' || !value.slug) return [];
      if (!npcPlaces.has(value.slug)) {
        const page = await loader.loadDocument('npcs', value.slug);
        npcPlaces.set(value.slug, page.kind === 'npcs' ? [...new Set(page.document.places.map((place) => place.label))] : []);
      }
      return npcPlaces.get(value.slug)!;
    };
    const documents = [
      ...mock.slots.flatMap((slot) => slot.document ? [{ slot: slot.label, document: slot.document }] : []),
      ...mock.slots.flatMap((slot) => slot.gems.flatMap((socket) => socket.gem ? [{ slot: `${slot.label} gem`, document: socket.gem }] : [])),
      ...mock.slots.flatMap((slot) => slot.enchant ? [{ slot: `${slot.label} enchantment`, document: slot.enchant }] : []),
    ];
    const out = [];
    for (const { slot, document } of documents) {
      out.push({
        slot, item: document.ref.name, level: document.facts.levelRequirement,
        drops: await Promise.all(document.droppedBy.map(async (row) => ({ npc: nameOf(row.counterpart), chance: row.chance, kill: row.killChance, places: await placesOf(row.counterpart) }))),
        vendors: await Promise.all(document.soldBy.map(async (row) => ({ npc: nameOf(row.counterpart), price: `${row.price.amount} ${nameOf(row.price.currency)}`, places: await placesOf(row.counterpart) }))),
        quests: document.rewardedBy.map((row) => ({ quest: nameOf(row.counterpart), slug: (row.counterpart as { slug?: string }).slug, choice: row.choice })),
        crafting: document.crafting ? { recipe: document.crafting.recipe.name, skill: document.crafting.skill ? nameOf(document.crafting.skill) : undefined, level: document.crafting.ranks[0]?.requiredLevel, station: document.crafting.station ? nameOf(document.crafting.station) : undefined, materials: document.crafting.materials.map((row) => `${row.count} ${nameOf(row.counterpart)}`) } : undefined,
        worldLoot: document.worldLoot ? { levels: document.worldLoot.levels.map((level) => `${level.minLevel}-${level.maxLevel ?? '+'}`).join(','), rank: document.worldLoot.minimumRank } : undefined,
        dungeonRewards: document.facts.dungeonRewards?.map((row) => `${nameOf(row.place)} (${row.bosses.map(nameOf).join('/')})${row.guaranteed ? ' guaranteed' : ''}`),
        containers: [...document.inContainers, ...document.collectedFrom].map((row) => `${row.label}${row.counterpart ? ` in ${nameOf(row.counterpart)}` : ''} @ ${row.places.map((place) => place.label).join('/')} chance ${row.chance}`),
        fromItems: document.fromItems.map((row) => `${nameOf(row.source)} ${row.kind}`),
        finder: Boolean(document.dungeonFinder), corruption: document.facts.corruption?.maxLevel, heroic: document.facts.heroic?.statBonusPercent, paused: document.facts.heroicPausedIn?.map(nameOf),
      });
    }
    return json(out);
  }
  if (what === 'seed') {
    const mock = await loadPlannerMock();
    const planner = await loader.loadPlanner();
    const root = await loader.loadRoot() as unknown as { catalogId: string };
    const classKey = (name: string) => planner.classes.find((entry) => entry.name === name)!.key;
    const raceKey = (name: string) => planner.races.find((entry) => entry.name === name)!.key;
    const purchases = mock.talents.order.map((row) => { const [, tree, node] = row.anchor.match(/^talent-(\d+)-(\d+)$/)!; return { tree: `talentTrees:${tree}`, node: Number(node) }; });
    const build = (className: string, race: string, level: number, ordered = purchases) => ({
      catalog: root.catalogId, class: classKey(className), race: raceKey(race), level, points: [],
      talents: { kind: 'ordered', purchases: ordered }, heroic: [], gear: [], party: { role: null, members: [] },
    });
    return json({
      version: 1, revision: 3, activeId: 'elara', draft: null, migratedCharacterLevel: true,
      characters: [
        { id: 'elara', name: 'Elara', revision: 1, build: build('Druid', 'Human', 24) },
        { id: 'brann', name: 'Brann', revision: 2, build: build('Shieldmaster', 'Dwarf', 41, []) },
        { id: 'mira', name: 'Mira', revision: 3, build: build('Hunter', 'Orc', 12, []) },
      ],
    });
  }
  if (what === 'mock') {
    const mock = await loadPlannerMock();
    return json({
      slots: mock.slots.map((slot) => `${slot.label}: ${slot.document?.ref.name ?? slot.note ?? 'Empty'} ${slot.gems.map((g) => `${g.colour}:${g.gem?.ref.name ?? '-'}`).join(' ')} ${slot.enchant?.ref.name ?? ''}`),
      stats: mock.statLines.map((line) => `${line.stat} ${line.amount}${line.percent ? '%' : ''} <- ${line.sources.map((s) => `${s.label} ${s.amount}`).join(', ')}`),
      sets: mock.sets.map((set) => `${set.name} ${set.worn.length}/${set.members.length} tiers ${JSON.stringify(set.tiers)}`),
      gearScore: mock.gearScore,
      helmets: mock.helmets.map((h) => `${h.ref.name} L${h.facts.levelRequirement} ${h.facts.armorType}`),
      comparison: mock.comparison,
      party: mock.party.map((p) => `${p.adventurer.name} ${p.class.name} ${p.role} start ${p.startingLevel} entered ${p.entered} portrait ${Boolean(p.portrait)}`),
      member: { adventurer: mock.memberDetail.adventurer, kit: mock.memberDetail.kit.length, preference: mock.memberDetail.preference },
      dungeons: mock.dungeons.map((d) => `${d.name} ${d.min}-${d.max}`),
      characters: mock.characters,
    });
  }
  if (what === 'items') {
    const list = await loader.loadList('items');
    const rows = list.rows.filter((row) => (row.facets.class ?? []).some((value) => /druid/i.test(value)) || !(row.facets.class?.length));
    const slots = new Map<string, unknown[]>();
    for (const row of rows) {
      const level = (row as any).values?.levelRequirement;
      for (const slot of row.facets.slot ?? []) {
        const bucket = slots.get(slot) ?? [];
        bucket.push({ name: row.ref.name, slug: row.ref.slug, level, facets: row.facets, columns: (row as any).values });
        slots.set(slot, bucket);
      }
    }
    return json({ facetsSample: list.rows[0], slots: Object.fromEntries([...slots].map(([slot, entries]) => [slot, entries.length])) });
  }
  if (what === 'slot') {
    const slot = url.searchParams.get('slot')!;
    const max = Number(url.searchParams.get('max') ?? 26);
    const min = Number(url.searchParams.get('min') ?? 16);
    const list = await loader.loadList('items');
    const rows = list.rows.filter((row) => (row.facets.slot ?? []).includes(slot)
      && ((row.facets.class ?? []).length === 0 || (row.facets.class ?? []).some((value) => /druid/i.test(value))));
    const picked = rows.filter((row) => { const level = Number((row as any).values?.levelRequirement ?? 0); return level >= min && level <= max; });
    const docs = await Promise.all(picked.slice(0, 40).map(async (row) => {
      const page = await loader.loadDocument('items', row.ref.slug!);
      if (page.kind !== 'items') return null;
      const f = page.document.facts;
      return { name: row.ref.name, slug: row.ref.slug, rarity: f.rarity, level: f.levelRequirement, type: (row as any).values?.type, armor: f.armorType, weapon: f.weaponType, stats: f.stats.map((s) => `${s.amount}${s.isPercent ? '%' : ''} ${(s.stat as any).name}`), random: f.randomStats.length, sockets: f.sockets.map((s) => s.gemType), set: (f.gearSet?.set as any)?.name, power: f.itemPower, sources: [page.document.droppedBy.length, page.document.soldBy.length, page.document.rewardedBy.length, page.document.crafting ? 1 : 0] };
    }));
    return json({ count: rows.length, inRange: picked.length, docs: docs.filter(Boolean) });
  }
  if (what === 'roster') {
    const page = await loader.loadDocument('mechanics', 'adventurers');
    if (page.kind !== 'mechanics') return json({ error: 'no guide' });
    const doc = page.document as unknown as { roster: { adventurer: { name: string; slug?: string; icon?: unknown }; class: { name: string }; race?: { name: string }; role: string; startingLevel: number; joinAfterHours: number; preferredTree?: { name: string } }[] };
    return json(doc.roster.map((row) => ({ name: row.adventurer.name, slug: row.adventurer.slug, icon: row.adventurer.icon, class: row.class.name, race: row.race?.name, role: row.role, start: row.startingLevel, join: row.joinAfterHours, tree: row.preferredTree?.name })));
  }
  if (what === 'dungeons') {
    const list = await loader.loadList('places');
    return json(list.rows.filter((row) => (row.facets.placeType ?? row.facets.type ?? []).some((value) => /dungeon/i.test(value))).map((row) => ({ name: row.ref.name, slug: row.ref.slug, columns: (row as any).values, facets: row.facets })));
  }
  return json({ error: 'what?' });
}
