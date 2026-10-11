/**
 * Frozen build-link v1 reference (semantic requirements: character-planner spec).
 * Emit /planner/#build=v1.<unpadded base64url(raw-deflate(UTF-8 compact JSON))>.
 * Object keys, in canonical order:
 * c: full lowercase 64-hex source catalog; i: [native class ID, native race ID, level];
 * p: [[native treePoints ID, entered nonnegative integer total], ...];
 * t: ascending native talentTrees IDs, containing exactly the referenced trees;
 * o: [[index into t, native node index, adjacent purchase count], ...] IN PURCHASE ORDER;
 * OR s: [[index into t, native node index, final rank], ...], explicitly UNKNOWN ORDER.
 * Exactly one of o/s is present, including for empty allocations. Free defaults are not purchases.
 * h: final Heroic ranks in the same triple shape (never a purchase timeline);
 * g: [[placement code, native item ID, Heroic 0/1, independent corruption integer,
 *      [[authored item random-range index, entered finite value], ...],
 *      [[socket index, native gem item ID], ...], [enchantment item ID, tier] or null], ...];
 * a: [player role code or null, [[member-kind code, native NPC ID, entered level or null], ...]].
 * Placement codes 0..15: helmet, shoulders, chest, pants, gloves, boots, belt, cape, neck,
 * ring, trinket, main, off, ranged, ring-2, trinket-2. Roles 0..2: tank, healer, damage.
 * Member kinds 0..2: adventurer, companion, quest-companion. Codes NEVER depend on publication order.
 * Unordered p/t/h/s/g/rolls/gems/members sort numerically by their stable identity/code;
 * purchase order is retained, merging ONLY adjacent equal nodes. Local IDs/names are excluded.
 * Empty collections remain arrays, missing rolls stay unknown, and null member levels stay unknown.
 * No gear or party legality is asserted: physical slots, corruption caps, member-kind semantics,
 * published identities and gameplay bounds must be verified by the owning capability.
 *
 * Bounds: 16,384 encoded payload characters; 262,144 inflated UTF-8 bytes, enforced while reading
 * the decompression stream before JSON parsing; nesting at most 8; all tuples exact length.
 * Accepted authored inventory supplies the structural limits in BUILD_LIMITS: five trees, three
 * point totals, 408 ordinary purchases/runs, 127 ordinary nodes, five increments/ranks per node;
 * seven Heroic nodes, 200 ranks/node and 240 total; 16 placements, two rolls/item, three gems/item,
 * four unique NPC members. These are transport ceilings, NOT a base 178-point event limit.
 * IDs/indexes/totals/levels/corruption/tiers/counts must be safe integers (positive for levels,
 * counts and final ranks); entered rolls are finite numbers with magnitude <= MAX_SAFE_INTEGER.
 * Unknown/missing fields, duplicate object keys or unordered identities, duplicate tree IDs,
 * unused tree-table entries, mixed o/s, unsafe numbers, invalid UTF-8/base64url/deflate/JSON,
 * trailing compressed or JSON data and unsupported versions are rejected before retention.
 * Canonical JSON content determines equality, not compressor bytes (browser outputs differ).
 * Query-only builds explain the fragment format; dual query/fragment input is rejected.
 * Both raw-deflate constructors are feature-detected. Unsupported browsers may still edit/export
 * locally; no alternate incompatible link is emitted. This module never reads or writes storage.
 * Fragments avoid host request URLs, not history, clipboard, scripts or recipients; raw deflate
 * provides neither encryption nor authenticity. Browser navigation/adoption belongs to the workspace.
 */
import {
  BUILD_LIMITS, GEAR_PLACEMENTS, MAX_PARTY_MEMBERS, PARTY_MEMBER_KINDS, PARTY_ROLES,
  buildArray, buildInteger, buildObject, nativeId, parsePlannerBuild,
  type FinalRank, type PlannerBuild,
} from './build';

export const MAX_ENCODED_BUILD_CHARS = 16_384;
export const MAX_INFLATED_BUILD_BYTES = 262_144;
export const BUILD_LINK_PREFIX = '/planner/#build=v1.';

