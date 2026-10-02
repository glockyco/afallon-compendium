import { categoryLabel, type PublicItem } from "@afallon/contracts/public";

/**
 * What an item is, from its most specific facts: the weapon type, the slot of jewelry, the armor type with its slot, or
 * the item type. A weapon type already names its hands, so the slot is left out.
 */
export function itemTypeLabel(facts: PublicItem["facts"]): string | null {
  if (facts.weaponType) return categoryLabel(facts.weaponType);
  if (facts.armorType && facts.slot) return facts.armorType === "JEWELRY" ? categoryLabel(facts.slot) : `${categoryLabel(facts.armorType)} ${categoryLabel(facts.slot)}`;
  return facts.itemType ? categoryLabel(facts.itemType) : null;
}
