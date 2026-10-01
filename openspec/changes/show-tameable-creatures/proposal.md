## Why

Hunter players need to know which creatures they can tame, without mistaking a flagged Elite for an eligible pet. The 0.16.3 canonical scan and the native taming rule give the evidence to tell them apart.

## What Changes

- Publish a tameability fact from the creature's Beast type, its tamable flag, and its normal mob rank, and keep differences between the variants of a page.
- Say in the creature's identity facts that a Hunter can tame it, and list the known conditions: a Hunter of its level or higher, with no pet, within 30 m.
- Link the Hunter class page when that page is published.
- **BREAKING** Bump the static NPC document schema identifier once for the new fact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `npc-presentation`: Creature pages show evidence-backed Hunter tameability and its conditions.

## Impact

NPC publication and the public document contract, variant grouping, and the creature detail page. The canonical collector and the catalog already keep the three NPC fields.
