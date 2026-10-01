## Purpose

Represent scenes that reuse another scene's placed world content without presenting copied objects as new place content or as duplicate map markers.

## ADDED Requirements

### Requirement: Evidence-Based Place Variant Detection
The publication MUST attribute a scene to a substantially larger host in the same map space only when a substantial number of its placements match by horizontal position, role and creature identity, and source type. It MUST NOT infer a variant from scene naming or unrelated interior/overworld placement coincidences.

#### Scenario: Copied overworld geometry
- **WHEN** a challenge scene contains many objects that coincide with the host's objects under the evidence rule
- **THEN** its place identifies the host and positively matched placements are treated as copies.

#### Scenario: No qualifying overlap
- **WHEN** a scene does not meet the evidence rule
- **THEN** its existing place and map content remain unchanged.

### Requirement: Unique Place Content
A variant place MUST show only its unique creatures, services, containers, resources, quests, objectives, properties, and connections; the host place MUST retain its existing content. Its presentation MUST link the host and explain that the variant also contains copies of overworld content.

#### Scenario: Pyromancer place
- **WHEN** a reader opens Challenge Stone Pyromancer
- **THEN** Ignivar the Unhinged and unique interactive objects are shown, while copied merchants, property signs, and quest starts are omitted.

### Requirement: Unique Map Selection
The shared map space MUST contain one published marker per copied host object rather than a second marker for the variant copy. A variant's map link MUST show and focus its unique spots, not the entire host map space; other places' map links MUST retain their prior behavior.

#### Scenario: Opening a variant map link
- **WHEN** a reader follows the variant's map link
- **THEN** only the variant's unique markers are selected and the camera focuses their extent.
