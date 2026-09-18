## Purpose

Static publication supplies verified, linked atlas resources to readers. Producer selection and deployment verification must agree on the meaning and consistency of the same resource graph.

## ADDED Requirements

### Requirement: Consistent publication graph acceptance

Producer selection and deployment verification SHALL enforce the same resource-graph semantics for the same publication. These semantics SHALL include root and coverage agreement, map and part identities, unique placement identities, geometry membership, travel-state agreement, imagery defaults, and search-to-detail identities. Both boundaries SHALL reject conflicting references, missing reachable resources, invalid schemas, inconsistent build or catalog identities, and exceeded existing resource budgets.

Each boundary SHALL also enforce its own trust constraints. Producer selection SHALL require an accepted catalog gate and matching completeness. Deployment verification SHALL require contained regular files with matching content identities. Neither boundary SHALL weaken an existing check to match the other.

#### Scenario: Rehashed but inconsistent resource graph

- **WHEN** a publication has correct hashes and schemas but geometry refers to a placement outside its declared map
- **THEN** producer selection and deployment verification both reject the publication
- **AND** neither operation replaces the previously selected or staged publication

#### Scenario: Valid graph crosses storage boundaries

- **WHEN** a valid candidate graph is materialized without changing its resources
- **THEN** producer verification and staged-file verification accept the same graph
- **AND** its public identities and serialized resources remain unchanged

#### Scenario: Host integrity failure

- **WHEN** a reachable staged resource is a symlink, escapes the publication directory, or differs from its declared content identity
- **THEN** deployment verification rejects it even if its decoded values satisfy the semantic rules

### Requirement: Parity checks use the verified candidate

Deployment parity checks SHALL evaluate the same decoded candidate resources accepted by graph verification. They SHALL retain all existing protections for deployed placements, categories, maps, offsets, regions, search entries, and imagery. Parity checks SHALL remain separate from graph validity because a valid graph can still remove deployed content.

#### Scenario: Valid graph removes deployed content

- **WHEN** a candidate passes graph validation but omits a deployed placement
- **THEN** parity verification rejects staging
- **AND** the previously staged publication remains available

#### Scenario: Candidate resources are already verified

- **WHEN** staging runs parity verification after graph verification
- **THEN** parity uses the verified candidate resource set without reopening its JSON files
- **AND** the independently loaded deployed baseline remains the comparison authority
