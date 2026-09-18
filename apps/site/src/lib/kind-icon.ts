import { Anvil, BookOpen, Coins, Flag, Gem, Hammer, House, Map, PawPrint, Package, Shield, Shirt, ScrollText, Sparkles, Star, Sword, User, Users, Wrench, Zap, type IconNode } from 'lucide';
import { iconNodeToSvg } from './map/icon-atlas';

// The registry names a glyph per kind. An entity whose artwork the build never captured shows its
// kind glyph, so an absent icon reads as the kind rather than as a broken image.
const KIND_ICONS: Record<string, IconNode> = {
  item: Sword,
  npc: User,
  quest: ScrollText,
  place: Map,
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
};

export function kindGlyphSvg(icon: string | undefined): string | undefined {
  const node = icon ? KIND_ICONS[icon] : undefined;
  return node ? iconNodeToSvg(node, 'currentColor') : undefined;
}
