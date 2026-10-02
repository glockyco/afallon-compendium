import type { CurrencyPurchaseRow } from '@afallon/contracts/public';

/** Merchants shared by every offer, regardless of order in the merchant stock. */
export function sharedPurchaseSellers(rows: CurrencyPurchaseRow[]): CurrencyPurchaseRow['soldBy'] {
  const first = rows[0]?.soldBy;
  if (!first?.length || !rows.every((row) => row.soldBy.length === first.length
    && row.soldBy.every((seller) => first.some((candidate) => candidate.key === seller.key)))) return [];
  return first;
}
