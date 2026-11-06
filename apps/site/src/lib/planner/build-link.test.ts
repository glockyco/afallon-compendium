import { expect, test } from 'bun:test';
import { deflateRawSync } from 'node:zlib';
import fixtures from './build-link.fixtures.json';
import { BUILD_LIMITS, parsePlannerBuild } from './build';
import {
  BUILD_LINK_PREFIX, MAX_ENCODED_BUILD_CHARS, MAX_INFLATED_BUILD_BYTES,
  canonicalBuildJson, decodeBuildLink, decodeBuildPayload, encodeBuildLink,
  parseCanonicalBuildJson, supportsBuildLinks,
} from './build-link';

// Exact compact inputs and browser payloads from planner-link-encoding-spike.{input,results}.json,
// accepted catalog d5b0b4...0e15, Afallon 0.16.3/build 25653798. No private save data.
const fixture = fixtures[0]!;
const json = JSON.stringify(fixture.compact);
const build = parseCanonicalBuildJson(json);
const prefix = 'https://afallon.compendiums.org';

function compressed(text: string | Uint8Array): string {
  return `v1.${deflateRawSync(text).toString('base64url')}`;
}

for (const fixture of fixtures) {
  test(`${fixture.name}: complete measured Chromium/Firefox streams restore canonical content`, async () => {
    const expected = canonicalBuildJson(parseCanonicalBuildJson(JSON.stringify(fixture.compact)));
    for (const payload of [fixture.chromium, fixture.firefox]) {
      // Assert the observed browser fixtures, not byte identity with this runtime's compressor.
      const measuredLength = prefix.length + BUILD_LINK_PREFIX.length + payload.length;
      expect(measuredLength).toBeGreaterThanOrEqual(fixture.compact.i[2] === 30 ? 516 : 818);
      expect(measuredLength).toBeLessThanOrEqual(fixture.compact.i[2] === 30 ? 569 : 866);
      const decoded = await decodeBuildPayload(`v1.${payload}`);
      expect(decoded.status).toBe('ok');
      if (decoded.status === 'ok') expect(canonicalBuildJson(decoded.value)).toBe(expected);
    }
    const parsed = parseCanonicalBuildJson(JSON.stringify(fixture.compact));
    const encoded = await encodeBuildLink(parsed);
    expect(encoded.status).toBe('ok');
    if (encoded.status !== 'ok') return;
    expect(encoded.value.length - BUILD_LINK_PREFIX.length).toBeLessThanOrEqual(MAX_ENCODED_BUILD_CHARS);
    const roundTrip = await decodeBuildLink(new URL(prefix + encoded.value));
    expect(roundTrip.status).toBe('ok');
    if (roundTrip.status === 'ok') expect(canonicalBuildJson(roundTrip.value)).toBe(expected);
  });
}

test('canonical equality sorts only unordered identities and collapses only adjacent purchases', () => {
  const canonical = canonicalBuildJson(build);
  const reordered = {
    ...build,
    heroic: [...build.heroic].reverse(),
    gear: [...build.gear].reverse().map(row => ({ ...row, rolls: [...row.rolls].reverse(), gems: [...row.gems].reverse() })),
    party: { ...build.party, members: [...build.party.members].reverse() },
  };
  expect(canonicalBuildJson(reordered)).toBe(canonical);
  const ordered = { ...build, talents: { kind: 'ordered' as const, purchases: [
    { tree: 'talentTrees:13', node: 2 }, { tree: 'talentTrees:13', node: 2 },
    { tree: 'talentTrees:15', node: 1 }, { tree: 'talentTrees:13', node: 2 },
  ] } };
  expect(JSON.parse(canonicalBuildJson(ordered)).o).toEqual([[0, 2, 2], [1, 1, 1], [0, 2, 1]]);
  expect(canonicalBuildJson({ ...ordered, talents: { ...ordered.talents, purchases: [...ordered.talents.purchases].reverse() } })).not.toBe(canonicalBuildJson(ordered));
  expect(fixture.chromium).not.toBe(fixture.firefox);
});

test('Hunter preserves all 185 events, including zero-cost purchases beyond the 178-point budget', () => {
  const hunter = parseCanonicalBuildJson(JSON.stringify(fixtures.find(row => row.name === 'Hunter 60')!.compact));
  expect(hunter.talents.kind).toBe('ordered');
  if (hunter.talents.kind === 'ordered') expect(hunter.talents.purchases.length).toBe(185);
  const maximum = { ...build, talents: { kind: 'ordered', purchases: Array.from({ length: BUILD_LIMITS.purchases }, (_, index) => ({ tree: `talentTrees:${Math.floor(index / (5 * 43))}`, node: Math.floor(index / 5) % 43 })) } };
  expect(() => parsePlannerBuild(maximum)).not.toThrow();
  expect(() => parsePlannerBuild({ ...maximum, talents: { ...maximum.talents, purchases: [...maximum.talents.purchases, { tree: 'talentTrees:2', node: 40 }] } })).toThrow();
});

