## Context

The canonical collector records the numeric NPC rank, the creature type and HunterTamable. Normalization and the catalog NPC facts keep their names and the flag. NPC pages group records with the same name and separate facts that differ by variant. The native taming check (`HunterCombat.TameFailure`, build 25653798) requires a Hunter without a pet, a living Beast that is a normal mob with the flag set, a target level that does not exceed the Hunter's level, and a distance of at most 30 units. One more target check rejects some targets, and its gameplay meaning is not resolved. A new pet starts at the tamed level (`HunterPetOwner.BuildPetTemplate`).

## Goals / Non-Goals

**Goals:** Publish a variant-aware tameability fact and put its conditions with the creature identity facts. Link the published Hunter class.

**Non-Goals:** Promise success for every qualifying record, explain the unresolved check, or add a creature-list filter without a matching filter convention.

## Decisions

- Eligibility is `npcType === "MOB"`, `creatureType === "BEAST"`, and `hunterTamable === true`. A false fact means that the catalog does not support the label, not that every runtime state was examined.
- The tameability boolean is a record-level variant fact and takes part in variant comparison. Shared page facts carry it only when all variants agree. The static NPC document id moves from v7 to v8, and literal references migrate.
- The title facts say "Can be tamed". A Taming fact states the conditions in one place: a Hunter of the creature's level or higher, without a pet, within 30 m. It says that the pet starts at the creature's level and that the game can still refuse some targets. The level condition refers to the creature's own level, so the page's level line, which already says when a level scales with the player, gives the number. The variants table says "Can be tamed" or "Cannot be tamed".
- The Hunter page is found through the published registry by class name and linked only when present.

## Risks / Trade-offs

The unresolved target check can reject a creature that the page marks as tameable. The caveat sentence tells the reader so.
