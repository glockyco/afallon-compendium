import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import { type CurrencyPurchaseRow, type EntityRef, isEntityRef, type PublicCurrency, type Ref } from "@afallon/contracts/public";
import { displayName } from "../text";
import { baseDocument, type DocumentProjectionInput, refName, type RelationIndexes } from "./projection";

/**
 * What merchants sell for a currency: one row for each item and price, with every merchant that sells the item at that
 * price. The currency's item page and the currency's page show the same rows.
 */
export function currencyPurchases(currencyKey: string, currency: Ref, indexes: RelationIndexes, input: DocumentProjectionInput): CurrencyPurchaseRow[] {
  const offers = new Map<string, { item: Ref; price: { amount: number; currency: Ref }; sellers: Map<string, Ref> }>();
  for (const row of indexes.vendorsByCurrency.get(currencyKey) ?? []) {
    const item = input.resolve(row.item), seller = input.resolve(row.npc);
    const itemKey = row.item.entityKey ?? row.item.label, sellerKey = row.npc.entityKey ?? row.npc.label;
    const amount = Math.max(0, row.cost), key = `${itemKey}:${amount}`;
    const offer = offers.get(key) ?? { item: isEntityRef(item) ? item : { ...item, label: displayName(item.label) }, price: { amount, currency }, sellers: new Map() };
    offer.sellers.set(sellerKey, isEntityRef(seller) ? seller : { ...seller, label: displayName(seller.label) });
    offers.set(key, offer);
  }
  return [...offers.values()].map(({ item, price, sellers }) => ({
    item, price, soldBy: [...sellers.values()].sort((a, b) => refName(a).localeCompare(refName(b))),
  })).sort((a, b) => refName(a.item).localeCompare(refName(b.item)) || a.price.amount - b.price.amount);
}

/**
 * A currency's page: the item that holds the currency, what merchants sell for it, the properties priced in it, and the
 * quests that reward it. A quest that rewards the currency's item is a source of that item and stays on the item's page.
 */
export function projectCurrency(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicCurrency {
  const key = entity.entityKey;
  const itemFact = input.facts.items.find((fact) => fact.currency?.entityKey === key && input.references.refs.has(fact.entityKey));
  const item = itemFact ? input.resolve({ entityKey: itemFact.entityKey, label: itemFact.entityKey }) : undefined;
  const properties = input.facts.properties.flatMap((fact) => {
    const property = input.references.refs.get(fact.entityKey);
    return fact.currency?.entityKey === key && property?.slug && fact.purchasePrice !== null && fact.purchasePrice >= 0
      ? [{ property, price: fact.purchasePrice }] : [];
  }).sort((a, b) => a.price - b.price || a.property.name.localeCompare(b.property.name));
  const rewards = new Map<string, { quest: Ref; amount: number; choice: boolean }>();
  for (const row of indexes.questsByCounterpart.get(key) ?? []) {
    if ((row.kind !== "reward" && row.kind !== "rewardChoice") || row.count === null || row.count <= 0) continue;
    const quest = input.resolve(row.quest), questKey = row.quest.entityKey ?? row.quest.label, choice = row.kind === "rewardChoice";
    rewards.set(`${questKey}:${row.count}:${choice}`, { quest, amount: row.count, choice });
  }
  return {
    ...baseDocument(entity, ref, input),
    ...(item ? { item } : {}),
    purchases: currencyPurchases(key, ref, indexes, input),
    properties,
    rewards: [...rewards.values()].sort((a, b) => refName(a.quest).localeCompare(refName(b.quest)) || a.amount - b.amount),
  };
}
