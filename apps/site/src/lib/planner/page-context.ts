import type { PublicAbility, ItemFacts } from '@afallon/contracts/public';

/** Prerendered published facts only; no talent payload or page lookup is needed at mount. */
export type CharacterClassSummary = { readonly key: string; readonly name: string; readonly weapons: readonly string[]; readonly icon?: string };

export function itemClassCue(facts: ItemFacts, summary: CharacterClassSummary | undefined): string | undefined {
  if (facts.itemType !== 'WEAPON' || !facts.weaponType || !summary) return undefined;
  const normalized = facts.weaponType.replaceAll('_', ' ').toLocaleLowerCase('en-US');
  return summary.weapons.some((weapon) => weapon.replaceAll('_', ' ').toLocaleLowerCase('en-US') === normalized)
    ? `${summary.name} can use this weapon type.` : `${summary.name} cannot use this weapon type.`;
}

export function abilityClassCue(document: PublicAbility, classKey: string): string | undefined {
  const learners = document.versions.flatMap((version) => version.learnedBy).filter((row) => row.class.key === classKey);
  if (!learners.length) return undefined;
  return learners.some((row) => row.via === 'autoAttack')
    ? 'Your class starts with this auto attack.' : 'This ability appears in your class’s talent trees; learning and use requirements still apply.';
}
