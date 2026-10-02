import type { MechanicsTopic } from "@afallon/contracts/catalog";
import type { GuideSection, MechanicsRule } from "@afallon/contracts/public";

/** The reader text of one guide section. The rules of the section come from the rules record. */
export interface GuideSectionText { id: string; title: string; lead: string }

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
    overview: "Heroic creatures give more experience when you kill them and can give Heroic Essence. Heroic gear from creature drops gains a bonus, while affixes and creature strength depend on the Heroic tier's settings.",
    sections: [
      { id: "kill-experience", title: "Kill experience", lead: "A Heroic creature increases experience from a kill, not the experience from a quest." },
      { id: "essence", title: "Heroic Essence", lead: "Earn Heroic Essence from eligible Heroic kills. Creature rank, affixes, and a bounded comparison with your character affect the amount. Fractions carry over to later kills." },
      { id: "heroic-gear", title: "Heroic gear", lead: "Equipment dropped by creatures during the Heroic tier can gain a Heroic bonus. Chests, crafting, and quest rewards do not use this drop bonus." },
      { id: "settings", title: "Creature and gear settings", lead: "Affix odds, creature strength, and gear bonuses depend on these settings." },
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
    overview: "Items can come from bags, supply packs, cloth drops, objects in the world, quest pickups, and the Dungeon Finder, as well as creatures, vendors, quests, and crafting. See each item's page for its rewards and sources.",
    sections: [
      { id: "chests", title: "Items that open a chest", lead: "Use a bag to open its chest of possible loot. The item's page shows what can be inside." },
      { id: "supply-packs", title: "Supply packs", lead: "Open a supply pack to get items from the table for your class and level. The pack's page shows what you can get and how to obtain the pack. The details of each pick are below." },
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
    overview: "Every NPC belongs to a faction, and you have a standing with each faction. Your standing is one of the faction's stances, such as Hated, Neutral, or Honored. Each stance fills up with points, and a full stance moves you to the next one.",
    sections: [
      { id: "standing-and-stances", title: "Standing and stances", lead: "Points move your standing up and down through a faction's stances." },
      { id: "new-character-standing", title: "Standing of a new character", lead: "The table shows the stance and points that a new character starts with toward each faction." },
      { id: "combat-relations", title: "Factions in combat", lead: "Your stance with a faction decides whether its NPCs count as allies, neutral, or enemies in combat." },
      { id: "changing-standing", title: "Changing standing", lead: "Creature kills, quests, and items can be set up to change your standing." },
      { id: "reputation-display", title: "Reputation panel", lead: "The Reputation panel of the character window lists the factions that are marked to appear there." },
    ],
  },
  "world-quests": {
    overview: "World Quests become available for a limited time in zones across the map. Enter an active zone to join one, complete its objectives, and collect its rewards.",
    sections: [
      { id: "availability", title: "Where and when they appear", lead: "A World Quest can become active in its zone for a limited time. Quest pages show where each one takes place and how long it lasts." },
      { id: "participation", title: "Joining and completing", lead: "Enter an active quest's zone to join it. See each quest's page for its objectives and starting area." },
      { id: "rewards", title: "Rewards and Heroic Cache", lead: "Each quest page shows the rewards you can earn. During the Heroic tier, Heroic Cache can increase its currency reward." },
    ],
  },
  travel: {
    overview: "Talk to a flight master to discover stops and fly to other stops in the same network. The connections below show which journeys are available.",
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

// These research-only Heroic questions have no player action or result and no placements from an entity page.
const HEROIC_RESEARCH_NOTES: Record<string, true> = { "essence-health-stat": true, "affix-count-source": true, "settings-behavior-unverified": true };

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
  return GUIDES[topic].sections.map((section) => ({
    ...section,
    rules: rules.filter((entry) => entry.section === section.id
      && !(topic === "heroic-tier" && entry.rule.status === "unknown" && HEROIC_RESEARCH_NOTES[entry.rule.id]))
      .map((entry) => entry.rule),
  }));
}
