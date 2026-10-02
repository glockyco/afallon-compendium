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
    overview: "You earn character levels with experience, mostly from kills and quests. Each skill also has its own level, which rises as you use it.",
    sections: [
      { id: "level-curve", title: "Level curve", lead: "Pick a level to see how much experience it takes and how far it is from the level cap." },
      { id: "kill-experience", title: "Kill experience", lead: "Creatures give experience when you kill them, based on their level and yours." },
      { id: "quest-experience", title: "Quest experience", lead: "Quests give experience as a reward, and some quest steps give experience along the way." },
      { id: "all-experience", title: "Experience bonuses", lead: "These bonuses apply to all character experience, from kills and quests alike." },
      { id: "skill-experience", title: "Skill experience", lead: "Each skill has its own level, and it rises when you use the skill." },
      { id: "talent-points", title: "Talent points", lead: "You gain talent points as your character levels up, and spend them in the talent trees of your class." },
    ],
  },
  "heroic-tier": {
    overview: "Heroic creatures give more experience when you kill them, and can give Heroic Essence. The Heroic tier also has settings for Heroic creatures, their affixes, and Heroic gear.",
    sections: [
      { id: "kill-experience", title: "Kill experience", lead: "Heroic creatures give more experience than normal ones." },
      { id: "essence", title: "Heroic Essence", lead: "Heroic creatures can also give Heroic Essence." },
      { id: "settings", title: "Creature and gear settings", lead: "These are the Heroic tier's values for creatures, affixes, and gear." },
    ],
  },
  "crafting-and-gathering": {
    overview: "Crafting turns materials into new items, and gathering collects items from nodes in the world. Both train skills.",
    sections: [
      { id: "crafting", title: "Crafting", lead: "A recipe can have several ranks, each with its own materials and products." },
      { id: "crafting-experience", title: "Crafting experience", lead: "Crafting is how you level up a crafting skill." },
      { id: "node-selection", title: "Node selection", lead: "Many gathering nodes appear at spawners, which can produce a different node each time. The tables show the most common spawners for each gathering skill." },
      { id: "node-availability", title: "Node availability", lead: "Nodes come back some time after you gather them." },
      { id: "node-rewards", title: "Node rewards", lead: "Gathering a node gives items, skill experience, and character experience." },
      { id: "attunement", title: "Attunement", lead: "Attunements make certain nodes appear more often while they are active." },
      { id: "skill-experience", title: "Skill experience", lead: "Different activities train different skills." },
    ],
  },
  corruption: {
    overview: "Corruption makes timed dungeons harder and their gear stronger. Use a Corruption Token at a dungeon's altar to raise its corruption level and add affixes.",
    sections: [
      { id: "altars", title: "Corruption altars", lead: "Each timed dungeon has an Altar of Corruption that raises the dungeon's corruption level. An altar works only once." },
      { id: "tokens", title: "Corruption Tokens", lead: "Every timed dungeon run ends with a reward bag that holds a Corruption Token. A token's tooltip shows how much corruption it adds, the stat bonuses that enemies get, and its affixes, which are never repeated." },
      { id: "enemies", title: "Corrupted enemies", lead: "Corruption makes the enemies of a timed dungeon stronger." },
      { id: "timed-dungeons", title: "Timed dungeons", lead: "Defeat every boss before the timer runs out. The reward token starts at the corruption level that the dungeon started with." },
      { id: "gear", title: "Corrupted gear", lead: "Gear from a corrupted reward bag carries the dungeon's corruption level, shown as Corruption +N on its tooltip." },
    ],
  },
  loot: {
    overview: "Besides creatures, vendors, quests, and crafting, items also come from bags, supply packs, cloth drops, objects in the world, quest pickups, and the Dungeon Finder. This page explains how each of these works.",
    sections: [
      { id: "chests", title: "Items that open a chest", lead: "Some items open a chest of loot when you use them. Each item's page lists what its chest can hold." },
      { id: "supply-packs", title: "Supply packs", lead: "Supply packs give a few items when you open them. The pack's page lists every possible item." },
      { id: "cloth", title: "Cloth from kills", lead: "Some creatures drop cloth on top of their normal loot. Each cloth's page shows its chance per kill by creature level." },
      { id: "world-objects", title: "World objects", lead: "Some objects in the world hold loot, such as graves and sacrificial altars." },
      { id: "quest-items", title: "Quest items", lead: "Some items only drop or appear while a quest needs them." },
      { id: "dungeon-finder", title: "Dungeon Finder", lead: "The Dungeon Finder sends you to a dungeon that you choose, or to a random one when you queue for a Random run." },
    ],
  },
  adventurers: {
    overview: "Adventurers appear in the world, take jobs while they are away, and can join your party through the Friends panel or the Dungeon Finder.",
    sections: [
      { id: "meeting-and-inviting", title: "Meeting and inviting", lead: "Find adventurers in the Friends panel, then invite them from your saved friends." },
      { id: "dungeon-finder-parties", title: "Dungeon Finder parties", lead: "The Dungeon Finder looks for adventurers who can complete your party." },
      { id: "roster", title: "Roster", lead: "Every adventurer of the world, with their class, party role, and when they join." },
      { id: "jobs-and-progress", title: "Jobs and progress", lead: "Adventurers work on their own progress while they are away." },
      { id: "gear-upgrades", title: "Gear upgrades", lead: "Adventurers improve their own equipment from a shared list of reward gear, and some also from a gear kit of their own." },
    ],
  },
  factions: {
    overview: "Every NPC belongs to a faction, and you have a standing with each faction. Your standing is a stance, such as Hated or Honored, and points toward the next stance.",
    sections: [
      { id: "standing-and-stances", title: "Standing and stances", lead: "Your standing with a faction is one of its stances, with points toward the next one." },
      { id: "new-character-standing", title: "Standing of a new character", lead: "The table shows the stance and points that a new character starts with toward each faction." },
      { id: "combat-relations", title: "Factions in combat", lead: "Your stance with a faction decides whether its NPCs count as allies, neutral, or enemies in combat." },
      { id: "changing-standing", title: "Changing standing", lead: "Creature kills, quests, and items can be set up to change your standing." },
      { id: "reputation-display", title: "Reputation panel", lead: "The Reputation panel of the character window lists the factions that are marked to appear there." },
    ],
  },
  "world-quests": {
    overview: "World Quests become available for a limited time in zones across the map. Enter an active zone to join one, complete its objectives, and collect its rewards.",
    sections: [
      { id: "availability", title: "Where And When They Appear", lead: "The times on each quest page belong to that quest. A zone may offer a different quest while this one waits." },
      { id: "participation", title: "Joining And Completing", lead: "Check each quest's page for its objectives and the zone where it starts." },
      { id: "rewards", title: "Rewards And Heroic Cache", lead: "Each quest page shows the captured rewards, before any changes to currency awarded in play." },
    ],
  },
};

/** Whether the guide of a topic has a section with this id. */
export function guideHasSection(topic: MechanicsTopic, section: string): boolean {
  return GUIDES[topic].sections.some((entry) => entry.id === section);
}

/**
 * The sections of a guide with their rules, in guide order. Each rule names its section, and keeps the order of `rules`.
 * A rule of an undefined section is an error, because no section would show it. A section that its lead explains in
 * full has no rules.
 */
export function guideSections(topic: MechanicsTopic, rules: readonly { section: string; rule: MechanicsRule }[]): GuideSection[] {
  for (const { section, rule } of rules) {
    if (!guideHasSection(topic, section)) throw new Error(`Rule ${rule.id} names section ${section}, which guide ${topic} does not define.`);
  }
  return GUIDES[topic].sections.map((section) => {
    return { ...section, rules: rules.filter((entry) => entry.section === section.id).map((entry) => entry.rule) };
  });
}
