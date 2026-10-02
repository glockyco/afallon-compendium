## Why

NPCs without a published world spot currently lead with empty drops, unknown locations, and combat defaults, while flight masters contradict their named stations and use a separate table style. The Travel network also repeats zero fares across every route instead of giving players a clear journey overview.

## What Changes

- Lead flight-master pages with their published departure stop, reachable destinations, fare, connection status, and the verified travel-time rule. Link stops to their published flight masters with previews.
- Render Travel networks through shared entity links, link grids, and relation tables. State free travel and a common route direction once per network.
- Put adventurer class links and meaningful combat facts in shared side cards, omit unsupported empty answers and placements, and prioritize services or abilities for other NPCs.
- Make NPC role labels sentence case and avoid showing negative health or unplaced default combat values.
- Show the effects NPCs apply through their abilities or invitations, with links back to effect pages and player-readable invitation duration.
- Keep game-authored portraits for world-roster adventurers, including shared avatar portraits.
- Withhold content-free NPC records through reviewed exclusion evidence rather than publishing an empty detail page.
- Reword Travel rule evidence without claiming that game data was recorded on the player page.

## Capabilities

### New Capabilities
- `npc-travel-presentation`: Flight-master and Travel network presentation with verified fare and duration boundaries.

### Modified Capabilities
- `detail-pages`: NPC page answers, fact hierarchy, side cards, and handling of absent information.

## Impact

NPC detail pages, flight network mechanics, role formatting, the NPC document schema, and the Travel mechanics rule fragment change. The underlying stop graph and authored route fares remain unchanged.
