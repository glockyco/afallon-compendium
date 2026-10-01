import { expect, test } from 'bun:test';
import { roundWeaponDamage, weaponDamageLabel } from './weapon-display';

type Weapon = Parameters<typeof weaponDamageLabel>[0];
const sword: Weapon = {
  itemType: 'WEAPON', weaponSlot: 'One-Hand', weaponType: 'One handed sword', attackMode: 'Auto',
  physicalLabel: 'Auto', weaponDamageType: null, attackSpeed: 2.9, minDamage: 8, maxDamage: 13, stats: [],
};

test('weapon modes and authored schools take precedence over inferred physical labels', () => {
  expect(weaponDamageLabel(sword)).toBe('Slashing Damage (Melee)');
  expect(weaponDamageLabel({ ...sword, weaponSlot: 'RANGED', weaponType: 'STAFF' })).toBe('Piercing Damage (Ranged)');
  expect(weaponDamageLabel({ ...sword, weaponSlot: 'RANGED', attackMode: 'Melee', physicalLabel: 'Blunt' })).toBe('Blunt Damage (Melee)');
  expect(weaponDamageLabel({ ...sword, weaponDamageType: 'Fire Damage', stats: [{ stat: { entityKey: 'stats:28', label: 'Intellect' }, amount: 1, isPercent: false }] })).toBe('Fire Damage (Melee)');
  expect(weaponDamageLabel({ ...sword, itemType: 'ARMOR', maxDamage: 0 })).toBeUndefined();
});

test('dominant elemental damage ignores physical and minion stats, with stable stat-ID ties', () => {
  const stats = [
    { stat: { entityKey: 'stats:28', label: 'Intellect' }, amount: 10, isPercent: false },
    { stat: { entityKey: 'stats:27', label: 'Strength' }, amount: 9, isPercent: false },
    { stat: { entityKey: 'stats:9', label: 'Fire Damage' }, amount: 5, isPercent: false },
    { stat: { entityKey: 'stats:140', label: 'Nature Damage' }, amount: 5, isPercent: false },
    { stat: { entityKey: 'stats:129', label: 'Minion Damage' }, amount: 100, isPercent: false },
  ];
  expect(weaponDamageLabel({ ...sword, stats })).toBe('Fire Damage (Melee)');
  expect(weaponDamageLabel({ ...sword, stats: stats.filter((row) => row.stat.entityKey !== 'stats:9' && row.stat.entityKey !== 'stats:140') })).toBe('Elemental Damage (Melee)');
});

test('weapon display rounds exact halves to even and falls back to plain damage for invalid modes', () => {
  expect(roundWeaponDamage(2.5)).toBe(2);
  expect(roundWeaponDamage(3.5)).toBe(4);
  expect(weaponDamageLabel({ ...sword, attackMode: 'None' })).toBe('Damage');
  expect(weaponDamageLabel({ ...sword, attackSpeed: 0 })).toBe('Damage');
});
