import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

// SvelteKit resolves its generated SSR modules from the site root. Keep the server in a
// separate process so the repository-wide test run does not change another test's cwd.
test('Getting there describes new character starts even without an entrance', async () => {
  const script = `
    import { createServer } from 'vite';
    const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
    try {
      const { render } = await server.ssrLoadModule('svelte/server');
      const { default: Card } = await server.ssrLoadModule('/src/lib/detail/sections/PlaceSideCards.svelte');
      const place = {
        ref: { key: 'scenes:22', kind: 'places', name: 'Abandoned Quarry', slug: 'abandoned-quarry' },
        description: null, art: {}, facts: { placeType: 'zone', guideIncluded: false }, space: null,
        bosses: [], creatures: [], npcs: [], services: [], resources: [], containers: [], lootObjects: [],
        quests: [], questObjectives: [], properties: [], entrances: [], placesToEnter: [], regions: [],
        startingRaces: [], allPlayableRacesStartHere: false,
      };
      const human = { entityKey: 'races:1', name: 'Human' };
      const orc = { entityKey: 'races:7', name: 'Orc' };
      const card = (races, all) => render(Card, { props: {
        document: { ...place, startingRaces: races, allPlayableRacesStartHere: all }, registry: [],
      } }).body;
      console.log('CARD_OUTPUT:' + JSON.stringify({ empty: card([], false), all: card([human, orc], true), one: card([orc], false), two: card([human, orc], false) }));
    } finally { await server.close(); }
  `;
  const child = Bun.spawn(['bun', '-e', script], {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)), stdout: 'pipe', stderr: 'pipe',
  });
  const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  expect(exit, stderr).toBe(0);
  const output = stdout.split('CARD_OUTPUT:')[1];
  expect(output, stdout).toBeDefined();
  const cards = JSON.parse(output!) as Record<'empty' | 'all' | 'one' | 'two', string>;
  expect(cards.empty).not.toContain('Getting there');
  expect(cards.all).toContain('Getting there');
  expect(cards.all).toContain('New characters start here.');
  expect(cards.one).toContain('New Orc characters start here.');
  expect(cards.two).toContain('New Human and Orc characters start here.');
});
