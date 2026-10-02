import type { MechanicsTopic } from "@afallon/contracts/catalog";
import type { GuideStep } from "@afallon/contracts/public";

export const GUIDES: Record<MechanicsTopic, { overview: string; steps: GuideStep[] }> = {
  "character-progression": {
    overview: "Your character and each of your skills level up separately. The level curve shows how much experience each level needs.",
    steps: [
      { id: "roll-kill-experience", title: "Roll kill experience", text: "The creature's experience range and level set the starting amount.", rules: ["kill-base-roll"] },
      { id: "adjust-the-kill", title: "Adjust the kill", text: "Your level, the creature's Heroic status, and your followers change the amount.", rules: ["kill-level-difference", "kill-heroic-multiplier", "kill-companion-split", "kill-game-modifiers"] },
      { id: "scale-quest-experience", title: "Scale quest experience", text: "Quests give experience as rewards and from their steps.", rules: ["quest-reward-level-scale", "quest-action-amount", "quest-reward-skip-flag", "quest-no-heroic-multiplier"] },
      { id: "apply-experience-bonuses", title: "Apply experience bonuses", text: "Bonuses and world modifiers then change every gain.", rules: ["experience-bonus-stat", "world-modifier-multiplier"] },
      { id: "level-up", title: "Level up", text: "Reaching the experience that a level needs raises your level.", rules: ["surplus-experience-carries", "level-cap-stops-experience"] },
      { id: "gain-skill-experience", title: "Gain skill experience", text: "Your actions train the skills that they use.", rules: ["skill-award-sources", "skill-award-modifiers"] },
      { id: "gain-talent-points", title: "Gain talent points", text: "Each character level gives talent points.", rules: ["talent-point-modifiers"] },
    ],
  },
  "heroic-tier": {
    overview: "Heroic creatures give more kill experience and can give Heroic Essence. The settings below also describe Heroic creatures and gear.",
    steps: [
      { id: "multiply-kill-experience", title: "Multiply kill experience", text: "The kill experience multiplier is one of the settings below.", rules: ["heroic-kill-experience"] },
      { id: "start-from-the-affixes", title: "Start from the affixes", text: "Heroic Essence starts from a base amount plus an amount for each of the creature's affixes.", rules: ["essence-requires-points", "affix-count-source"] },
      { id: "apply-rank-and-health", title: "Apply rank and health", text: "The creature's rank and health then scale the Essence.", rules: ["essence-rank-multiplier", "essence-health-factor"] },
      { id: "carry-the-fraction", title: "Carry the fraction", text: "Fractions of Essence add up over kills.", rules: ["essence-fraction-carry"] },
    ],
  },
  "crafting-and-gathering": {
    overview: "Crafting turns materials into products, and gathering takes items from nodes in the world. Both train skills.",
    steps: [
      { id: "check-the-crafting-level", title: "Check the crafting level", text: "Each recipe rank needs a crafting skill level.", rules: ["recipe-rank-gate"] },
      { id: "provide-materials-and-space", title: "Provide materials and space", text: "Bring the materials and make room in your bags.", rules: ["recipe-craft-needs", "recipe-item-tooltip"] },
      { id: "roll-each-product", title: "Roll each product", text: "Each product has its own chance.", rules: ["recipe-product-roll"] },
      { id: "award-crafting-experience", title: "Award crafting experience", text: "Crafting experience drops as your skill passes the recipe's level.", rules: ["recipe-experience-bands", "recipe-experience-rounding", "recipe-experience-condition", "recipe-experience-modifiers"] },
      { id: "pick-a-node", title: "Pick a node", text: "A spawner chooses which node appears.", rules: ["spawner-weighted-pick", "spawner-weight-limits", "spawner-weights-relative", "attunement-98", "attunement-642", "attunement-643", "attunement-644", "attunement-645", "attunement-646", "attunement-647"] },
      { id: "wait-for-the-node", title: "Wait for the node", text: "Nodes appear while you are near and return after a delay.", rules: ["spawner-check-interval", "spawner-player-range", "spawner-respawn", "placed-node-cooldown", "node-requirements"] },
      { id: "gather-the-items", title: "Gather the items", text: "A node gives items from its loot table.", rules: ["node-loot-roll", "node-yield-bonus"] },
      { id: "award-gathering-experience", title: "Award gathering experience", text: "Gathering trains your gathering skill.", rules: ["node-experience"] },
      { id: "gain-other-skill-experience", title: "Gain other skill experience", text: "Each source of skill experience trains a particular skill.", rules: ["weapon-skills", "weapon-skills-untrained", "crafting-skill-source", "enchanting-skill-source", "unmapped-skill-sources"] },
    ],
  },
  corruption: {
    overview: "Corruption makes timed dungeons harder and can strengthen equipment found there. Use a Corruption Token at an altar to add levels and affixes.",
    steps: [
      { id: "use-the-altar", title: "Use an altar", text: "Each timed dungeon has an Altar of Corruption.", rules: ["corruption-altar"] },
      { id: "read-the-token", title: "Read the token", text: "A saved token's tooltip shows its altar value, enemy bonuses, and affixes.", rules: ["corruption-token"] },
      { id: "face-corrupted-creatures", title: "Fight corrupted enemies", text: "At each corruption level, enemies gain", rules: ["corruption-creatures"] },
      { id: "finish-the-timer", title: "Beat the timer", text: "Defeat all bosses before the timer ends.", rules: ["corruption-timer"] },
      { id: "compare-corrupted-gear", title: "Compare corrupted gear", text: "Each corruption level increases equipment's base stats and weapon damage", rules: ["corruption-gear"] },
    ],
  },
  loot: {
    overview: "A bag opens a chest of loot. A supply pack gives items from the loot table for your class and level. World objects, cloth drops, quest pickups, and the Dungeon Finder give items too.",
    steps: [
      { id: "open-a-chest", title: "Loot the chest", text: "Each item in the chest rolls its own chance.", rules: ["chest-row-rolls"] },
      { id: "choose-a-table", title: "Get your table", text: "The pack uses the loot table for your class and level.", rules: ["supply-pack-tables"] },
      { id: "pick-the-items", title: "Roll the items", text: "The table sets how many items you get, and its bonus chance can add one more. No item comes twice.", rules: ["supply-pack-picks"] },
      { id: "draw-from-world-loot", title: "Swap in world loot", text: "Each item can come from world loot for your level and class instead.", rules: ["supply-pack-world-loot"] },
      { id: "keep-the-pack", title: "Empty the pack", text: "The pack is gone once you take everything in it.", rules: ["supply-pack-lifecycle"] },
      { id: "collect-cloth", title: "Collect cloth", text: "A kill can add cloth to the loot.", rules: ["cloth-drop-chance", "cloth-tier-weights"] },
      { id: "open-an-object", title: "Open an object", text: "Some objects in the world hold a chest.", rules: ["object-chest", "altar-options"] },
      { id: "pick-up-quest-items", title: "Pick up quest items", text: "Some quest items appear only while a quest asks for them.", rules: ["quest-only-loot", "hunt-pickup", "quest-pickup-use"] },
      { id: "finish-a-random-run", title: "Finish a Random run", text: "The Dungeon Finder rewards a finished Random run.", rules: ["random-run-supply-pack"] },
    ],
  },
};

export function guideStepFor(topic: MechanicsTopic, ruleId: string): string | undefined {
  return GUIDES[topic].steps.find((step) => step.rules.includes(ruleId))?.id;
}
