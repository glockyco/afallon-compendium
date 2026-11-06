// Throwaway mockup data for the whole planner: one Druid character with talents, gear and a party, computed from the
// published documents. Nothing here is shipped; it only feeds the layout study.
import type { ListRow, PublicItem, PublicNpc, StaticPlanner } from '@afallon/contracts/public';
import { serverMapLoader } from '$lib/server/publication';
import { loadMockup } from './mockup-state.server';
import { buildAcquisition } from './acquire.server';

type Icon = { url: string } | undefined;
type ItemRef = { key: string; kind: string; name: string; slug?: string; icon?: Icon };
export type SlotPlan = {
  placement: string; label: string; group: 'Weapons' | 'Armor' | 'Jewelry';
  slug?: string; heroic?: boolean; corruption?: number; gems?: Record<number, string>; enchant?: string; note?: string; collected?: boolean;
};
export type StatLine = { stat: string; amount: number; percent: boolean; sources: { label: string; detail: string; amount: number }[] };

const ELARA_GEAR: SlotPlan[] = [
  { placement: 'main', label: 'Main Hand', group: 'Weapons', slug: 'rune-staff' },
  { placement: 'off', label: 'Off Hand', group: 'Weapons', note: 'Taken by the two-handed staff' },
  { placement: 'ranged', label: 'Ranged', group: 'Weapons', note: 'Druids can’t use ranged weapons' },
  { placement: 'helmet', label: 'Helmet', group: 'Armor', slug: 'hat-of-the-arcanist', corruption: 3, gems: { 1: 'blue-intellect-gem' } },
  { placement: 'shoulders', label: 'Shoulders', group: 'Armor', slug: 'mantle-of-the-arcanist', collected: true },
  { placement: 'chest', label: 'Chest', group: 'Armor', slug: 'robe-of-the-arcanist', heroic: true, enchant: 'enchant-insight' },
  { placement: 'pants', label: 'Pants', group: 'Armor', slug: 'trousers-of-the-arcanist' },
  { placement: 'gloves', label: 'Gloves', group: 'Armor', slug: 'grovewarden-gloves', collected: true },
  { placement: 'boots', label: 'Boots', group: 'Armor', slug: 'grovewarden-boots', collected: true },
  { placement: 'belt', label: 'Belt', group: 'Armor', slug: 'grovewarden-belt', collected: true },
  { placement: 'cape', label: 'Cape', group: 'Armor', slug: 'moonshade-cloak' },
  { placement: 'neck', label: 'Neck', group: 'Jewelry', slug: 'crabshell-necklace' },
  { placement: 'ring', label: 'Ring', group: 'Jewelry', slug: 'veilpiercers-seal', collected: true },
  { placement: 'trinket', label: 'Trinket', group: 'Jewelry' },
];

const PARTY = [
  { slug: 'brielle-dawnfield', level: null as number | null },
  { slug: 'norik-ironbrook', level: 23 },
  { slug: 'kaela-marshward', level: 29 },
];

const round = (value: number) => Math.round(value * 10) / 10;
const refName = (ref: unknown): string => { const value = ref as { name?: string; label?: string }; return value.name ?? value.label ?? 'Stat'; };

let cached: ReturnType<typeof buildPlannerMock> | undefined;
export function loadPlannerMock() { return cached ??= buildPlannerMock(); }

