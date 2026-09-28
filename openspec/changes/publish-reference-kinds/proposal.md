## Why

The catalog holds effects, stats, enchantments, and factions, but the publication has no pages for these kinds. Readers cannot follow many existing references or compare their sources and requirements.

## What Changes

- Publish lists, detail pages, search entries, and tooltips for effects, stats, enchantments, and factions.
- Show effect ranks, application sources, and requirements that test an effect. Show stat meanings where evidence exists and sources with their amounts.
- Show enchantment results, eligible items, costs, and sources. Show faction members, reputation changes, and linked unlocks when evidence supports them.
- Add Effects, Stats, Enchantments, and Factions to the Reference group created by `build-compendium-hub`.
- Retain all reachable records. Label absent links or evidence rather than silently removing a record.

## Capabilities

### New Capabilities

- `reference-kinds`: Define pages, lists, search, tooltips, provenance, and links for the four reference kinds.

### Modified Capabilities

None. The existing detail-page structure applies to these new kinds.

## Impact

The change updates the catalog query and, if evidence is missing, capture and catalog extraction. It adds public document contracts and publication projectors. It updates the generic list and detail site surfaces. It depends on the grouped navigation from `build-compendium-hub` and the shared section navigation from `add-page-navigation`. It does not add mechanics pages.
