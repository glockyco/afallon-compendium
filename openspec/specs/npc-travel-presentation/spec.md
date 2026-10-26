# npc-travel-presentation Specification

## Purpose
Flight-master and Travel pages let players discover reachable stops, understand route connections, and assess fares and travel time from the same published network.

## Requirements

### Requirement: Flight masters answer from their known stop

A flight master's answer SHALL name its departure stop from the published network even when no map placement is available.

#### Scenario: Flight master without a captured map spot
- **WHEN** Skywarden Edda's network stop is Castle Overlook but she has no map placement
- **THEN** the page says to depart from Castle Overlook, links Eastern Roost and Training Camp to their flight masters, and does not say her station is unknown

#### Scenario: Route with an unknown connecting fare
- **WHEN** a destination is reachable by a connection but the complete fare cannot be established
- **THEN** the page does not claim a numeric fare for that destination

#### Scenario: Flight masters answer from their known stop
- **WHEN** A flight master has a departure stop in the published network but no map placement.
- **THEN** The answer names that departure stop.

### Requirement: Reachable flight destination links

A flight master's answer SHALL list reachable destinations linked to their published flight masters with entity previews.

#### Scenario: Reachable flight destination links
- **WHEN** A flight master has reachable destinations with published flight masters.
- **THEN** The answer lists those destinations linked to their published flight masters with entity previews.

### Requirement: Direct and connecting flight distinction

A flight master's answer SHALL distinguish direct travel from a connection.

#### Scenario: Direct and connecting flight distinction
- **WHEN** A flight master has one directly reachable destination and another reachable by a connection.
- **THEN** The answer distinguishes the direct travel from the connection.

### Requirement: Free destination fare summary

A flight master's answer SHALL state a free fare once if all destination fares are zero.

#### Scenario: Free destination fare summary
- **WHEN** All of a flight master's destination fares are zero.
- **THEN** The answer states a free fare once.

### Requirement: Flight time explanation and evidence boundary

A flight master's answer SHALL explain that travel time depends on the path and route speeds and that remaining time is displayed during flight, without inventing a specific duration or route fare.

#### Scenario: Flight time explanation and evidence boundary
- **WHEN** A reader views a flight master's answer.
- **THEN** The answer explains that travel time depends on the path and route speeds and that remaining time is displayed during flight, without inventing a specific duration or route fare.
### Requirement: Travel network has comparable and useful route rows

The Travel mechanics page SHALL list each distinct flight network with linked stops and authored routes, using the site's shared entity-link and relation-table presentation.

#### Scenario: Free network
- **WHEN** every route in a network has no currency and a zero fare
- **THEN** the network says its flights are free and has no fare column

#### Scenario: Long network on a phone
- **WHEN** a network has more than ten routes and is viewed on a phone
- **THEN** route names remain visible in labeled rows, with the shared Show more disclosure and destination hover previews where the device supports hover

#### Scenario: Travel network has comparable and useful route rows
- **WHEN** A flight network has two linked stops and an authored route.
- **THEN** The Travel mechanics page lists the network, its linked stops, and its authored route using the shared entity-link and relation-table presentation.

### Requirement: Free flight networks omit repetitive fares

If all routes have the same zero fare, the Travel mechanics page SHALL state that flights on the network are free once instead of showing a repetitive fare column.

#### Scenario: Free flight networks omit repetitive fares
- **WHEN** Three routes in a flight network all have the same zero fare.
- **THEN** The page states once that flights on the network are free and omits the repetitive fare column.

### Requirement: Shared flight direction is stated once

If all routes share the same direction, the Travel mechanics page SHALL state that direction once.

#### Scenario: Shared flight direction is stated once
- **WHEN** All routes in a flight network share one direction.
- **THEN** The page states that direction once.

### Requirement: Network sections retain discovery rules

Network sections SHALL retain the discovery rule.

#### Scenario: Network sections retain discovery rules
- **WHEN** A flight network has a discovery rule.
- **THEN** The network section retains that discovery rule.

### Requirement: Network sections exclude collection-process descriptions

Network sections SHALL NOT describe the site's collection process to players.

#### Scenario: Network sections exclude collection-process descriptions
- **WHEN** A player reads a flight network section.
- **THEN** The section does not describe the site's collection process.
