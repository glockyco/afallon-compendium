## Why

Challenge-stone scenes reuse large portions of Coalway Outdoors in the same map space. Treating every scene placement as independent advertises copied merchants, quests, and property signs as challenge content and duplicates map markers.

## What Changes

- Detect variant/host relationships from catalog spatial placement evidence, role and entity identity, and source type; remove only positively matched copies from variant publication.
- Publish variant places with a host link, only their unique content, and a unique-placement map selection instead of the entire shared map space.
- Keep host pages and all ordinary places unchanged; compare all place-document counts across the cutover.

## Capabilities

### New Capabilities
- `place-variants`: Data-derived variant attribution, unique content projection, and focused map navigation.

### Modified Capabilities
- None; the new capability refines existing place and map publication semantics.
