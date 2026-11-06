// The in-memory model of one planned build, shared by the character collection, the share-link codec and the
// planner workspace. The exact compact link format and bounds live beside the codec in build-link.ts.
// Keys are stable native catalog identities such as `classes:6`, never publication row offsets or reader names.

/** A Talent Point purchase: one rank of one node, in the order the reader chose. Repeats are successive ranks. */
export type TalentPurchase = { readonly tree: string; readonly node: number };

/** A final rank of a node, used for Heroic Essence trees and for save imports whose purchase order is unknown. */
export type FinalRank = { readonly tree: string; readonly node: number; readonly rank: number };

/** Talent Point allocations either keep the reader's order or are a final snapshot whose order is unknown. */
export type TalentOrder =
  | { readonly kind: 'ordered'; readonly purchases: readonly TalentPurchase[] }
  | { readonly kind: 'unknown-order'; readonly ranks: readonly FinalRank[] };

/** One equipped item and its own modifications. An absent roll value is unentered, never zero. */
export type GearEntry = {
  readonly placement: GearPlacement;
  readonly item: string;
  readonly heroic: boolean;
  readonly corruption: number;
  readonly rolls: readonly { readonly index: number; readonly value: number }[];
  readonly gems: readonly { readonly socket: number; readonly item: string }[];
  readonly enchantment: { readonly item: string; readonly tier: number } | null;
};

export type PartyRole = 'tank' | 'healer' | 'damage';

/** A party member; a null level means the current level is unknown, not the starting level. */
export type PartyMember = { readonly kind: PartyMemberKind; readonly npc: string; readonly level: number | null };

export type Party = { readonly role: PartyRole | null; readonly members: readonly PartyMember[] };

export type PlannerBuild = {
  /** Full lowercase 64-digit catalog ID the build was made against. Provenance, not a hard requirement. */
  readonly catalog: string;
  readonly class: string;
  readonly race: string;
  readonly level: number;
  /** Whole-type totals entered by the reader, kept separate from any verified base level grant. */
  readonly points: readonly { readonly type: string; readonly total: number }[];
  readonly talents: TalentOrder;
  readonly heroic: readonly FinalRank[];
  readonly gear: readonly GearEntry[];
  readonly party: Party;
};

export const MAX_PARTY_MEMBERS = 4;

// Frozen v1 transport codes. Append-only changes require a new transport version, not publication sorting.
export const GEAR_PLACEMENTS = [
  'helmet', 'shoulders', 'chest', 'pants', 'gloves', 'boots', 'belt', 'cape', 'neck',
  'ring', 'trinket', 'main', 'off', 'ranged', 'ring-2', 'trinket-2',
] as const;
export type GearPlacement = typeof GEAR_PLACEMENTS[number];
export const PARTY_ROLES = ['tank', 'healer', 'damage'] as const;
export const PARTY_MEMBER_KINDS = ['adventurer', 'companion', 'quest-companion'] as const;
export type PartyMemberKind = typeof PARTY_MEMBER_KINDS[number];

/** Structural ceilings from the accepted playable authored inventory, not the 178-point base budget.
 * The largest ordinary class has 408 authored ranks and 127 nodes; Heroic trees have at most
 * seven nodes, 240 ranks total and 200 ranks on one node. The catalog has three point types,
 * at most two random ranges and three sockets on one item. These limits do not assert legality.
 */
export const BUILD_LIMITS = {
  trees: 5, points: 3, purchases: 408, ordinaryNodes: 127, ordinaryRank: 5,
  heroicNodes: 7, heroicRanks: 240, heroicRank: 200, rolls: 2, sockets: 3,
} as const;

export function buildObject(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object);
  if (keys.length !== fields.length || keys.some(key => !fields.includes(key))) throw new Error('Unknown or missing build field');
  return object;
}

export function buildInteger(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error('Invalid or unsafe build integer');
  }
  return value;
}

export function buildArray(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error('Invalid or oversized build collection');
  return value;
}

export function nativeId(key: unknown, kind: string): number {
  if (typeof key !== 'string' || !new RegExp(`^${kind}:(0|[1-9][0-9]*)$`).test(key)) throw new Error('Invalid native identity');
  return buildInteger(Number(key.slice(kind.length + 1)));
}

function unique<T>(values: readonly T[], key: (value: T) => string | number): void {
  if (new Set(values.map(key)).size !== values.length) throw new Error('Duplicate build identity');
}

function ranks(value: unknown, maximumNodes: number, maximumRank: number, maximumTotal: number): FinalRank[] {
  const result = buildArray(value, maximumNodes).map(entry => {
    const row = buildObject(entry, ['tree', 'node', 'rank']);
    nativeId(row.tree, 'talentTrees');
    return { tree: row.tree as string, node: buildInteger(row.node), rank: buildInteger(row.rank, 1, maximumRank) };
  });
  unique(result, row => `${row.tree}/${row.node}`);
  if (result.reduce((sum, row) => sum + row.rank, 0) > maximumTotal) throw new Error('Too many selected ranks');
  return result;
}

/** Validate and detach a complete in-memory build, without loading publication facts or compression code.
 * This preserves old-catalog native identities and unevaluated gear/party. Published identity resolution,
 * purchase legality, physical duplicate slots, corruption caps and member semantics belong to their features.
 */
