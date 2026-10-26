# flight-network Specification

## Purpose
Show readers where they can fly from each flight master and how the stops of each flight network connect, using the routes, directions, and fares that the game defines.

## Requirements

### Requirement: Flight masters show reachable destinations

A flight master NPC page SHALL list each reachable destination of each stop its grouped records serve, with the named destination linked to that stop's flight master where published.

#### Scenario: Several stops share an NPC page
- **WHEN** multiple flight masters named Skywarden share one page and their records serve distinct stops
- **THEN** the page labels departures by their origin stop and keeps each destination associated with the correct route

#### Scenario: One-way route
- **WHEN** a route is not bidirectional
- **THEN** a stop reached through the forward route does not imply a reverse destination, but a different valid return path may still offer one

#### Scenario: Connecting destination with zero fares
- **WHEN** a flight master can reach a stop through two zero-fare routes
- **THEN** the destination appears with a zero fare and a connection label

#### Scenario: Flight masters show reachable destinations
- **WHEN** A flight master's grouped records serve a stop with a reachable destination whose flight master is published.
- **THEN** The NPC page lists the destination for that stop and links the destination name to its flight master.

### Requirement: Reverse destinations require route graph support

Reverse travel SHALL appear only when the route graph allows it.

#### Scenario: Reverse destinations require route graph support
- **WHEN** The route graph allows forward travel between two stops but no return path.
- **THEN** The forward destination appears without implying a reverse destination.

### Requirement: Direct routes show authored fares

Direct routes SHALL show their authored fare.

#### Scenario: Direct routes show authored fares
- **WHEN** A direct route has an authored fare of 10 gold.
- **THEN** The direct route shows a fare of 10 gold.

### Requirement: Connecting fares require all possible legs to be free

A connecting destination SHALL show a fare only when all of its possible route legs have zero fare, since the game chooses a path at runtime.

#### Scenario: Connecting fares require all possible legs to be free
- **WHEN** A connecting destination has a possible route leg with a nonzero fare.
- **THEN** The connecting destination shows no fare.

### Requirement: Flight pages do not invent travel facts

The flight master NPC page SHALL not invent a currency or travel duration.

#### Scenario: Flight pages do not invent travel facts
- **WHEN** A flight route has no authored currency or travel duration.
- **THEN** The flight master NPC page supplies neither an invented currency nor an invented travel duration.

### Requirement: Flight pages link to the Travel guide

The flight master NPC page SHALL link to the Travel guide.

#### Scenario: Flight pages link to the Travel guide
- **WHEN** A flight master NPC page is published.
- **THEN** The page contains a link to the Travel guide.
### Requirement: Travel explains and lists captured flights

The Travel mechanics page SHALL describe only native-evidenced discovery, journey, and fare behavior. It SHALL list each distinct captured network once, its stops with flight-master links and initial discovery state, and all authored routes with fare and direction. Networks in different scenes SHALL remain separate even when their stop names overlap.

#### Scenario: Distinct captured networks
- **WHEN** eleven masters share two captured flight networks
- **THEN** the guide lists the two networks with their own stops and routes, without repeating either network for every master

#### Scenario: Missing currency
- **WHEN** a network records no currency and a route fare of zero
- **THEN** the route displays the recorded zero without claiming a named currency
