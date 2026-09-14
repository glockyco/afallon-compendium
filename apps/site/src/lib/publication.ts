import type { PublicationData, PublicItemSummary } from '@afallon/contracts/public';

export function resolvePublicationAssets(data: PublicationData, publicationUrl: string): PublicationData {
  const resolve = (asset: string) => new URL(asset, publicationUrl).toString();
  return {
    ...data,
    tileLayers: data.tileLayers.map((layer) => ({
      ...layer,
      tiles: layer.tiles.map((tile) => ({ ...tile, url: resolve(tile.url) }))
    }))
  };
}

export function findItem(data: PublicationData | null, itemKey: string | null): PublicItemSummary | null {
  if (!data || !itemKey) return null;
  return data.itemIndex.find((item) => item.itemKey === itemKey) ?? null;
}
