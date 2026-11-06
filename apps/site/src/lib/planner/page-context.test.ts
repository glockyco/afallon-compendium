import { expect, test } from 'bun:test';
import type { ItemFacts, PublicAbility } from '@afallon/contracts/public';
import { abilityClassCue, itemClassCue } from './page-context';

const druid = { key: 'classes:6', name: 'Druid', weapons: ['Staff', 'One Hand Sword'] };

test('weapon class cues use published weapon types and never gate armor', () => {
  expect(itemClassCue({ itemType: 'WEAPON', weaponType: 'STAFF' } as ItemFacts, druid)).toBe('Druid can use this weapon type.');
  expect(itemClassCue({ itemType: 'WEAPON', weaponType: 'ONE_HAND_SWORD' } as ItemFacts, druid)).toBe('Druid can use this weapon type.');
  expect(itemClassCue({ itemType: 'WEAPON', weaponType: 'AXE' } as ItemFacts, druid)).toBe('Druid cannot use this weapon type.');
  expect(itemClassCue({ itemType: 'ARMOR', armorType: 'PLATE' } as ItemFacts, druid)).toBeUndefined();
  expect(itemClassCue({ itemType: 'WEAPON', weaponType: 'STAFF' } as ItemFacts, undefined)).toBeUndefined();
  expect(itemClassCue({ itemType: 'WEAPON' } as ItemFacts, druid)).toBeUndefined();
});

test('ability cues name learning relations without claiming the character learned a talent', () => {
  const ability = { versions: [{ learnedBy: [{ class: { key: 'classes:6' }, via: 'talentTree' }] }] } as PublicAbility;
  expect(abilityClassCue(ability, 'classes:6')).toBe('This ability appears in your class’s talent trees; learning and use requirements still apply.');
  expect(abilityClassCue(ability, 'classes:7')).toBeUndefined();
  expect(abilityClassCue({ versions: [{ learnedBy: [{ class: { key: 'classes:6' }, via: 'autoAttack' }] }] } as PublicAbility, 'classes:6')).toBe('Your class starts with this auto attack.');
});
