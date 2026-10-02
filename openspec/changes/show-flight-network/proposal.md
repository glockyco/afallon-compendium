# Show the Flight Network

## Why

Flight master records already carry authored stops and routes, but neither their NPC pages nor the Mechanics guide lets readers find a destination or see how flight discovery and fares work.

## What Changes

- Publish each captured flight network once, with stop references to the flight masters and authored direct connections, directions, and fares.
- Show direct departures on flight master pages and connect them to a Travel mechanics guide with native-evidenced rules.
- Preserve named NPC variant links for flight masters that share a page.

## Scope

Flight paths do not belong on the current map layer: the layer projects world placements and teleport destinations, while authored flight waypoints are aerial paths and the three test-area stops have no published map resolution. Drawing them as map transitions would misrepresent their space and conflate flight routes with instant travel. The Travel page lists the complete captured route network instead. Travel times are not shown as numerical estimates because the game builds and smooths paths at runtime, and the captured waypoints alone do not reproduce its planned duration.
