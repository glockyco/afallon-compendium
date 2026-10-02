import { expect, test } from 'bun:test';
import type { CurrencyPurchaseRow, EntityRef } from '@afallon/contracts/public';
import { sharedPurchaseSellers } from './purchase-sellers';

const seller = (key: string): EntityRef => ({ key: `npcs:${key}`, kind: 'npcs', name: key, slug: key });
const row = (soldBy: EntityRef[]): CurrencyPurchaseRow => ({
  item: { key: 'items:1', kind: 'items', name: 'A piece', slug: 'a-piece' },
  price: { amount: 5, currency: { key: 'currencies:1', kind: 'currencies', name: 'Honor', slug: 'honor' } },
  soldBy,
});

test('a shared merchant pair is stated once even when stock lists its members in another order', () => {
  const rowan = seller('rowan');
  const varric = seller('varric');
  expect(sharedPurchaseSellers([row([rowan, varric]), row([varric, rowan])])).toEqual([rowan, varric]);
});

test('a differing seller preserves merchant information in each offer', () => {
  const rowan = seller('rowan');
  const varric = seller('varric');
  const merchant = seller('merchant');
  expect(sharedPurchaseSellers([row([rowan, varric]), row([rowan, merchant])])).toEqual([]);
  expect(sharedPurchaseSellers([row([rowan]), row([])])).toEqual([]);
});
