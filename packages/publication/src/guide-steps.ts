import type { MechanicsTopic } from "@afallon/contracts/catalog";
import type { GuideStep } from "@afallon/contracts/public";

export const GUIDES: Record<MechanicsTopic, { overview: string; steps: GuideStep[] }> = {
  "character-progression": {
    overview: "Characters gain experience from creature kills and quests, and skills gain experience from their own sources. Experience above the next level carries over. The level curve shows the experience that each level needs.",
    steps: [
      { id: "roll-kill-experience", title: "Roll kill experience", text: "A kill starts from a random whole amount in the creature's experience range.", rules: ["kill-base-roll"] },
      { id: "adjust-the-kill", title: "Adjust the kill", text: "The level difference, the Heroic multiplier, and the number of followers change the amount. Some game modifiers are not known.", rules: ["kill-level-difference", "kill-heroic-multiplier", "kill-companion-split", "kill-game-modifiers"] },
      { id: "scale-quest-experience", title: "Scale quest experience", text: "A quest reward scales with the player level, and a quest step gives a fixed amount. Some rewards skip the usual adjustment and Heroic multipliers do not apply.", rules: ["quest-reward-level-scale", "quest-action-amount", "quest-reward-skip-flag", "quest-no-heroic-multiplier"] },
      { id: "apply-experience-bonuses", title: "Apply experience bonuses", text: "The Experience Bonus total and the world modifier then change each character award.", rules: ["experience-bonus-stat", "world-modifier-multiplier"] },
      { id: "level-up", title: "Level up", text: "Experience above the next level carries over, and the level cap stops all gains.", rules: ["surplus-experience-carries", "level-cap-stops-experience"] },
      { id: "gain-skill-experience", title: "Gain skill experience", text: "Hits, crafts, nodes, and other sources give skill experience, which stops at the skill's maximum level.", rules: ["skill-award-sources", "skill-award-modifiers"] },
      { id: "gain-talent-points", title: "Gain talent points", text: "Character level gains talent points, subject to the recorded modifiers.", rules: ["talent-point-modifiers"] },
    ],
  },
  "heroic-tier": {
    overview: "Heroic tier changes experience from creature kills and can award Heroic Essence. The recorded settings also describe Heroic creatures and gear.",
    steps: [
      { id: "multiply-kill-experience", title: "Multiply kill experience", text: "A kill of a Heroic creature multiplies its kill experience. Quest experience does not change.", rules: ["heroic-kill-experience"] },
      { id: "start-from-the-affixes", title: "Start from the affixes", text: "Heroic Essence starts from a base amount plus an amount for each affix of the creature.", rules: ["essence-requires-points", "affix-count-source"] },
      { id: "apply-rank-and-health", title: "Apply rank and health", text: "Elite, Rare, and Boss creatures multiply the Essence, and the health factor scales it within its bounds.", rules: ["essence-rank-multiplier", "essence-health-factor"] },
      { id: "carry-the-fraction", title: "Carry the fraction", text: "The character receives the whole part, and the fraction waits for the next kill.", rules: ["essence-fraction-carry"] },
    ],
  },
  "crafting-and-gathering": {
    overview: "A craft turns materials into products and gives experience to the recipe's skill. A gathering node gives items from its loot table and experience to its gathering skill.",
    steps: [
      { id: "check-the-crafting-level", title: "Check the crafting level", text: "A craft starts only when the crafting skill reaches the required level of the recipe.", rules: ["recipe-rank-gate"] },
      { id: "provide-materials-and-space", title: "Provide materials and space", text: "A craft needs every material and enough empty bag slots for its products. A recipe item teaches the craft through its game action.", rules: ["recipe-craft-needs", "recipe-item-tooltip"] },
      { id: "roll-each-product", title: "Roll each product", text: "Each product has its own chance to be made.", rules: ["recipe-product-roll"] },
      { id: "award-crafting-experience", title: "Award crafting experience", text: "The skill level relative to the required level selects full, half, or no base experience.", rules: ["recipe-experience-bands", "recipe-experience-rounding", "recipe-experience-condition", "recipe-experience-modifiers"] },
      { id: "pick-a-node", title: "Pick a node", text: "A spawner picks one node by weight, and the weights change with the gathering skill. Recorded attunements affect only the nodes they name.", rules: ["spawner-weighted-pick", "spawner-weight-limits", "spawner-weights-relative", "attunement-98", "attunement-642", "attunement-643", "attunement-644", "attunement-645", "attunement-646", "attunement-647"] },
      { id: "wait-for-the-node", title: "Wait for the node", text: "A spawner checks near the player and rolls again after its respawn time. Directly placed nodes have their own cooldown.", rules: ["spawner-check-interval", "spawner-player-range", "spawner-respawn", "placed-node-cooldown", "node-requirements"] },
      { id: "gather-the-items", title: "Gather the items", text: "Each item of the loot table rolls on its own, and the skill level can add one more item.", rules: ["node-loot-roll", "node-yield-bonus"] },
      { id: "award-gathering-experience", title: "Award gathering experience", text: "A used node gives its skill experience and its character experience.", rules: ["node-experience"] },
      { id: "gain-other-skill-experience", title: "Gain other skill experience", text: "Weapon hits, enchanting, and crafting use their known skill sources. Some sources remain unresolved.", rules: ["weapon-skills", "weapon-skills-untrained", "crafting-skill-source", "enchanting-skill-source", "unmapped-skill-sources"] },
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
};

export function guideStepFor(topic: MechanicsTopic, ruleId: string): string | undefined {
  return GUIDES[topic].steps.find((step) => step.rules.includes(ruleId))?.id;
}
