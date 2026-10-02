## Why

Class pages showed each talent tree as a table, which is easy to scan but does not look like anything in the game. Players find talents in the game's talent screen, a radial web of all of a class's trees in which lines join each talent to the talents it requires. Passive talents also showed no icon, although every talent bonus has one. The class page spec already promised list and grid views that the page did not have.

## What Changes

- Passive talents carry their icons, in the table and in the web.
- Class pages get two views of the talent trees, switchable with tabs: Web, which lays the talents out as the game's talent screen does, and List, the tables. Web is the default. Both views render every tree and talent anchor, so a link to a talent selects it in the reader's view.
- The web shows the trees as wedges with their names, the requirement lines, and each talent's icon and rank count. A reader moves it by dragging and zooms with buttons, a pinch, or Ctrl and the scroll wheel. Selecting a talent shows its ranks, effect, requirements, and the talents it unlocks, and highlights its lines.
- The publication computes the web from catalog facts with a port of the game's layout (`TalentWebLayout.Build`), checked against the layout that the running game produced for every class. The class schema moves to `compendium.static-class.v8`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: class pages show the talent trees as the game's web or as tables.

## Impact

`packages/contracts` (talent row icon, talent web), `packages/publication` (bonus artwork, `talent-web.ts`, `documents/classes.ts`), and the site (`TalentWeb`, `talent-web-view.ts`, `TalentTreeSection`, `ClassPage`, `TabSet` and `tab-state.ts` for anchors that two views share).
