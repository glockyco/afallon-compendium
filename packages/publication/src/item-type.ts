import type { CatalogItemFacts } from "@afallon/contracts/catalog";
import { categoryLabel, type PublicItem } from "@afallon/contracts/public";
import { plainText } from "./text";

type ItemKind = Pick<PublicItem["facts"], "itemType" | "slot" | "armorType" | "weaponType" | "weaponSlot">;

/**
 * The facts that say what an item is. Armor, and a trinket in the trinket slot, has an armor type and slot. A weapon has
 * a weapon type and slot. The catalog keeps leftover values of the other kind, which do not apply.
 */
export function itemKind(fact: CatalogItemFacts | undefined): ItemKind {
  const isArmor = fact?.itemType === "ARMOR" || (fact?.itemType === "Trinket" && fact.armorSlot === "Trinket");
  const isWeapon = fact?.itemType === "WEAPON";
  return {
    ...(fact?.itemType ? { itemType: plainText(fact.itemType) } : {}),
    ...(isArmor && fact?.armorSlot ? { slot: plainText(fact.armorSlot) } : {}), ...(isArmor && fact?.armorType ? { armorType: plainText(fact.armorType) } : {}),
    ...(isWeapon && fact?.weaponType ? { weaponType: plainText(fact.weaponType) } : {}), ...(isWeapon && fact?.weaponSlot ? { weaponSlot: plainText(fact.weaponSlot) } : {}),
  };
}

/**
 * What an item is, from its most specific facts: the weapon type, the slot of jewelry, the armor type with its slot, or
 * the item type. A weapon type already names its hands, so the slot is left out.
 */
export function itemTypeLabel(facts: ItemKind): string | null {
  if (facts.weaponType) return categoryLabel(facts.weaponType);
  if (facts.armorType && facts.slot) return facts.armorType === "JEWELRY" ? categoryLabel(facts.slot) : `${categoryLabel(facts.armorType)} ${categoryLabel(facts.slot)}`;
  return facts.itemType ? categoryLabel(facts.itemType) : null;
}
