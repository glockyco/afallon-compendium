# Show One Gear Version

## Why

Every piece of gear that a creature drops offered a Heroic preview, including gear that only bosses of timed dungeons drop. The Heroic tier pauses in those dungeons, so such gear never becomes Heroic: all 94 items with a corruption preview also offered Heroic, although only 11 of them drop anywhere the tier is live. The page also let a reader combine Heroic and corruption, which no single item can have, and labeled the Heroic tooltip with a sentence that the game does not show. The Gear options card had grown into a stack of separate controls and notes.

## What Changes

- Publication offers the Heroic version only when some creature drops the item where the tier can be live: world loot, a creature without a recorded place, or a creature with a place outside the paused places. Gear that only creatures in paused places drop instead names those places, and its page says it never drops as Heroic gear.
- The Gear options card offers one choice of version: Normal, and Heroic or Corrupted where the item has them. Only the chosen version explains itself, in one line with one link. Corrupted shows the level slider, from +1 to the cap, starting at the cap.
- The Heroic tooltip shows the game's own tag, the word "Heroic" in `#7CFC00`, as `ItemTooltip.Show` writes it. The bonus moves into the Heroic line of the gear options.

## Impact

Item publication, the item document contract (`heroicPausedIn`), the item page's Gear options card, and the item tooltip change. Evidence: the verified `heroic-tier-excluded-areas` and `heroic-gear-creature-drops` rules, and the build-matched literals of `ItemTooltip.Show` (`<color=#7CFC00>`, the `heroic.item_tag` key, whose English text is "Heroic").
