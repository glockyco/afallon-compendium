## Context

NPC catalog facts already contain resolved flight networks, but publication drops them. Named NPC grouping can place several flight masters on one page, so a flight stop must link to a particular record variant, not merely an NPC display name. The map's placement and transition layers have no model for airborne multi-stop routes.

## Goals / Non-Goals

**Goals:** Publish captured network connections once per scene and network, project direct departures for each flight master's stop, and present verified discovery and journey rules in Travel.

**Non-Goals:** Reconstruct the runtime smoothed path to estimate flight time, draw the aerial routes on the ground map, or infer a currency when the captured currency reference is absent.

## Decisions

- Add compact versioned NPC flight and Travel document fields using existing resolved references, rather than exposing raw waypoint arrays in reader documents.
- Index flight masters by network, scene, and stop ID, then resolve their NPC reference using the existing grouped-page resolver. Keep networks keyed by both network ID and scene to avoid merging test-area and overworld stops.
- Render direct outgoing routes on each master page. Bidirectional routes contribute a reverse departure. The guide shows the network's authored route orientation and states that the route works both ways.
- Use the existing rule sections and native-evidence record for discovery, planning, fare checks, and path length. Do not show numerical duration because the native planner builds and smooths a path not present in the catalog.

## Risks / Trade-offs

- An unplaced flight stop can still have an NPC link while its map position remains unresolved. This avoids hiding captured flight service but does not pretend it has a map marker.
- The NPC page lists direct legs, not every multi-leg destination. The guide explicitly identifies the network connections so readers can trace onward travel without presenting an unverified route fare or ETA.