test('unknown order has its own final snapshot, never an invented sorted purchase ledger', async () => {
  const snapshot = { ...build, talents: { kind: 'unknown-order' as const, ranks: [
    { tree: 'talentTrees:15', node: 2, rank: 3 }, { tree: 'talentTrees:13', node: 2, rank: 5 },
  ] } };
  const text = canonicalBuildJson(snapshot);
  expect(JSON.parse(text).o).toBeUndefined();
  expect(JSON.parse(text).s).toEqual([[0, 2, 5], [1, 2, 3]]);
  const encoded = await encodeBuildLink(snapshot);
  expect(encoded.status).toBe('ok');
  if (encoded.status === 'ok') {
    const decoded = await decodeBuildLink(new URL(prefix + encoded.value));
    expect(decoded.status).toBe('ok');
    if (decoded.status === 'ok') {
      expect(decoded.value.talents.kind).toBe('unknown-order');
      expect(canonicalBuildJson(decoded.value)).toBe(text);
    }
  }
  expect(() => parseCanonicalBuildJson(JSON.stringify({ ...JSON.parse(text), o: [] }))).toThrow();
  expect(() => parseCanonicalBuildJson(JSON.stringify({ ...fixture.compact, s: [] }))).toThrow();
});

test('unevaluated gear and member kinds retain independent modifications and unknowns', async () => {
  const future = {
    ...build,
    gear: [{ ...build.gear[0], heroic: true, corruption: Number.MAX_SAFE_INTEGER, rolls: [{ index: 97, value: -12.25 }], gems: [{ socket: 95, item: 'items:999999' }], enchantment: { item: 'items:999998', tier: 7 } }],
    party: { role: null, members: [{ kind: 'quest-companion', npc: 'npcs:999999', level: null }, { kind: 'companion', npc: 'npcs:999998', level: 500 }] },
  };
  const parsed = parsePlannerBuild(future);
  const encoded = await encodeBuildLink(parsed);
  expect(encoded.status).toBe('ok');
  if (encoded.status !== 'ok') return;
  const decoded = await decodeBuildLink(new URL(prefix + encoded.value));
  expect(decoded.status).toBe('ok');
  if (decoded.status === 'ok') {
    expect(canonicalBuildJson(decoded.value)).toBe(canonicalBuildJson(parsed));
    expect(decoded.value.gear[0]!.heroic).toBe(true);
    expect(decoded.value.gear[0]!.corruption).toBe(Number.MAX_SAFE_INTEGER);
    expect(decoded.value.party.members.find(row => row.kind === 'quest-companion')?.level).toBeNull();
  }
});

test('structural validation rejects unknown fields, unsafe numbers and duplicate identities', () => {
  const invalid = [
    { ...build, name: 'Not a shared field' },
    { ...build, level: Number.MAX_SAFE_INTEGER + 1 },
    { ...build, level: 1.5 },
    { ...build, points: [{ type: 'treePoints:2', total: 1 }, { type: 'treePoints:2', total: 2 }] },
    { ...build, heroic: [build.heroic[0], build.heroic[0]] },
    { ...build, heroic: [{ ...build.heroic[0], rank: 201 }] },
    { ...build, heroic: [{ ...build.heroic[0], rank: 200 }, { ...build.heroic[1], rank: 50 }] },
    { ...build, gear: [build.gear[0], build.gear[0]] },
    { ...build, gear: [{ ...build.gear[0], rolls: [{ index: 1, value: 0 }, { index: 1, value: 2 }] }] },
    { ...build, gear: [{ ...build.gear[0], gems: [{ socket: 0, item: 'items:1' }, { socket: 0, item: 'items:2' }] }] },
    { ...build, gear: [{ ...build.gear[0], corruption: -1 }] },
    { ...build, gear: [{ ...build.gear[0], rolls: [{ index: 0, value: Infinity }] }] },
    { ...build, party: { role: 'damage', members: [build.party.members[0], { ...build.party.members[0], kind: 'companion' }] } },
    { ...build, party: { role: 'damage', members: Array.from({ length: 5 }, (_, i) => ({ kind: 'adventurer', npc: `npcs:${i}`, level: null })) } },
    { ...build, talents: { kind: 'ordered', purchases: Array.from({ length: 6 }, () => ({ tree: 'talentTrees:13', node: 2 })) } },
    { ...build, class: 'classes:01' },
    { ...build, class: 'classes:9007199254740993' },
  ];
  for (const value of invalid) expect(() => parsePlannerBuild(value)).toThrow();
});

