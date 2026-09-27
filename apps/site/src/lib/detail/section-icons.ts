import { Archive, BookOpen, Crown, Flag, Gift, Globe, GraduationCap, Hammer, Hand, House, Landmark, Layers, ListOrdered, LockOpen, Map as MapIcon, MapPin, Package, PawPrint, Pickaxe, Route, ScrollText, ShoppingBag, Signpost, Sparkles, Swords, Target, Users, Zap, type IconNode } from 'lucide';
import { iconNodeToSvg } from '../icon-svg';

// One glyph for each kind of section content, so a reader recognizes a section before reading its title.
const SECTION_ICONS = {
  ability: Zap, area: MapIcon, boss: Crown, beast: PawPrint, chain: ListOrdered, container: Archive, creature: Swords, gather: Pickaxe,
  landmark: Landmark, location: MapPin, loot: Package, object: Hand, objective: Target, people: Users, property: House,
  quest: ScrollText, recipe: Hammer, reward: Gift, route: Route, sign: Signpost, start: Flag, talent: Sparkles, teach: GraduationCap,
  text: BookOpen, unlock: LockOpen, variants: Layers, vendor: ShoppingBag, world: Globe,
} as const satisfies Record<string, IconNode>;

export type SectionIcon = keyof typeof SECTION_ICONS;

export function sectionIconSvg(icon: SectionIcon): string {
  return iconNodeToSvg(SECTION_ICONS[icon], 'currentColor');
}
