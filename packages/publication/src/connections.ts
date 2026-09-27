import type { CatalogTransitionRow } from "@afallon/contracts/catalog";
import { outsideExtent, type MapExtent } from "./map-shards";

// These kinds differ only in how the game authors the action. Each of them moves the player.
const TELEPORT_KINDS: ReadonlySet<string> = new Set(["effect-teleport", "game-action-teleport", "game-action-effect-teleport"]);
// DungeonEntranceTrigger.OnTriggerEnter records its scene and opens the dungeon panel. It loads nothing, and the
// teleport beside it moves the player (see classifyTransition in packages/scan/src/world-roles.ts).
const PANEL_KINDS: ReadonlySet<string> = new Set(["dungeonEntranceTrigger"]);
// The copies of one teleporter start at the same world position, within this distance in world units.
const COPY_DISTANCE = 0.1;

type Start = NonNullable<CatalogTransitionRow["start"]>;

function outsideGameMap(start: Start, extents: ReadonlyMap<string, MapExtent>): boolean {
  const extent = start.mapSpaceId === null ? undefined : extents.get(start.mapSpaceId);
  return extent !== undefined && start.mapPosition !== null && outsideExtent(start.mapPosition, extent);
}

function samePosition(left: Start, right: Start): boolean {
  const [x, y, z] = left.worldPosition, [otherX, otherY, otherZ] = right.worldPosition;
  return Math.hypot(x - otherX, y - otherY, z - otherZ) <= COPY_DISTANCE;
}

/**
 * The teleports that a player can use, from all transitions of the catalog. A dungeon entrance trigger is not a
 * teleport. A teleport whose start lies outside the game map of its place is a leftover copy when a teleport in another
 * place starts at the same world position and has the same known destination. Eight caves and dungeons hold such copies
 * of the Duskfall Depths entrance teleporter. A teleport outside its map without a copy stays, because nothing shows
 * that a player cannot reach it. Two unknown destinations are not known to be the same, so a teleport to an unknown
 * place is never a copy. A transition of another kind stops the publication until someone decides whether it moves
 * the player.
 */
export function usableTeleports(transitions: readonly CatalogTransitionRow[], extents: ReadonlyMap<string, MapExtent>): CatalogTransitionRow[] {
  const teleports = transitions.filter((row) => {
    if (TELEPORT_KINDS.has(row.transitionKind)) return true;
    if (PANEL_KINDS.has(row.transitionKind)) return false;
    throw new Error(`Transition ${row.transitionId} has the unknown kind ${row.transitionKind}. Decide whether it moves the player before it is published.`);
  });
  const copiedElsewhere = (row: CatalogTransitionRow, start: Start) => row.destinationSceneKey !== null && teleports.some((other) => other.sourceSceneKey !== row.sourceSceneKey
    && other.destinationSceneKey === row.destinationSceneKey && other.start !== null && samePosition(start, other.start));
  return teleports.filter((row) => row.start === null || !outsideGameMap(row.start, extents) || !copiedElsewhere(row, row.start));
}
