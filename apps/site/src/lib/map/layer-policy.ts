import type { PublicTileLayer } from "@afallon/contracts/public";

export const NO_IMAGERY_LAYER_ID = "none";

export function defaultLayerIds(tileLayers: readonly PublicTileLayer[]): string[] {
  return tileLayers.some((layer) => layer.kind === "game-map") ? ["game-maps"] : [NO_IMAGERY_LAYER_ID];
}

export function resolveLayerIds(requested: readonly string[], tileLayers: readonly PublicTileLayer[]): string[] {
  if (requested.length === 0) return defaultLayerIds(tileLayers);
  const known = new Set([NO_IMAGERY_LAYER_ID, "captured", "game-maps", ...tileLayers.map((layer) => layer.id)]);
  const valid = [...new Set(requested.filter((id) => known.has(id)))];
  if (valid.length === 0) return defaultLayerIds(tileLayers);
  const explicit = valid.filter((id) => id !== NO_IMAGERY_LAYER_ID);
  return explicit.length > 0 ? explicit : [NO_IMAGERY_LAYER_ID];
}

export function canonicalLayerIds(selected: readonly string[]): string[] {
  const explicit = [...new Set(selected.filter((id) => id !== NO_IMAGERY_LAYER_ID))];
  return explicit.length > 0 ? explicit : [NO_IMAGERY_LAYER_ID];
}
