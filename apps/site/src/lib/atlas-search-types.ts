import type { PublicPlacement, PublicSearchEntry } from '@afallon/contracts/public';
import type { MarkerDefinition } from './map/marker-registry';

export type SearchResult = { key: string; name: string; rank: number } & (
  | { kind: 'entry'; entry: PublicSearchEntry }
  | { kind: 'placement'; placement: PublicPlacement }
);

export interface ResultSummary {
  marker: MarkerDefinition;
  categories: string;
}
