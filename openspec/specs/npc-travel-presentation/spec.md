# npc-travel-presentation Specification

## Purpose
Flight-master and Travel pages let players discover reachable stops, understand route connections, and assess fares and travel time from the same published network.

## Requirements

### Requirement: Flight masters answer from their known stop

A flight master's answer SHALL name its departure stop from the published network even when no map placement is available. It SHALL list reachable destinations linked to their published flight masters with entity previews, distinguish direct travel from a connection, and state a free fare once if all destination fares are zero. It SHALL explain that travel time depends on the path and route speeds and that remaining time is displayed during flight, without inventing a specific duration or route fare.

#### Scenario: Flight master without a captured map spot
- **WHEN** Skywarden Edda's network stop is Castle Overlook but she has no map placement
- **THEN** the page says to depart from Castle Overlook, links Eastern Roost and Training Camp to their flight masters, and does not say her station is unknown

#### Scenario: Route with an unknown connecting fare
- **WHEN** a destination is reachable by a connection but the complete fare cannot be established
- **THEN** the page does not claim a numeric fare for that destination

### Requirement: Travel network has comparable and useful route rows

The Travel mechanics page SHALL list each distinct flight network with linked stops and authored routes, using the site's shared entity-link and relation-table presentation. If all routes have the same zero fare, the page SHALL state that flights on the network are free once instead of showing a repetitive fare column. If all routes share the same direction, it SHALL state that direction once. Network sections SHALL retain the discovery rule and shall not describe the site's collection process to players.

#### Scenario: Free network
- **WHEN** every route in a network has no currency and a zero fare
- **THEN** the network says its flights are free and has no fare column

#### Scenario: Long network on a phone
- **WHEN** a network has more than ten routes and is viewed on a phone
- **THEN** route names remain visible in labeled rows, with the shared Show more disclosure and destination hover previews where the device supports hover
