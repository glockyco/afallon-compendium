## Context

NPC catalog facts already contain resolved flight networks, but publication drops them. Named NPC grouping can place several flight masters on one page, so a flight stop must link to a particular record variant, not merely an NPC display name. The map's placement and transition layers have no model for airborne multi-stop routes.

## Goals / Non-Goals

**Goals:** Publish captured network connections once per scene and network, project each reachable destination for every flight master's stop, and present verified discovery and journey rules in Travel.

**Non-Goals:** Reconstruct the runtime smoothed path to estimate flight time, draw the aerial routes on the ground map, or infer a currency when the captured currency reference is absent.

## Decisions

- Add compact versioned NPC flight and Travel document fields using existing resolved references, rather than exposing raw waypoint arrays in reader documents.
- Index flight masters by network, scene, and stop ID, then resolve their NPC reference using the existing grouped-page resolver. Keep networks keyed by both network ID and scene to avoid merging test-area and overworld stops.
- Traverse directed routes from each master stop to list every reachable destination. Reverse edges exist only for bidirectional routes. A connecting destination shows a zero fare only when all routes reachable from the origin have zero fares. Direct route fares remain authored values. The guide shows the network's authored route orientation and fares.
- Use the existing rule sections and native-evidence record for discovery, planning, fare checks, and path length. Do not show numerical duration because the native planner builds and smooths a path not present in the catalog.

## Risks / Trade-offs

- An unplaced flight stop can still have an NPC link while its map position remains unresolved. This avoids hiding captured flight service but does not pretend it has a map marker.
- A positive-fare connecting journey has no fixed fare in the publication because the runtime selects its path by travel time. Its destination stays visible, but the fare points to the route network rather than claiming a possibly wrong total.