export function parsePlannerBuild(value: unknown): PlannerBuild {
  const build = buildObject(value, ['catalog', 'class', 'race', 'level', 'points', 'talents', 'heroic', 'gear', 'party']);
  if (typeof build.catalog !== 'string' || !/^[0-9a-f]{64}$/.test(build.catalog)) throw new Error('Invalid source catalog');
  nativeId(build.class, 'classes');
  nativeId(build.race, 'races');
  const points = buildArray(build.points, BUILD_LIMITS.points).map(entry => {
    const row = buildObject(entry, ['type', 'total']);
    nativeId(row.type, 'treePoints');
    return { type: row.type as string, total: buildInteger(row.total) };
  });
  unique(points, row => row.type);
  const order = build.talents as Record<string, unknown> | null;
  let talents: TalentOrder;
  if (order?.kind === 'ordered') {
    buildObject(order, ['kind', 'purchases']);
    const purchases = buildArray(order.purchases, BUILD_LIMITS.purchases).map(entry => {
      const row = buildObject(entry, ['tree', 'node']);
      nativeId(row.tree, 'talentTrees');
      return { tree: row.tree as string, node: buildInteger(row.node) };
    });
    const counts = new Map<string, number>();
    for (const row of purchases) {
      const key = `${row.tree}/${row.node}`;
      const count = (counts.get(key) ?? 0) + 1;
      if (count > BUILD_LIMITS.ordinaryRank) throw new Error('Too many purchases of one node');
      counts.set(key, count);
    }
    if (counts.size > BUILD_LIMITS.ordinaryNodes) throw new Error('Too many ordinary nodes');
    talents = { kind: 'ordered', purchases };
  } else if (order?.kind === 'unknown-order') {
    buildObject(order, ['kind', 'ranks']);
    talents = { kind: 'unknown-order', ranks: ranks(order.ranks, BUILD_LIMITS.ordinaryNodes, BUILD_LIMITS.ordinaryRank, BUILD_LIMITS.purchases) };
  } else {
    throw new Error('Unknown talent order');
  }
  const heroic = ranks(build.heroic, BUILD_LIMITS.heroicNodes, BUILD_LIMITS.heroicRank, BUILD_LIMITS.heroicRanks);
  const ordinary = talents.kind === 'ordered' ? talents.purchases : talents.ranks;
  const ordinaryTrees = new Set(ordinary.map(row => row.tree));
  if (heroic.some(row => ordinaryTrees.has(row.tree))) throw new Error('A tree cannot have both ordinary and Heroic allocations');
  if (new Set([...ordinary, ...heroic].map(row => row.tree)).size > BUILD_LIMITS.trees) throw new Error('Too many trees');
  const gear = buildArray(build.gear, GEAR_PLACEMENTS.length).map(entry => {
    const row = buildObject(entry, ['placement', 'item', 'heroic', 'corruption', 'rolls', 'gems', 'enchantment']);
    if (!GEAR_PLACEMENTS.includes(row.placement as GearPlacement)) throw new Error('Unknown gear placement');
    nativeId(row.item, 'items');
    if (typeof row.heroic !== 'boolean') throw new Error('Invalid Heroic flag');
    const rolls = buildArray(row.rolls, BUILD_LIMITS.rolls).map(entry => {
      const roll = buildObject(entry, ['index', 'value']);
      if (typeof roll.value !== 'number' || !Number.isFinite(roll.value) || Math.abs(roll.value) > Number.MAX_SAFE_INTEGER) throw new Error('Invalid random-stat value');
      return { index: buildInteger(roll.index), value: roll.value };
    });
    unique(rolls, roll => roll.index);
    const gems = buildArray(row.gems, BUILD_LIMITS.sockets).map(entry => {
      const gem = buildObject(entry, ['socket', 'item']);
      nativeId(gem.item, 'items');
      return { socket: buildInteger(gem.socket), item: gem.item as string };
    });
    unique(gems, gem => gem.socket);
    let enchantment: GearEntry['enchantment'] = null;
    if (row.enchantment !== null) {
      const enchant = buildObject(row.enchantment, ['item', 'tier']);
      nativeId(enchant.item, 'items');
      enchantment = { item: enchant.item as string, tier: buildInteger(enchant.tier) };
    }
    return {
      placement: row.placement as GearPlacement, item: row.item as string, heroic: row.heroic,
      corruption: buildInteger(row.corruption), rolls, gems, enchantment,
    };
  });
  unique(gear, row => row.placement);
  const partyRow = buildObject(build.party, ['role', 'members']);
  if (partyRow.role !== null && !PARTY_ROLES.includes(partyRow.role as PartyRole)) throw new Error('Unknown player role');
  const members = buildArray(partyRow.members, MAX_PARTY_MEMBERS).map(entry => {
    const member = buildObject(entry, ['kind', 'npc', 'level']);
    if (!PARTY_MEMBER_KINDS.includes(member.kind as PartyMemberKind)) throw new Error('Unknown party member kind');
    nativeId(member.npc, 'npcs');
    return { kind: member.kind as PartyMemberKind, npc: member.npc as string, level: member.level === null ? null : buildInteger(member.level, 1) };
  });
  unique(members, member => member.npc);
  return {
    catalog: build.catalog, class: build.class as string, race: build.race as string, level: buildInteger(build.level, 1),
    points, talents, heroic, gear, party: { role: partyRow.role as PartyRole | null, members },
  };
}
