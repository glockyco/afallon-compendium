import type { ArtRef, StaticDocument } from '@afallon/contracts/public';
import { levelText } from './format';

export const SITE_ORIGIN = 'https://afallon.compendiums.org';
export const STEAM_URL = 'https://store.steampowered.com/app/2597810/Afallon/';
export const STEAM_GUIDE_URL = 'https://steamcommunity.com/sharedfiles/filedetails/?id=3800843227';
export const UNOFFICIAL_NOTICE = 'Unofficial fan project, not affiliated with the developer or publisher of Afallon.';

export function absolutePageUrl(pathname: string): string {
  return `${SITE_ORIGIN}${pathname.endsWith('/') ? pathname : `${pathname}/`}`;
}

/** JSON is emitted as script contents, not an HTML-escaped text node. Escape markup delimiters in published names. */
export function jsonLdScript(value: object): string {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;
}

/** Keep the answer intact where possible, ending at a word boundary rather than midword. */
export function briefDescription(text: string, limit = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const short = clean.slice(0, limit);
  if (clean[limit] === ' ') return short;
  const end = short.lastIndexOf(' ');
  return end > 0 ? `${short.slice(0, end).replace(/[\s,;:.]+$/, '')}…` : 'Explore Afallon in the compendium.';
}

const largeEnoughForSharing = (image: ArtRef | undefined): image is ArtRef =>
  Boolean(image && image.width >= 200 && image.height >= 200);

/** Use an entity's own shareable art rather than stretching its smaller UI icons. */
export function entitySocialArt(page: StaticDocument): ArtRef | undefined {
  const { art, ref } = page.document;
  if (largeEnoughForSharing(art.artwork)) return art.artwork;
  if (largeEnoughForSharing(art.portrait)) return art.portrait;
  if (largeEnoughForSharing(ref.portrait)) return ref.portrait;
  if (largeEnoughForSharing(art.icon)) return art.icon;
  return largeEnoughForSharing(ref.icon) ? ref.icon : undefined;
}

export function entityDescription(page: StaticDocument): string {
  const document = page.document;
  const name = document.ref.name;
  if (page.kind === 'items') {
    const item = page.document;
    const type = item.facts.weaponType ?? item.facts.armorType ?? item.facts.itemType?.toLowerCase() ?? 'item';
    const identity = `${name} is ${/^[aeiou]/i.test(item.facts.rarity ?? type) ? 'an' : 'a'} ${[item.facts.rarity, type].filter(Boolean).join(' ').toLowerCase()} in Afallon.`;
    const drop = item.droppedBy[0];
    const source = item.inContainers[0]?.label ?? item.collectedFrom[0]?.label;
    const dropSource = drop && ('name' in drop.counterpart ? drop.counterpart.name : drop.counterpart.label);
    const worldDrop = dropSource === 'Any creature'
      ? drop?.creatureLevel && (drop.creatureLevel.min > 1 || drop.creatureLevel.max !== undefined)
        ? `level ${levelText(drop.creatureLevel)} creatures` : 'creatures'
      : drop ? `${drop.creatureLevel && (drop.creatureLevel.min > 1 || drop.creatureLevel.max !== undefined) ? `level ${levelText(drop.creatureLevel)} ` : ''}${dropSource}` : '';
    const next = source
      ? ` Find it in ${source}${worldDrop ? ` or from ${worldDrop}` : ''}.`
      : worldDrop ? ` Dropped by ${worldDrop}.`
      : item.soldBy[0] ? ` Sold by ${'name' in item.soldBy[0].counterpart ? item.soldBy[0].counterpart.name : item.soldBy[0].counterpart.label}.`
      : item.crafting ? ' Find its crafting recipe here.' : '';
    return briefDescription(`${identity}${next} Read more in the Afallon Compendium wiki.`);
  }
  if (page.kind === 'npcs') {
    const npc = page.document;
    const kind = npc.facts.npcType?.toLowerCase() === 'mob'
      ? `${npc.facts.creatureType ? `${npc.facts.creatureType.toLowerCase()} ` : ''}creature`
      : npc.facts.npcType?.toLowerCase() === 'npc'
        ? npc.facts.roles.includes('merchant') ? 'merchant' : 'character'
        : (npc.facts.npcType ?? npc.facts.creatureType ?? 'character').toLowerCase();
    const level = npc.facts.level && !npc.facts.level.scales ? `, level ${levelText(npc.facts.level)}` : '';
    const place = npc.locations[0]?.label ?? npc.places[0]?.label;
    const scaling = npc.facts.level?.scales ? ` Levels ${levelText(npc.facts.level)} scale with the player.` : '';
    return briefDescription(`${name} is ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind}${level} in Afallon.${place ? ` Find ${name} in ${place}.` : ''}${scaling} Read more in the Afallon Compendium wiki.`);
  }
  const description = document.description?.replace(/\s+/g, ' ').trim();
  return briefDescription(`${description ? `${description} ` : `Explore ${name} in Afallon. `}Read more in the Afallon Compendium wiki.`);
}
