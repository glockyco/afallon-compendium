import type { PublicationData, PublicItemSummary } from '../../../pipeline/public-contracts';

export function resolvePublicationAssets(data: PublicationData, publicationUrl: string): PublicationData {
  const resolve = (asset: string) => new URL(asset, publicationUrl).toString();
  return {
    ...data,
    tileLayers: data.tileLayers.map((layer) => ({
      ...layer,
      tiles: layer.tiles.map((tile) => ({ ...tile, url: resolve(tile.url) }))
    })),
    illustrations: data.illustrations.map((illustration) => illustration.registration === 'calibrated'
      ? { ...illustration, layer: { ...illustration.layer, tiles: illustration.layer.tiles.map((tile) => ({ ...tile, url: resolve(tile.url) })) } }
      : { ...illustration, url: resolve(illustration.url) })
  };
}

export function findItem(data: PublicationData | null, itemKey: string | null): PublicItemSummary | null {
  if (!data || !itemKey) return null;
  return data.itemIndex.find((item) => item.itemKey === itemKey) ?? null;
}
