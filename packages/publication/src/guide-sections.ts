import type { MechanicsTopic } from "@afallon/contracts/catalog";
import type { GuideSection, MechanicsRule } from "@afallon/contracts/public";

/** The reader text of one guide section. The rules of the section come from the rules record. */
export interface GuideSectionText { id: string; title: string; lead: string }

/** The reader text of one guide: its overview and its sections in reading order. */
export interface GuideText { overview: string; sections: GuideSectionText[] }

// A section covers one mechanic or one context of its topic. Its id is the `section` of its rules in the rules record,
// and the Corruption rules of `mechanics.ts`. A lead says where the mechanic applies and does not repeat its rules.
export const GUIDES: Record<MechanicsTopic, GuideText> = {
  "character-progression": {
    overview: "Your character and each of your skills level up separately. The level curve shows how much experience each level needs.",
    sections: [
      { id: "level-curve", title: "Level curve", lead: "Experience fills your current level. Reaching the amount on the curve raises your level." },
      { id: "kill-experience", title: "Kill experience", lead: "Creatures with an experience range give experience when they die." },
      { id: "quest-experience", title: "Quest experience", lead: "Quests give experience as rewards and from some of their steps." },
      { id: "all-experience", title: "Experience bonuses", lead: "Bonuses change every gain of character experience, from kills and from quests." },
      { id: "skill-experience", title: "Skill experience", lead: "Each skill has its own level and gains experience from the actions that use it." },
      { id: "talent-points", title: "Talent points", lead: "Each character level gives talent points to spend in the talent trees of your class." },
    ],
  },
  "heroic-tier": {
    overview: "Heroic creatures give more kill experience and can give Heroic Essence. The Heroic tier also has settings for creatures, affixes, and gear.",
    sections: [
      { id: "kill-experience", title: "Kill experience", lead: "Heroic creatures give more experience when they die." },
      { id: "essence", title: "Heroic Essence", lead: "Heroic creatures can give Heroic Essence when they die." },
      { id: "settings", title: "Creature and gear settings", lead: "The Heroic tier stores these values for Heroic creatures, their affixes, and Heroic gear." },
    ],
  },
  "crafting-and-gathering": {
    overview: "Crafting turns materials into products, and gathering takes items from nodes in the world. Both train skills.",
    sections: [
      { id: "crafting", title: "Crafting", lead: "A recipe rank names its materials, its products, and the crafting skill level that it needs." },
      { id: "crafting-experience", title: "Crafting experience", lead: "Each recipe rank sets a base amount of crafting experience." },
      { id: "node-selection", title: "Node selection", lead: "Many gathering nodes appear at spawners in the world. The examples show the most common spawners of each gathering skill." },
      { id: "node-availability", title: "Node availability", lead: "Spawners and the nodes placed in the world follow different timers." },
      { id: "node-rewards", title: "Node rewards", lead: "Gathering a node gives items, skill experience, and character experience." },
      { id: "attunement", title: "Attunement", lead: "An active attunement makes some nodes appear more often." },
      { id: "skill-experience", title: "Skill experience", lead: "Weapons, crafting, gathering, and enchanting train different skills." },
    ],
  },
  corruption: {
    overview: "Corruption makes timed dungeons harder and can strengthen equipment found there. Use a Corruption Token at an altar to add levels and affixes.",
    sections: [
      { id: "altars", title: "Corruption altars", lead: "Each timed dungeon has an Altar of Corruption." },
      { id: "tokens", title: "Corruption Tokens", lead: "A saved token's tooltip shows its altar value, enemy bonuses, and affixes." },
      { id: "enemies", title: "Corrupted enemies", lead: "Corruption makes the enemies of a timed dungeon stronger." },
      { id: "timed-dungeons", title: "Timed dungeons", lead: "Defeat all bosses before the timer ends." },
      { id: "gear", title: "Corrupted gear", lead: "Equippable items from a corrupted reward bag carry the dungeon's corruption level." },
    ],
  },
  loot: {
    overview: "Items come from creatures, vendors, quests, and crafting, and also from the sources on this page. Each of these sources follows its own rules.",
    sections: [
      { id: "chests", title: "Items that open a chest", lead: "Some items, such as bags, open a chest of loot when you use them. The item page lists the chest's contents and chances." },
      { id: "supply-packs", title: "Supply packs", lead: "A supply pack gives a few items when you open it. Its item page shows the items for each class and level." },
      { id: "cloth", title: "Cloth from kills", lead: "Some creatures drop cloth besides their own loot. Each cloth's item page shows its chance per kill by creature level." },
      { id: "world-objects", title: "World objects", lead: "Some objects in the world, such as graves and sacrificial altars, hold loot." },
      { id: "quest-items", title: "Quest items", lead: "Some items drop or lie in the world only while a quest needs them." },
      { id: "dungeon-finder", title: "Dungeon Finder", lead: "The Dungeon Finder sends you to a dungeon and rewards a finished run." },
    ],
  },
};

/** Whether the guide of a topic has a section with this id. */
export function guideHasSection(topic: MechanicsTopic, section: string): boolean {
  return GUIDES[topic].sections.some((entry) => entry.id === section);
}

/**
 * The sections of a guide with their rules, in guide order. Each rule names its section, and keeps the order of `rules`.
 * A rule of an undefined section and a section without a rule are errors, because no section would show that rule, or
 * a section would explain nothing.
 */
export function guideSections(topic: MechanicsTopic, rules: readonly { section: string; rule: MechanicsRule }[]): GuideSection[] {
  for (const { section, rule } of rules) {
    if (!guideHasSection(topic, section)) throw new Error(`Rule ${rule.id} names section ${section}, which guide ${topic} does not define.`);
  }
  return GUIDES[topic].sections.map((section) => {
    const sectionRules = rules.filter((entry) => entry.section === section.id).map((entry) => entry.rule);
    if (sectionRules.length === 0) throw new Error(`Guide ${topic} section ${section.id} has no rule.`);
    return { ...section, rules: sectionRules };
  });
}
