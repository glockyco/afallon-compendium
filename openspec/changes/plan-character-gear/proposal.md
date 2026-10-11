## Why

A character's equipment is more than a list of item templates: its placements, random values, sockets, enchantment, Heroic flag and corruption affect what the compendium can explain. The planner needs evidence-backed item instances and neutral comparisons without claiming unknown stats or in-game ownership.

## What Changes

- Add `character-gear` to the workspace and named characters established by `build-character-planner` / `character-planner`, after foundation/talents and `plan-party` / `party-planner`.
- Offer a placement-scoped picker using the item list's filters and sources. Preserve unusable items with reasons; browsing never equips. Use verified main-hand, off-hand and ranged rules, probe configured ring/trinket placements, and exclude cosmetic armor and consumables.
- Model each equipped instance with its item, independent Heroic flag and corruption level, entered random-stat values, gems by socket and one enchantment. Validate every field before gear ships and carry it in the foundation's character link and all-character export.
- Show distinct-piece set progress, sourced stat contributions and Incomplete totals where inputs or formulas remain unknown. Keep race/class/level base stats Incomplete until provider and growth research settles them.
- Generalize item comparison to two instances matched by stat identity, with neutral differences rather than better/worse styling.
- Use the verified Heroic gear-score rule when its instance inputs are complete; otherwise show “Gear Score Not Available.”
- Add “Equip on (name)” and “Compare With (name)'s (slot)” on prerendered item pages. Load a published item directory only when used, not the full search index.

## Capabilities

### New Capabilities

- `character-gear`: Verified equipment placements, modified item instances, set progress, sourced stats, neutral comparisons and item-page handoffs belonging to a planned character.

### Modified Capabilities

None. This capability references `build-character-planner` / `character-planner` for character lifecycle, preview adoption, persistence and the versioned link contract; it does not redefine that foundation. Save transfer remains owned by `show-save-progress` / `save-progress` and its independent verification gate.

## Impact

- Evidence baseline: Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Published playable offers exclude captured Berserker.
- Research: configured armor placements, gem-fit/edit paths, base-stat provider/growth, derived-stat links, Heroic/corruption eligibility and gear-score instance inputs; reuse resolved weapon, random-maximum, set and aggregation rules.
- Contracts/catalog/publication: typed gear inputs and small item directory with accepted provenance; preserve partial entries. Any official data update requires its JSON acceptance audit and synchronized development/preview publication.
- Site: Gear view, instance editor, set/stat disclosures, generalized comparison and action-loaded item-page controls in the established visual system. No recommendations, rankings, simulations, outcome predictions, consumable planning, account sync or direct save parsing.
