import { expect, test } from 'bun:test';
import { selectTab, withTab, type TabSpec } from './tab-state';

const tabs: TabSpec[] = [
  { key: 'list', label: 'List', anchors: ['talent-21-5', 'talent-21-6'] },
  { key: 'grid', label: 'Grid', anchors: ['grid-21'] },
];
const at = (address: string) => new URL(address, 'https://example.test/classes/shieldmaster/');

test('the tab value selects a known tab, and an absent or unknown value selects the first tab', () => {
  expect(selectTab(tabs, at('?tab=grid'), 'tab')).toEqual({ key: 'grid', replace: false });
  expect(selectTab(tabs, at('?q=x'), 'tab')).toEqual({ key: 'list', replace: false });
  // An unknown value is replaced, so the address names the tab that the reader sees.
  expect(selectTab(tabs, at('?tab=cards'), 'tab')).toEqual({ key: 'list', replace: true });
});

test('a fragment selects the tab that owns it, and an unknown fragment does not', () => {
  expect(selectTab(tabs, at('?tab=grid#talent-21-5'), 'tab')).toEqual({ key: 'list', replace: true });
  expect(selectTab(tabs, at('#talent-21-5'), 'tab')).toEqual({ key: 'list', replace: true });
  expect(selectTab(tabs, at('?tab=list#talent-21-5'), 'tab')).toEqual({ key: 'list', replace: false });
  expect(selectTab(tabs, at('?tab=grid#starting-gear'), 'tab')).toEqual({ key: 'grid', replace: false });
  // A malformed escape is a valid address. It names no tab and must not stop the page.
  expect(selectTab(tabs, at('?tab=grid#%'), 'tab')).toEqual({ key: 'grid', replace: false });
});

test('a tab change keeps other query fields and clears the fragment only on request', () => {
  expect(withTab(at('?q=axe&tab=list#talent-21-5'), 'tab', 'grid', true).href).toBe('https://example.test/classes/shieldmaster/?q=axe&tab=grid');
  expect(withTab(at('?q=axe&tab=grid#talent-21-5'), 'tab', 'list', false).href).toBe('https://example.test/classes/shieldmaster/?q=axe&tab=list#talent-21-5');
});

test('tab sets with different fields choose independently', () => {
  const bands: TabSpec[] = [{ key: 'levels-1-5', label: 'Levels 1–5' }, { key: 'levels-6-11', label: 'Levels 6–11' }];
  const address = at('?tab=wizard&level=levels-6-11');
  expect(selectTab(bands, address, 'level')).toEqual({ key: 'levels-6-11', replace: false });
  // A class choice keeps the level band, so the next class opens at the same band.
  expect(withTab(address, 'tab', 'druid', false).href).toBe('https://example.test/classes/shieldmaster/?tab=druid&level=levels-6-11');
});

test('a fragment that two views render keeps the requested view, and selects the first view without one', () => {
  const views = [{ key: 'web', label: 'Web', anchors: ['talent-1'] }, { key: 'list', label: 'List', anchors: ['talent-1', 'tree-1'] }];
  expect(selectTab(views, new URL('https://example.test/classes/a/?view=list#talent-1'), 'view')).toEqual({ key: 'list', replace: false });
  expect(selectTab(views, new URL('https://example.test/classes/a/#talent-1'), 'view')).toEqual({ key: 'web', replace: true });
  // An anchor that only the list renders still opens the list.
  expect(selectTab(views, new URL('https://example.test/classes/a/?view=web#tree-1'), 'view')).toEqual({ key: 'list', replace: true });
});
