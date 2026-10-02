## ADDED Requirements

### Requirement: Flight masters show reachable destinations

A flight master NPC page SHALL list each reachable destination of each stop its grouped records serve, with the named destination linked to that stop's flight master where published. Reverse travel SHALL appear only when the route graph allows it. Direct routes SHALL show their authored fare. A connecting destination SHALL show a fare only when all of its possible route legs have zero fare, since the game chooses a path at runtime. The page SHALL not invent a currency or travel duration and SHALL link to the Travel guide.

#### Scenario: Several stops share an NPC page
- **WHEN** multiple flight masters named Skywarden share one page and their records serve distinct stops
- **THEN** the page labels departures by their origin stop and keeps each destination associated with the correct route

#### Scenario: One-way route
- **WHEN** a route is not bidirectional
- **THEN** a stop reached through the forward route does not imply a reverse destination, but a different valid return path may still offer one

#### Scenario: Connecting destination with zero fares
- **WHEN** a flight master can reach a stop through two zero-fare routes
- **THEN** the destination appears with a zero fare and a connection label

### Requirement: Travel explains and lists captured flights

The Travel mechanics page SHALL describe only native-evidenced discovery, journey, and fare behavior. It SHALL list each distinct captured network once, its stops with flight-master links and initial discovery state, and all authored routes with fare and direction. Networks in different scenes SHALL remain separate even when their stop names overlap.

#### Scenario: Distinct captured networks
- **WHEN** eleven masters share two captured flight networks
- **THEN** the guide lists the two networks with their own stops and routes, without repeating either network for every master

#### Scenario: Missing currency
- **WHEN** a network records no currency and a route fare of zero
- **THEN** the route displays the recorded zero without claiming a named currency
