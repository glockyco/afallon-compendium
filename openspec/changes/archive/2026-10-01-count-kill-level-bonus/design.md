## Context

`LevelingManager.GenerateMobEXP` at 0x18097cac2–0x18097cca3 of build 25434619 rolls `Random.Range(MinEXP, MaxEXP)` into r12d, reads `EXPBonusPerLevel` ([rdi+0x13c]) into r13d and the creature level into r14d, computes `r14d * r13d + r12d`, and passes it as a float to `GameModifierManager.GetValueAfterGameModifier` with the key `Combat_NPC_Exp`. The method truncates the result before the level difference (`research/progression/25434619/kill-level-bonus-disassembly-20261001.json`). Live kills agree (`research/progression/25434619/kill-experience-20261001.json`): with no game modifier, a world multiplier of 1, no Experience Bonus, and no followers, Bat at level 1 gave 2 three times, Brinecrest at level 23 gave 107, 121, 127, 132, and 133, and with the character one level lower it gave 70, 75, 92, 98, and 99.

The raw NPC export has `experienceBonusPerLevel` for all 478 records, but `npc_facts` did not keep it.

## Goals / Non-Goals

**Goals:** One kill model for the NPC pages, the experience sources, and the calculator, backed by the method and by measured kills.

**Non-Goals:** Modeling the game modifiers or the world modifiers. The kill step text and the calculator still say that they are left out.

## Decisions

### Keep the bonus as a typed NPC fact

The catalog keeps `experienceBonusPerLevel` beside the other experience fields of `npc_facts`, instead of a publication read of the raw gameplay data, so the experience fields of a record stay in one place.

### Publish the parts and compute the amount at a level

`killExperience` in `packages/publication/src/experience.ts` turns a record into the roll and the bonus: `{ min, max, perLevel }`. The NPC facts publish these parts, because the amount depends on the level: the page, each variant, and the calculator have different levels. The site helper `killExperienceText` computes the amount at a level range. A record with an unknown bonus publishes no experience, because the roll alone would understate the kill.

### Correct the rule through a new rules record

The reviewed rules record of the build is evidence and stays unchanged. A new record, `local/mechanics-rules-25434619-kill-level-bonus.json`, changes the kill roll rule and adds the two evidence objects. A new catalog plan and a new publish plan in `local/kill-experience/` reference it. The presentation differs from the previous one only in its catalog ID.

## Risks / Trade-offs

- [The level of a scaling spawn has a small random offset] → The page shows the amount at the lowest and highest level of the spawn, and the calculator lets the reader choose the creature level.
- [NPC document v7 replaces v6] → The site reads only the staged publication, and the update report names the schema change.
