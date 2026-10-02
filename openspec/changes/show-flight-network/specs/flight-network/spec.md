## ADDED Requirements

### Requirement: Flight masters show their direct departures

A flight master NPC page SHALL list each authored direct outgoing route of each stop its grouped records serve, with the named destination linked to that stop's flight master where published. Reverse travel SHALL appear only for routes marked bidirectional. Each route SHALL show its authored fare, without inventing a currency or travel duration. The page SHALL link to the Travel guide.

#### Scenario: Several stops share an NPC page
- **WHEN** multiple flight masters named Skywarden share one page and their records serve distinct stops
- **THEN** the page labels departures by their origin stop and keeps each destination associated with the correct route

#### Scenario: One-way route
- **WHEN** a route is not bidirectional
- **THEN** the destination appears at its origin but not as a reverse departure

### Requirement: Travel explains and lists captured flights

The Travel mechanics page SHALL describe only native-evidenced discovery, journey, and fare behavior. It SHALL list each distinct captured network once, its stops with flight-master links and initial discovery state, and all authored routes with fare and direction. Networks in different scenes SHALL remain separate even when their stop names overlap.

#### Scenario: Distinct captured networks
- **WHEN** eleven masters share two captured flight networks
- **THEN** the guide lists the two networks with their own stops and routes, without repeating either network for every master

#### Scenario: Missing currency
- **WHEN** a network records no currency and a route fare of zero
- **THEN** the route displays the recorded zero without claiming a named currency