export type BuildLinkResult<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'invalid' | 'unsupported'; readonly message: string };
export type BuildLinkDecodeResult = BuildLinkResult<PlannerBuild> | { readonly status: 'none' };

const unsupported = {
  status: 'unsupported',
  message: 'This browser does not support raw-deflate build links. You can still edit locally and export your characters.',
} as const;

function invalid(error: unknown): { status: 'invalid'; message: string } {
  return { status: 'invalid', message: error instanceof Error ? error.message : 'Invalid build link' };
}

function tuple(value: unknown, length: number): unknown[] {
  const row = buildArray(value, length);
  if (row.length !== length) throw new Error('Invalid build tuple');
  return row;
}

function nativeKey(value: unknown, kind: string): string {
  return `${kind}:${buildInteger(value)}`;
}

/** Canonical identity, also used by persistence/export without depending on compressed output. */
export function canonicalBuildJson(value: PlannerBuild): string {
  const build = parsePlannerBuild(value);
  const ordinary = build.talents.kind === 'ordered' ? build.talents.purchases : build.talents.ranks;
  const trees = [...new Set([...ordinary, ...build.heroic].map(row => nativeId(row.tree, 'talentTrees')))].sort((a, b) => a - b);
  const treeIndex = (tree: string) => trees.indexOf(nativeId(tree, 'talentTrees'));
  const final = (rows: readonly FinalRank[]) => rows.map<[number, number, number]>(row => [treeIndex(row.tree), row.node, row.rank]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const runs: [number, number, number][] = [];
  if (build.talents.kind === 'ordered') {
    for (const row of build.talents.purchases) {
      const index = treeIndex(row.tree);
      const previous = runs.at(-1);
      if (previous && previous[0] === index && previous[1] === row.node) previous[2]++;
      else runs.push([index, row.node, 1]);
    }
  }
  return JSON.stringify({
    c: build.catalog,
    i: [nativeId(build.class, 'classes'), nativeId(build.race, 'races'), build.level],
    p: build.points.map<[number, number]>(row => [nativeId(row.type, 'treePoints'), row.total]).sort((a, b) => a[0] - b[0]),
    t: trees,
    ...(build.talents.kind === 'ordered' ? { o: runs } : { s: final(build.talents.ranks) }),
    h: final(build.heroic),
    g: [...build.gear].sort((a, b) => GEAR_PLACEMENTS.indexOf(a.placement) - GEAR_PLACEMENTS.indexOf(b.placement)).map(row => [
      GEAR_PLACEMENTS.indexOf(row.placement), nativeId(row.item, 'items'), row.heroic ? 1 : 0, row.corruption,
      [...row.rolls].sort((a, b) => a.index - b.index).map(roll => [roll.index, roll.value]),
      [...row.gems].sort((a, b) => a.socket - b.socket).map(gem => [gem.socket, nativeId(gem.item, 'items')]),
      row.enchantment === null ? null : [nativeId(row.enchantment.item, 'items'), row.enchantment.tier],
    ]),
    a: [build.party.role === null ? null : PARTY_ROLES.indexOf(build.party.role), [...build.party.members]
      .sort((a, b) => PARTY_MEMBER_KINDS.indexOf(a.kind) - PARTY_MEMBER_KINDS.indexOf(b.kind) || nativeId(a.npc, 'npcs') - nativeId(b.npc, 'npcs'))
      .map(row => [PARTY_MEMBER_KINDS.indexOf(row.kind), nativeId(row.npc, 'npcs'), row.level])],
  });
}

/** Scan before JSON.parse: JSON.parse silently keeps the last duplicate object key. */
function checkJsonTokens(text: string): void {
  const token = /\s*("(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|true|false|null|[{}\[\],:])/y;
  const stack: (Set<string> | null)[] = [];
  let offset = 0;
  while (offset < text.length) {
    token.lastIndex = offset;
    const match = token.exec(text);
    if (!match) {
      if (/^\s*$/.test(text.slice(offset))) break;
      throw new Error('Malformed build JSON');
    }
    offset = token.lastIndex;
    const value = match[1]!;
    if (value === '{' || value === '[') {
      stack.push(value === '{' ? new Set() : null);
      if (stack.length > 8) throw new Error('Build JSON is nested too deeply');
    } else if (value === '}' || value === ']') {
      stack.pop();
    } else if (value.startsWith('"') && /^\s*:/.test(text.slice(offset))) {
      const keys = stack.at(-1);
      const key = JSON.parse(value) as string;
      if (keys?.has(key)) throw new Error('Duplicate build JSON field');
      keys?.add(key);
    } else if (/^-?[0-9]/.test(value)) {
      const number = Number(value);
      if (!Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER) throw new Error('Unsafe build number');
    }
  }
}

export function parseCanonicalBuildJson(text: string): PlannerBuild {
  if (new TextEncoder().encode(text).byteLength > MAX_INFLATED_BUILD_BYTES) throw new Error('Build exceeds inflated byte limit');
  checkJsonTokens(text);
  const raw = JSON.parse(text) as Record<string, unknown>;
  const unknownOrder = Object.prototype.hasOwnProperty.call(raw ?? {}, 's');
  buildObject(raw, ['c', 'i', 'p', 't', unknownOrder ? 's' : 'o', 'h', 'g', 'a']);
  const identity = tuple(raw.i, 3);
  const trees = buildArray(raw.t, BUILD_LIMITS.trees).map(tree => nativeKey(tree, 'talentTrees'));
  if (new Set(trees).size !== trees.length) throw new Error('Duplicate tree identity');
  const referenced = new Set<string>();
  const tree = (value: unknown): string => {
    const index = buildInteger(value, 0, trees.length - 1);
    referenced.add(trees[index]!);
    return trees[index]!;
  };
  const final = (value: unknown, maximum: number) => buildArray(value, maximum).map(entry => {
    const row = tuple(entry, 3);
    return { tree: tree(row[0]), node: buildInteger(row[1]), rank: buildInteger(row[2], 1) };
  });
  const purchases: { tree: string; node: number }[] = [];
  if (!unknownOrder) {
    for (const entry of buildArray(raw.o, BUILD_LIMITS.purchases)) {
      const row = tuple(entry, 3);
      const key = tree(row[0]);
      const node = buildInteger(row[1]);
      const count = buildInteger(row[2], 1, BUILD_LIMITS.ordinaryRank);
      if (purchases.length + count > BUILD_LIMITS.purchases) throw new Error('Too many purchase events');
      for (let i = 0; i < count; i++) purchases.push({ tree: key, node });
    }
  }
  const talents = unknownOrder
    ? { kind: 'unknown-order' as const, ranks: final(raw.s, BUILD_LIMITS.ordinaryNodes) }
    : { kind: 'ordered' as const, purchases };
  const heroic = final(raw.h, BUILD_LIMITS.heroicNodes);
  if (referenced.size !== trees.length) throw new Error('Unused tree-table entry');
  const party = tuple(raw.a, 2);
  return parsePlannerBuild({
    catalog: raw.c, class: nativeKey(identity[0], 'classes'), race: nativeKey(identity[1], 'races'), level: identity[2],
    points: buildArray(raw.p, BUILD_LIMITS.points).map(entry => {
      const row = tuple(entry, 2);
      return { type: nativeKey(row[0], 'treePoints'), total: row[1] };
    }),
    talents, heroic,
    gear: buildArray(raw.g, GEAR_PLACEMENTS.length).map(entry => {
      const row = tuple(entry, 7);
      const enchant = row[6] === null ? null : tuple(row[6], 2);
      return {
        placement: GEAR_PLACEMENTS[buildInteger(row[0], 0, GEAR_PLACEMENTS.length - 1)], item: nativeKey(row[1], 'items'),
        heroic: buildInteger(row[2], 0, 1) === 1, corruption: row[3],
        rolls: buildArray(row[4], BUILD_LIMITS.rolls).map(entry => { const roll = tuple(entry, 2); return { index: roll[0], value: roll[1] }; }),
        gems: buildArray(row[5], BUILD_LIMITS.sockets).map(entry => { const gem = tuple(entry, 2); return { socket: gem[0], item: nativeKey(gem[1], 'items') }; }),
        enchantment: enchant === null ? null : { item: nativeKey(enchant[0], 'items'), tier: enchant[1] },
      };
    }),
    party: {
      role: party[0] === null ? null : PARTY_ROLES[buildInteger(party[0], 0, PARTY_ROLES.length - 1)],
      members: buildArray(party[1], MAX_PARTY_MEMBERS).map(entry => {
        const member = tuple(entry, 3);
        return { kind: PARTY_MEMBER_KINDS[buildInteger(member[0], 0, PARTY_MEMBER_KINDS.length - 1)], npc: nativeKey(member[1], 'npcs'), level: member[2] };
      }),
    },
  });
}

/** Constructor detection tests the actual format, not just the existence of stream globals. */
export function supportsBuildLinks(): boolean {
  try {
    new CompressionStream('deflate-raw');
    new DecompressionStream('deflate-raw');
    return true;
  } catch {
    return false;
  }
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeBase64url(payload: string): Uint8Array<ArrayBuffer> {
  if (!payload.length || payload.length > MAX_ENCODED_BUILD_CHARS) throw new Error('Build exceeds encoded size limit or is empty');
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || payload.length % 4 === 1) throw new Error('Malformed build base64url');
  const binary = atob(payload.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - payload.length % 4) % 4));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  if (base64url(bytes) !== payload) throw new Error('Noncanonical build base64url');
  return bytes;
}

