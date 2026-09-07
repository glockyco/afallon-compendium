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

type RoleStyle = { symbol: string; color: [number, number, number]; hint: string };
export const ROLE_STYLES: Record<string, RoleStyle> = {
  merchant: { symbol: 'V', color: [35, 104, 176], hint: 'Merchants and stock' },
  questGiver: { symbol: 'Q', color: [138, 75, 150], hint: 'Quest offers and rewards' },
  questLocation: { symbol: 'Q', color: [138, 75, 150], hint: 'World quest locations' },
  craftingService: { symbol: 'S', color: [35, 104, 176], hint: 'Crafting stations and recipes' },
  propertyPurchaseService: { symbol: 'S', color: [35, 104, 176], hint: 'Property purchase locations' },
  service: { symbol: 'S', color: [35, 104, 176], hint: 'Authored service locations' },
  resourceProducer: { symbol: 'R', color: [35, 125, 74], hint: 'Gathering areas and possible outputs' },
  container: { symbol: 'C', color: [154, 99, 26], hint: 'Containers and possible contents' },
  enemy: { symbol: 'E', color: [183, 60, 52], hint: 'Enemies and possible loot' },
  transition: { symbol: 'T', color: [35, 112, 116], hint: 'Entrances and scene destinations' },
  usefulInteraction: { symbol: 'I', color: [35, 112, 116], hint: 'Useful world interactions' },
  adventurerProducer: { symbol: 'A', color: [112, 112, 112], hint: 'Possible adventurer spawn areas' },
  combatant: { symbol: 'N', color: [112, 112, 112], hint: 'NPCs with combat behavior' },
  friendly: { symbol: 'N', color: [112, 112, 112], hint: 'Friendly NPC disposition' },
  neutral: { symbol: 'N', color: [112, 112, 112], hint: 'Neutral NPC disposition' },
  npc: { symbol: 'N', color: [112, 112, 112], hint: 'Authored NPC placements' }
};
export const ROLE_ORDER = Object.keys(ROLE_STYLES);
const OTHER_ROLE: RoleStyle = { symbol: 'P', color: [95, 95, 95], hint: 'Other authored placement role' };

export function placementStyle(roles: readonly string[]): RoleStyle {
  const role = ROLE_ORDER.find((candidate) => roles.includes(candidate));
  return role ? ROLE_STYLES[role]! : OTHER_ROLE;
}

export function roleLabel(role: string): string {
  const normalized = role.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_-]+/g, ' ');
  const labels: Record<string, string> = {
    npc: 'NPC',
    spawn: 'Spawn area',
    fixed: 'Fixed point',
    uncertain: 'Uncertain location'
  };
  return labels[normalized] ?? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function displayValue(value: string): string {
  return value.trim() || 'Not supplied';
}

export function findItem(data: PublicationData | null, itemKey: string | null): PublicItemSource | null {
  if (!data || !itemKey) return null;
  return data.itemSources.find((item) => item.itemKey === itemKey) ?? null;
}
