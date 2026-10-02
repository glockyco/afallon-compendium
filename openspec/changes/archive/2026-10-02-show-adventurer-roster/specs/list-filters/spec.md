## ADDED Requirements

### Requirement: The NPC list filters adventurers by class and party role

The NPC list SHALL offer a Class filter and a Party role filter. An adventurer of the world roster SHALL match its class and its party role, and an adventurer without a role of its own SHALL match Damage. An NPC that is not on the roster SHALL match no value of either filter.

#### Scenario: Healers
- **WHEN** a reader checks Healer in the NPC list's Party role filter
- **THEN** the list shows the eleven healers of the roster and no NPC outside it
