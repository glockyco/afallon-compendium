import type { MechanicsTopic } from "@afallon/contracts/catalog";
import type { GuideSection, MechanicsRule } from "@afallon/contracts/public";

/** The reader text of one guide section. The rules of the section come from the rules record. */
export interface GuideSectionText { id: string; title: string; lead: string; how?: string }

/** The reader text of one guide: its overview and its sections in reading order. */
export interface GuideText { overview: string; sections: GuideSectionText[] }

// Every topic declared by the catalog must have reader text here. A section covers one mechanic or one context of its
// topic. Its id is the `section` of its rules in the rules record, and the Corruption rules of `mechanics.ts`.
// A lead says where the mechanic applies and does not repeat its rules.
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
    overview: "The Heroic tier makes the open world harder for a character who turns it on.",
    sections: [
      { id: "entering", title: "Turning it on and off", lead: "", how: "How the Heroic Tier turns on and off" },
      { id: "empowered-creatures", title: "Heroic creatures", lead: "Heroic creatures are much tougher than usual, and they keep pace with your gear." },
      { id: "affixes", title: "Affixes", lead: "A Heroic creature can carry affixes, extra powers that make it more dangerous and its loot more plentiful.", how: "How Heroic affixes work" },
      { id: "kill-experience", title: "Kill experience", lead: "A Heroic kill gives more experience. Quest experience does not change." },
      { id: "essence", title: "Heroic Essence", lead: "Earn Heroic Essence from Heroic kills. Creature rank, affixes, and the creature's health compared with yours affect the amount." },
      { id: "currency", title: "Currency", lead: "Bosses and World Quests pay more currency." },
      { id: "heroic-gear", title: "Heroic gear", lead: "Heroic gear carries a bonus to its fixed stats and weapon damage." },
    ],
  },
  "crafting-and-gathering": {
    overview: "Crafting turns materials into new items, and gathering collects items from nodes in the world. Both train skills.",
    sections: [
      { id: "crafting", title: "Recipes", lead: "A recipe can have several ranks, each with its own materials and products." },
      { id: "enchanting", title: "Enchanting", lead: "Apply an enchanting item to matching gear to add its stats." },
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
    overview: "Loot comes from creatures, quests, vendors, crafting, containers, and other objects in the world. See an item's page for its rewards and sources.",
    sections: [
      { id: "creature-drops", title: "Creature Drops", lead: "Only a player or party that earns a creature's kill rewards can get items from its own tables and eligible World Loot tables." },
      { id: "chests", title: "Items that open a chest", lead: "Use a bag to open its chest of possible loot. The item's page shows what can be inside." },
      { id: "supply-packs", title: "Supply packs", lead: "Open a supply pack to get items from the table for your class and level. The pack's page shows what you can get and how to obtain the pack. The details of each pick are below." },
      { id: "cloth", title: "Cloth from kills", lead: "Some creatures drop cloth on top of their normal loot. Each cloth's page shows base rates before loot bonuses by creature level." },
      { id: "world-objects", title: "World objects", lead: "Some objects in the world hold loot, such as graves and sacrificial altars." },
      { id: "quest-items", title: "Quest items", lead: "Some items only drop or appear while a quest needs them." },
      { id: "dungeon-finder", title: "Dungeon Finder", lead: "The Dungeon Finder sends you to a dungeon that you choose, or to a random one when you queue for a Random run." },
    ],
  },
  adventurers: {
    overview: "Adventurers can join your party or pursue their own progress while away. This guide covers meeting them, their roles, and their gear.",
    sections: [
      { id: "meeting-and-inviting", title: "Meeting and inviting", lead: "" },
      { id: "dungeon-finder-parties", title: "Dungeon Finder parties", lead: "The Dungeon Finder looks for adventurers who can complete your party." },
      { id: "roster", title: "Roster", lead: "Every adventurer of the world, with their class, party role, and when they join." },
      { id: "jobs-and-progress", title: "Jobs and progress", lead: "Adventurers work on their own progress while they are away." },
      { id: "gear-upgrades", title: "Gear upgrades", lead: "Adventurers improve their own equipment from a shared list of reward gear, and some also from a gear kit of their own." },
    ],
  },
  factions: {
    overview: "Your faction standing affects how NPCs treat you. This guide covers stances and ways to change your standing.",
    sections: [
      { id: "standing-and-stances", title: "Standing and stances", lead: "" },
      { id: "new-character-standing", title: "Standing of a new character", lead: "The table shows the stance and points that a new character starts with toward each faction." },
      { id: "combat-relations", title: "Factions in combat", lead: "Your stance with a faction decides whether its NPCs count as allies, neutral, or enemies in combat." },
      { id: "changing-standing", title: "Changing standing", lead: "Creature kills, quests, and items can be set up to change your standing." },
      { id: "reputation-display", title: "Reputation panel", lead: "The Reputation panel of the character window lists the factions that are marked to appear there." },
    ],
  },
  "world-quests": {
    overview: "World Quests offer time-limited objectives and rewards in zones across the map.",
    sections: [
      { id: "availability", title: "Where and when they appear", lead: "Quest pages show each World Quest's zone and duration." },
      { id: "participation", title: "Joining and completing", lead: "" },
      { id: "rewards", title: "Rewards and Heroic Cache", lead: "" },
    ],
  },
  travel: {
    overview: "Flight masters connect stops across the map. Use the networks below to plan a journey.",
    sections: [
      { id: "finding-flights", title: "Finding flights", lead: "" },
      { id: "taking-flight", title: "Taking a flight", lead: "" },
      { id: "network", title: "Flight network", lead: "Each stop has a flight master. Direct routes show where flights can connect." },
    ],
  },
  combat: {
    overview: "Your stats shape your attacks, defenses, and recovery. Abilities and equipment can also apply effects that deal damage, restore health, or change stats.",
    sections: [
      { id: "building-stats", title: "Building your stats", lead: "Equipment, gems, talents, and gear set bonuses can raise your stats. Flat and percentage bonuses combine differently, and gear sets unlock tiers when you equip distinct pieces." },
      { id: "recovery", title: "Health and resource recovery", lead: "Health, Mana, Energy, and Endurance each have their own recovery amounts and intervals, in or out of combat. See the values below for each resource." },
      { id: "damage-and-defense", title: "Damage and defense", lead: "Armor and matching resistance reduce damage. Armor penetration and matching resistance penetration weaken those defenses." },
      { id: "critical-hits", title: "Critical hits", lead: "Critical Hit Chance is a rating, not a flat percentage. Your level and the target's defense and level affect the chance to land a critical hit." },
      { id: "on-hit-effects", title: "On-hit effects", lead: "Eligible hits can trigger effects from on-hit stats. Each stat has a chance and cooldown, and its linked effects may also have their own chance." },
      { id: "effects", title: "Effects", lead: "Timed effects can change stats or deal damage and healing in pulses. Requirements can check whether an effect is active." },
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
  return GUIDES[topic].sections.filter(({ id }) => id !== "creature-drops" || rules.some((entry) => entry.section === id)).map(({ id, title, lead }) => ({
    id, title, lead,
    rules: rules.filter((entry) => entry.section === id).map((entry) => entry.rule),
  }));
}
