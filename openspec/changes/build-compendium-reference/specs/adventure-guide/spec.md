## REMOVED Requirements

### Requirement: The guide mirrors the game's own structure
**Reason**: The native Adventure Guide presents four groups with limited facts. The compendium presents dungeons and regions as place pages, bosses as NPC pages, and properties as property pages, each with the full published facts and relations. The native guide remains an input for artwork, descriptions, level ranges, and boss references.
**Migration**: The `/guide` routes are removed without redirects. Dungeons and regions become place pages, bosses become NPC pages, and properties become property pages, each reachable through search, the world atlas, and its kind list. An old guide link reaches the not-found page. Guide-excluded scenes receive place pages without guide artwork.

### Requirement: Guide loot states only measured chance semantics
**Reason**: The rule now applies to every loot row on every page, not only boss entries, and is defined by `compendium-reference` under "Fact cards show only established values" and "Relations are typed per pair".
**Migration**: Loot rows on NPC and item pages show the quantity range and, when measured for the supported build, the chance. An unmeasured chance renders as a dash with a hover explanation.

### Requirement: The guide links to places and items
**Reason**: Linking is a general property of the compendium, defined by `compendium-reference` under "Every entity reference is a link or plain text" and "The atlas and the pages link both ways".
**Migration**: Place, NPC, and property pages link to their atlas placements; loot rows link to item pages; browser history returns to the origin page.
