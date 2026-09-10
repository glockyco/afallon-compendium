import type { PublicationData, PublicItemSource } from '../../../pipeline/public-contracts';

export function resolvePublicationAssets(data: PublicationData, publicationUrl: string): PublicationData {
  const resolve = (asset: string) => new URL(asset, publicationUrl).toString();
  return {
    ...data,
    tileLayers: data.tileLayers.map((layer) => ({
      ...layer,
      tiles: layer.tiles.map((tile) => ({ ...tile, url: resolve(tile.url) }))
    })),
    illustrations: data.illustrations.map((illustration) => ({ ...illustration, url: resolve(illustration.url) }))
  };
}


export function findItem(data: PublicationData | null, itemKey: string | null): PublicItemSource | null {
  if (!data || !itemKey) return null;
  return data.itemSources.find((item) => item.itemKey === itemKey) ?? null;
}