test('compact tuples, duplicate JSON keys, tree tables and malformed/trailing JSON are rejected', async () => {
  const hostile = [
    json.replace('"c":', '"c":"' + build.catalog + '","\\u0063":'),
    json + '{}',
    json.replace('"i":[5,1,30]', '"i":[5,1,9007199254740993]'),
    JSON.stringify({ ...fixture.compact, extra: null }),
    JSON.stringify({ ...fixture.compact, t: [...fixture.compact.t, fixture.compact.t[0]] }),
    JSON.stringify({ ...fixture.compact, t: [...fixture.compact.t, 999] }),
    JSON.stringify({ ...fixture.compact, o: [[0, 0, 6]] }),
    JSON.stringify({ ...fixture.compact, o: [[0, 0, 0]] }),
    JSON.stringify({ ...fixture.compact, o: [[0, 0, 1, 9]] }),
    JSON.stringify({ ...fixture.compact, i: [5, 1, 30, 9] }),
    '['.repeat(9) + ']'.repeat(9),
    '{',
  ];
  for (const text of hostile) {
    expect(() => parseCanonicalBuildJson(text)).toThrow();
    expect((await decodeBuildPayload(compressed(text))).status).toBe('invalid');
  }
});

test('streaming inflation and encoded bounds reject hostile input before retention', async () => {
  expect((await decodeBuildPayload(compressed(' '.repeat(MAX_INFLATED_BUILD_BYTES) + json))).status).toBe('invalid');
  const atLimit = ' '.repeat(MAX_INFLATED_BUILD_BYTES - new TextEncoder().encode(json).length) + json;
  expect((await decodeBuildPayload(compressed(atLimit))).status).toBe('ok');
  expect((await decodeBuildPayload(`v1.${'A'.repeat(MAX_ENCODED_BUILD_CHARS + 1)}`)).status).toBe('invalid');
  expect((await decodeBuildPayload(compressed(Uint8Array.of(0xff, 0xfe)))).status).toBe('invalid');
});

test('versions, malformed base64url and truncated/trailing raw deflate are rejected', async () => {
  const bytes = deflateRawSync(json);
  for (const value of [
    '', `v2.${fixture.chromium}`, 'v1.A', 'v1.@@', 'v1.Zg==', 'v1.Zh',
    `v1.${bytes.subarray(0, bytes.length - 1).toString('base64url')}`,
    `v1.${Buffer.concat([bytes, Buffer.from([0])]).toString('base64url')}`,
    `v1.${Buffer.concat([bytes, bytes]).toString('base64url')}`,
  ]) expect((await decodeBuildPayload(value)).status).toBe('invalid');
});

test('transport never accepts query builds or ambiguous fragment fields', async () => {
  const value = `v1.${fixture.chromium}`;
  for (const path of [
    `/planner/?build=${value}`, `/planner/?build=${value}#build=${value}`,
    `/planner/#build=${value}&build=${value}`, `/planner/#build=${value}&other=1`,
    `/planner/#build=${value.replace('v1.', 'v1%2E')}`, '/planner/#build=',
  ]) expect((await decodeBuildLink(new URL(prefix + path))).status).toBe('invalid');
  expect(await decodeBuildLink(new URL(prefix + '/planner/#talents'))).toEqual({ status: 'none' });
  expect(BUILD_LINK_PREFIX).toBe('/planner/#build=v1.');
});

test('constructor format detection returns an explicit unsupported result without another encoding', async () => {
  const original = globalThis.CompressionStream;
  try {
    globalThis.CompressionStream = class {
      constructor() { throw new TypeError('Raw deflate unavailable'); }
    } as unknown as typeof CompressionStream;
    expect(supportsBuildLinks()).toBe(false);
    expect((await encodeBuildLink(build)).status).toBe('unsupported');
    expect((await decodeBuildPayload(`v1.${fixture.chromium}`)).status).toBe('unsupported');
  } finally {
    globalThis.CompressionStream = original;
  }
  const originalDecoder = globalThis.DecompressionStream;
  try {
    globalThis.DecompressionStream = class {
      constructor() { throw new TypeError('Raw deflate unavailable'); }
    } as unknown as typeof DecompressionStream;
    expect(supportsBuildLinks()).toBe(false);
    expect((await encodeBuildLink(build)).status).toBe('unsupported');
  } finally {
    globalThis.DecompressionStream = originalDecoder;
  }
});
