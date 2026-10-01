## MODIFIED Requirements

### Requirement: Patch-specific data risks receive explicit checks

Each update report SHALL reference the registered release notes of the new build and SHALL declare the risk areas that those notes name, each once. Each declared area SHALL be classified as supported unchanged, supported after a contract change, absent from authored data, or unsupported, with evidence from the new build. A report SHALL NOT carry a disposition for an area that its release notes do not name. Player-state systems SHALL remain unpublished unless a durable authored-data contract is established.

#### Scenario: New authored items and quests use existing contracts
- **WHEN** the current collectors and decoders accept the new build's items, quests, rewards, and relations
- **THEN** the candidate catalog includes them through the existing entity and relation model
- **AND** acceptance records their observed identities and counts rather than release-note totals alone

#### Scenario: A system exposes only mutable player state
- **WHEN** mail, bank, auction, friends, or Dungeon Finder data exists only as save or session state
- **THEN** the update report records it as outside the static authored-data contract
- **AND** the publication does not present sampled player state as canonical game content

#### Scenario: A follow-up release names other risks
- **WHEN** the release notes of the new build name teleport loading and quest hand-ins
- **THEN** the update report declares those areas with dispositions and new-build evidence
- **AND** it does not require dispositions for areas that only an earlier release named
