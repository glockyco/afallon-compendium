import { expect, test } from 'bun:test';
import { selectTab, withTab, type TabSpec } from './tab-state';

const tabs: TabSpec[] = [
  { key: 'list', label: 'List', anchors: ['talent-21-5', 'talent-21-6'] },
  { key: 'grid', label: 'Grid', anchors: ['grid-21'] },
];
const at = (address: string) => new URL(address, 'https://example.test/classes/shieldmaster/');

test('the tab value selects a known tab, and an absent or unknown value selects the first tab', () => {
  expect(selectTab(tabs, at('?tab=grid'))).toEqual({ key: 'grid', replace: false });
  expect(selectTab(tabs, at('?q=x'))).toEqual({ key: 'list', replace: false });
  // An unknown value is replaced, so the address names the tab that the reader sees.
  expect(selectTab(tabs, at('?tab=cards'))).toEqual({ key: 'list', replace: true });
});

test('a fragment selects the tab that owns it, and an unknown fragment does not', () => {
  expect(selectTab(tabs, at('?tab=grid#talent-21-5'))).toEqual({ key: 'list', replace: true });
  expect(selectTab(tabs, at('#talent-21-5'))).toEqual({ key: 'list', replace: true });
  expect(selectTab(tabs, at('?tab=list#talent-21-5'))).toEqual({ key: 'list', replace: false });
  expect(selectTab(tabs, at('?tab=grid#starting-gear'))).toEqual({ key: 'grid', replace: false });
  // A malformed escape is a valid address. It names no tab and must not stop the page.
  expect(selectTab(tabs, at('?tab=grid#%'))).toEqual({ key: 'grid', replace: false });
});

test('a tab change keeps other query fields and clears the fragment only on request', () => {
  expect(withTab(at('?q=axe&tab=list#talent-21-5'), 'grid', true).href).toBe('https://example.test/classes/shieldmaster/?q=axe&tab=grid');
  expect(withTab(at('?q=axe&tab=grid#talent-21-5'), 'list', false).href).toBe('https://example.test/classes/shieldmaster/?q=axe&tab=list#talent-21-5');
});
