## Context

`AdventurerWorldSettings` (a ScriptableObject) holds the roster of adventurers, their arrivals, `EquipmentBands` (an item and the minimum content level from which adventurers carry it), `EquipmentRewardChance` with `EquipmentRewards` (items an adventurer can receive after a job), and, new in 0.16.3, `KitUpgrades` (an ID, an adventurer NPC, and items that replace that adventurer's gear when they are upgrades). `update-game-0-16-3` records these settings as raw evidence and catalog rows.

Item pages derive their How to get it routes from player sources, and coverage counts an item without any of them under `itemWithoutSource`.

## Goals / Non-Goals

**Goals:**
- Tell readers when only adventurers carry an item, and which adventurer.
- Keep player routes first; adventurer relations never become a way to get the item.

**Non-Goals:**
- Simulating which adventurer holds which band item at a given time.
- Claiming that an adventurer drops its gear: no evidence shows that.

## Decisions

- **Adventurer relations are not sources.** They live in their own item-page section and coverage group. An item with a player source keeps its routes; the section is extra context.
- **Wording.** How to get it says "Only adventurers carry this item." with a link to the section. The Adventurers relation table says "Gear upgrade for Agra Emberhide", "Carried by adventurers of level N or higher" (the adventurer's own level), and "Adventurer job reward: each finished job has a P% chance to give the adventurer one upgrade from the reward list".
- **Coverage key.** A new `itemAdventurerOnly` group sits beside `itemWithoutSource`.

## Risks / Trade-offs

- A setting references an unpublished or excluded item → the relation is dropped with the exclusion, as other relations are.
- The reward chance is the chance of receiving one upgrade from the list after a finished job, not the chance of this particular item.
