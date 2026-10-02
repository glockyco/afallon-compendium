import { Anvil, BookOpen, Coins, Compass, Flag, Gem, Hammer, House, Map, PawPrint, Package, Pickaxe, Shield, Shirt, ScrollText, Sparkles, Star, Sword, User, Users, Wrench, Zap, type IconNode } from 'lucide';
import { iconNodeToSvg } from './icon-svg';

// The registry names a glyph per kind. An entity whose artwork the build never captured shows its
// kind glyph, so an absent icon reads as the kind rather than as a broken image.
const KIND_ICONS: Record<string, IconNode> = {
  item: Sword,
  npc: User,
  quest: ScrollText,
  place: Map,
  'world-map': Compass,
  property: House,
  ability: Zap,
  recipe: Hammer,
  'gear-set': Shirt,
  currency: Coins,
  stat: Star,
  faction: Flag,
  skill: Wrench,
  class: Shield,
  race: Users,
  enchantment: Sparkles,
  effect: Sparkles,
  species: PawPrint,
  'loot-table': Package,
  'crafting-station': Anvil,
  gem: Gem,
  guide: BookOpen,
  'gathering-node': Pickaxe,
};

/**
 * The kinds whose links read as part of the text around them: no icon, the colour of that text, and a dotted
 * underline. A stat is the noun of an amount such as "+15 Armor", so a framed glyph and an accent colour would outweigh
 * the number that matters.
 */
const PLAIN_KINDS: ReadonlySet<string> = new Set(['stats']);

export function plainKind(kind: string | undefined): boolean {
  return kind !== undefined && PLAIN_KINDS.has(kind);
}

export function kindGlyphSvg(icon: string | undefined): string | undefined {
  const node = icon ? KIND_ICONS[icon] : undefined;
  return node ? iconNodeToSvg(node, 'currentColor') : undefined;
}
