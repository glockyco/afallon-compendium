import type { CatalogItemFacts } from '@afallon/contracts/catalog';

type Weapon = Pick<CatalogItemFacts, 'itemType' | 'weaponSlot' | 'weaponType' | 'attackMode' | 'physicalLabel' | 'weaponDamageType' | 'attackSpeed' | 'minDamage' | 'maxDamage' | 'stats'>;

const ELEMENTAL_SCHOOLS = new Set(['Arcane Damage', 'Fire Damage', 'Frost Damage', 'Holy Damage', 'Nature Damage', 'Poison Damage']);

export function roundWeaponDamage(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  return fraction < 0.5 ? lower : fraction > 0.5 ? lower + 1 : lower % 2 === 0 ? lower : lower + 1;
}

// Resolves the label that follows the damage range on the game's weapon line: "Slashing Damage (Melee)", or "Damage"
// when the weapon has no valid attack profile. Instance corruption and the viewer's element are not catalog facts.
export function weaponDamageLabel(item: Weapon): string | undefined {
  if (item.itemType !== 'WEAPON' || item.maxDamage === null || item.maxDamage <= 0 || item.minDamage === null) return undefined;
  const speed = item.attackSpeed;
  if (speed === null || speed <= 0 || item.attackMode === 'None' || !item.attackMode || (!item.weaponSlot && !item.weaponType)) return 'Damage';
  const type = item.weaponType?.toUpperCase() ?? '';
  const slot = item.weaponSlot?.toUpperCase() ?? '';
  const mode = item.attackMode && item.attackMode !== 'Auto' ? item.attackMode
    : slot.includes('RANGED') || type.includes('BOW') || type.includes('CROSSBOW') ? 'RangedPhysical'
    : type.includes('STAFF') ? 'RangedMagic' : 'Melee';
  if (mode === 'None') return 'Damage';
  const ranged = mode === 'RangedPhysical' || mode === 'RangedMagic' || mode === 'Ranged';
  const damageType = item.weaponDamageType;
  let physical = damageType !== null && damageType !== undefined
    ? ['Slicing Damage', 'Bleed Damage', 'Auto Attack'].some((name) => damageType.toLowerCase().includes(name.toLowerCase()))
    : mode !== 'RangedMagic';
  if (!damageType && mode === 'Melee') {
    let intellect = 0, strength = 0, agility = 0;
    for (const row of item.stats) {
      if (row.isPercent) continue;
      if (row.stat.entityKey === 'stats:28') intellect = row.amount;
      else if (row.stat.entityKey === 'stats:27') strength = row.amount;
      else if (row.stat.entityKey === 'stats:135') agility = row.amount;
    }
    physical = !(intellect > 0 && intellect > strength && intellect > agility);
  }
  let school: string;
  if (physical) {
    const label = item.physicalLabel && item.physicalLabel !== 'Auto' ? item.physicalLabel
      : mode === 'RangedPhysical' || mode === 'Ranged' || type.includes('DAGGER') ? 'Piercing'
      : type.includes('MACE') || type.includes('FIST WEAPON') || (mode === 'Melee' && type.includes('STAFF')) ? 'Blunt' : 'Slashing';
    school = `${label} Damage`;
  } else if (damageType) school = damageType;
  else {
    let dominant: Weapon['stats'][number] | undefined;
    for (const row of item.stats) {
      if (row.isPercent || row.amount <= 0 || !row.stat.label || !ELEMENTAL_SCHOOLS.has(row.stat.label)) continue;
      if (!dominant || row.amount > dominant.amount || (row.amount === dominant.amount
        && Number(row.stat.entityKey?.split(':')[1]) < Number(dominant.stat.entityKey?.split(':')[1]))) dominant = row;
    }
    school = dominant?.stat.label ?? 'Elemental Damage';
  }
  return `${school} (${ranged ? 'Ranged' : 'Melee'})`;
}