async function buildPlannerMock() {
  const loader = serverMapLoader();
  const talents = await loadMockup();
  const planner: StaticPlanner = await loader.loadPlanner();
  const itemList = (await loader.loadList('items')).rows;
  const item = async (slug: string): Promise<PublicItem> => {
    const page = await loader.loadDocument('items', slug);
    if (page.kind !== 'items') throw new Error(`No item ${slug}`);
    return page.document;
  };

  // Equipment with each piece's own changes.
  const slots = await Promise.all(ELARA_GEAR.map(async (plan) => {
    const document = plan.slug ? await item(plan.slug) : undefined;
    const gems = document ? await Promise.all(document.facts.sockets.map(async (socket, index) => {
      const slug = plan.gems?.[index];
      return { colour: socket.gemType?.replace(/ Gem$/, '') ?? 'Unknown', gem: slug ? await item(slug) : undefined };
    })) : [];
    const enchant = plan.enchant ? await item(plan.enchant) : undefined;
    return { ...plan, document, gems, enchant };
  }));

  // Bonuses by stat, each with its sources. Base stats are not verified, so totals stay bonuses only.
  const stats = new Map<string, StatLine>();
  const add = (stat: string, percent: boolean, amount: number, label: string, detail: string) => {
    const key = `${stat}|${percent}`;
    const line = stats.get(key) ?? { stat, amount: 0, percent, sources: [] };
    line.amount = round(line.amount + amount);
    line.sources.push({ label, detail, amount: round(amount) });
    stats.set(key, line);
  };
  const sets = new Map<string, { name: string; slug?: string; members: ItemRef[]; tiers: { equipped: number; stats: { stat: string; amount: number; percent: boolean }[] }[]; worn: string[] }>();
  let gearScore = 0;
  for (const slot of slots) {
    const document = slot.document;
    if (!document) continue;
    const facts = document.facts;
    const heroicFactor = slot.heroic ? 1 + (facts.heroic?.statBonusPercent ?? 50) / 100 : 1;
    const corruptionFactor = 1 + ((facts.corruption?.allStatsPercentPerLevel ?? 5) * (slot.corruption ?? 0)) / 100;
    for (const row of facts.stats) {
      const amount = Math.round(row.amount * (row.isPercent ? 1 : heroicFactor * corruptionFactor));
      add(refName(row.stat), row.isPercent, amount, document.ref.name, slot.label);
      if (!row.isPercent) gearScore += amount;
    }
    for (const socket of slot.gems) if (socket.gem) for (const row of socket.gem.facts.gem?.stats ?? []) {
      add(refName(row.stat), row.isPercent, row.amount, socket.gem.ref.name, `${slot.label} socket`);
      if (!row.isPercent) gearScore += row.amount;
    }
    if (slot.enchant) for (const row of slot.enchant.facts.enchanting?.tiers[0]?.stats ?? []) {
      add(refName(row.stat), row.isPercent, row.amount, slot.enchant.ref.name, slot.label);
      if (!row.isPercent) gearScore += row.amount;
    }
    if (facts.minDamage !== undefined && facts.maxDamage !== undefined) gearScore += Math.round(((facts.minDamage + facts.maxDamage) / 2) * heroicFactor);
    if (facts.gearSet) {
      const set = facts.gearSet;
      const entry = sets.get(set.set.key) ?? { name: refName(set.set), slug: 'slug' in set.set ? set.set.slug : undefined, members: set.members as ItemRef[], tiers: set.tiers.map((tier) => ({ equipped: tier.equipped, stats: tier.stats.map((row) => ({ stat: refName(row.stat), amount: row.amount, percent: row.isPercent })) })), worn: [] };
      entry.worn.push(document.ref.key);
      sets.set(set.set.key, entry);
    }
  }
  for (const set of sets.values()) for (const tier of set.tiers) if (set.worn.length >= tier.equipped) {
    for (const row of tier.stats) add(row.stat, row.percent, row.amount, set.name, `${tier.equipped} pieces`);
  }
  // Talent bonuses from learned ranks.
  for (const [anchor, rank] of Object.entries(talents.learned)) {
    const [, tree, index] = anchor.match(/^talent-(\d+)-(\d+)$/)!;
    const node = planner.trees.find((entry) => entry.key === `talentTrees:${tree}`)?.nodes.find((entry) => entry.index === Number(index));
    const raw = node?.ranks[rank - 1]?.rawData as { statEffects?: { amount: number; isPercent: boolean; stat: { label: string } }[] } | undefined;
    for (const effect of raw?.statEffects ?? []) add(effect.stat.label, effect.isPercent, effect.amount, node?.target?.name ?? 'Talent', `Rank ${rank}`);
  }
  const statOrder = ['Intellect', 'Stamina', 'Strength', 'Agility', 'Health', 'Mana', 'Armor', 'Magic Armor', 'Critical Hit Chance', 'Haste', 'Arcane Damage', 'Nature Damage'];
  const statLines = [...stats.values()].sort((a, b) => {
    const ai = statOrder.indexOf(a.stat), bi = statOrder.indexOf(b.stat);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.stat.localeCompare(b.stat);
  });

  // Helmet choices for the picker: every helmet from level 18 to 26, newest requirement first.
  const helmetRows = itemList.filter((row) => {
    const level = Number((row as ListRow & { values?: Record<string, unknown> }).values?.levelRequirement ?? 0);
    return (row.facets.slot ?? []).includes('HELMET') && level >= 18 && level <= 26;
  });
  const helmets = (await Promise.all(helmetRows.map((row) => item(row.ref.slug!))))
    .sort((a, b) => {
      const al = a.facts.levelRequirement ?? 0, bl = b.facts.levelRequirement ?? 0;
      const ao = al > 24 ? 1 : 0, bo = bl > 24 ? 1 : 0;
      return ao - bo || (ao ? al - bl : bl - al) || a.ref.name.localeCompare(b.ref.name);
    })
    .map((document) => ({
      document,
      where: [document.droppedBy.length ? 'Drop' : '', document.soldBy.length ? 'Vendor' : '', document.rewardedBy.length ? 'Quest' : '', document.crafting ? 'Crafted' : ''].filter(Boolean).join(' · ') || 'No known source',
    }));
  const equippedSlot = slots.find((slot) => slot.placement === 'helmet')!;
  const equippedHelmet = equippedSlot.document!;
  const candidate = helmets.find((entry) => entry.document.ref.name === 'Grovewarden Helm')!.document;
  const comparison = (() => {
    const rows = new Map<string, { stat: string; percent: boolean; from?: number; to?: number }>();
    const factor = 1 + ((equippedHelmet.facts.corruption?.allStatsPercentPerLevel ?? 5) * (equippedSlot.corruption ?? 0)) / 100;
    const put = (stat: string, percent: boolean, side: 'from' | 'to', amount: number) => {
      const key = `${stat}|${percent}`;
      const row = rows.get(key) ?? { stat, percent };
      row[side] = round((row[side] ?? 0) + amount);
      rows.set(key, row);
    };
    for (const row of equippedHelmet.facts.stats) put(refName(row.stat), row.isPercent, 'from', row.isPercent ? row.amount : Math.round(row.amount * factor));
    for (const socket of equippedSlot.gems) for (const row of socket.gem?.facts.gem?.stats ?? []) if (refName(row.stat) !== 'Item Power') put(refName(row.stat), row.isPercent, 'from', row.amount);
    for (const row of candidate.facts.stats) put(refName(row.stat), row.isPercent, 'to', row.amount);
    return [...rows.values()];
  })();

  // The party: roster facts, entered levels, one member's details, and a dungeon check.
  const guide = await loader.loadDocument('mechanics', 'adventurers');
  const roster = guide.kind === 'mechanics' && 'roster' in guide.document ? (guide.document as unknown as { roster: { adventurer: ItemRef; class: ItemRef; race?: ItemRef; role: string; startingLevel: number; joinAfterHours: number; preferredTree?: ItemRef & { anchor?: string } }[] }).roster : [];
  const npcs = new Map<string, PublicNpc>();
  for (const member of [...PARTY, { slug: 'dravok-duskclaw', level: null }]) {
    const page = await loader.loadDocument('npcs', member.slug);
    if (page.kind === 'npcs') npcs.set(member.slug, page.document);
  }
  const classIcons = new Map<string, Icon>();
  for (const row of (await loader.loadList('classes')).rows) classIcons.set(row.ref.name, 'icon' in row.ref ? (row.ref as ItemRef).icon : undefined);
  const party = PARTY.map((member) => {
    const row = roster.find((entry) => entry.adventurer.slug === member.slug)!;
    const npc = npcs.get(member.slug);
    return { ...row, entered: member.level, portrait: npc?.art.portrait ?? npc?.art.icon ?? row.adventurer.icon, classIcon: classIcons.get(row.class.name) };
  });
  const detailOf = (slug: string) => {
    const npc = npcs.get(slug)!;
    const row = roster.find((entry) => entry.adventurer.slug === slug)!;
    return { row, npc: npc.ref, portrait: npc.art.portrait ?? npc.art.icon, adventurer: npc.adventurer, kit: npc.adventurerGear?.kit ?? [], preference: npc.facts.lootSpecialization };
  };
  const memberDetail = detailOf('brielle-dawnfield');
  const candidateMember = detailOf('dravok-duskclaw');
  const placeRows = (await loader.loadList('places')).rows.filter((row) => (row.facets.placeType ?? []).includes('dungeon'));
  const dungeons = placeRows.map((row) => {
    const range = String((row as ListRow & { values?: Record<string, unknown> }).values?.levelRange ?? '');
    const [min, max] = range.split('–').map(Number);
    return { name: row.ref.name, slug: row.ref.slug, min: min ?? 0, max: max ?? min ?? 0 };
  }).filter((entry) => entry.min > 0).sort((a, b) => a.min - b.min);

  // Other browser characters for the menu and the characters page.
  const characters = [
    { id: 'elara', name: 'Elara', className: 'Druid', race: 'Human', level: 24, talents: `${talents.spent} of ${talents.total}`, gear: `${slots.filter((slot) => slot.document).length} of ${slots.filter((slot) => !slot.note).length}`, party: `${party.length} of 4`, active: true, changed: 'Today' },
    { id: 'brann', name: 'Brann', className: 'Shieldmaster', race: 'Dwarf', level: 41, talents: '121 of 121', gear: '12 of 13', party: '4 of 4', active: false, changed: 'October 9' },
    { id: 'mira', name: 'Mira', className: 'Hunter', race: 'Orc', level: 12, talents: '30 of 34', gear: '5 of 13', party: 'Empty', active: false, changed: 'October 2' },
  ].map((entry) => ({ ...entry, icon: classIcons.get(entry.className) }));
  // Everything the plan asks for, as things to get: each item, each gem and each enchantment.
  const needs = slots.flatMap((slot) => {
    if (!slot.document) return [];
    const entry = (key: string, label: string, document: PublicItem, version: string | undefined, collected: boolean, heroic = false, corruption = 0) => ({
      need: { key, slot: label, version, collected, item: { key: document.ref.key, name: document.ref.name, slug: document.ref.slug, icon: (document.art.icon ?? document.ref.icon)?.url, rarity: document.facts.rarity } },
      document, heroic, corruption,
    });
    const version = slot.heroic ? 'Heroic' : slot.corruption ? `Corruption ${slot.corruption}` : undefined;
    return [
      entry(slot.placement, slot.label, slot.document, version, Boolean(slot.collected), Boolean(slot.heroic), slot.corruption ?? 0),
      ...slot.gems.flatMap((socket, index) => socket.gem ? [entry(`${slot.placement}-gem-${index}`, `${slot.label} gem`, socket.gem, undefined, false)] : []),
      ...(slot.enchant ? [entry(`${slot.placement}-enchant`, `${slot.label} enchantment`, slot.enchant, undefined, false)] : []),
    ];
  });
  const acquisition = await buildAcquisition(loader, needs);

  return {
    talents, slots, statLines, sets: [...sets.values()], gearScore,
    helmets, equippedHelmet, candidate, comparison,
    roster, party, memberDetail, candidateMember, dungeons, characters,
    classIcons: Object.fromEntries(classIcons),
    needs: needs.map((entry) => entry.need), acquisition,
  };
}
export type PlannerMock = Awaited<ReturnType<typeof buildPlannerMock>>;