export async function encodeBuildLink(build: PlannerBuild): Promise<BuildLinkResult<string>> {
  try {
    const json = canonicalBuildJson(build);
    const bytes = new TextEncoder().encode(json);
    if (bytes.byteLength > MAX_INFLATED_BUILD_BYTES) throw new Error('Build exceeds inflated byte limit');
    if (!supportsBuildLinks()) return unsupported;
    const compressed = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    const payload = base64url(compressed);
    if (payload.length > MAX_ENCODED_BUILD_CHARS) throw new Error('Build exceeds encoded size limit');
    return { status: 'ok', value: `${BUILD_LINK_PREFIX}${payload}` };
  } catch (error) {
    return invalid(error);
  }
}

/** Decode a versioned payload without storage, preview adoption, or server URL reads. */
export async function decodeBuildPayload(value: string): Promise<BuildLinkResult<PlannerBuild>> {
  try {
    if (!value.startsWith('v1.')) throw new Error('Unsupported build-link version');
    const bytes = decodeBase64url(value.slice(3));
    if (!supportsBuildLinks()) return unsupported;
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let text = '';
    let total = 0;
    try {
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        total += chunk.byteLength;
        if (total > MAX_INFLATED_BUILD_BYTES) throw new Error('Build exceeds inflated byte limit');
        text += decoder.decode(chunk, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }
    return { status: 'ok', value: parseCanonicalBuildJson(text) };
  } catch (error) {
    return invalid(error);
  }
}

/** Accept only the canonical fragment transport. Call after mount/on navigation, never server load. */
export async function decodeBuildLink(url: URL): Promise<BuildLinkDecodeResult> {
  const fragment = new URLSearchParams(url.hash.slice(1));
  const queries = url.searchParams.getAll('build');
  const fragments = fragment.getAll('build');
  if (queries.length && fragments.length) return invalid(new Error('Build appears in both query and fragment'));
  if (queries.length) return invalid(new Error('Use /planner/#build=v1.<payload>; query build links are not supported'));
  if (!fragments.length) return { status: 'none' };
  if (fragments.length !== 1 || [...fragment.keys()].some(key => key !== 'build')) return invalid(new Error('Ambiguous build fragment'));
  // URLSearchParams decodes escapes; v1 links require the literal, unpadded ASCII transport.
  if (url.hash !== `#build=${fragments[0]}`) return invalid(new Error('Malformed build fragment'));
  return decodeBuildPayload(fragments[0]!);
}
