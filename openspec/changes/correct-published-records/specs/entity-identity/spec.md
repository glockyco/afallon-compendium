## ADDED Requirements

### Requirement: Reviewed exclusions keep internal records unpublished

The publication SHALL NOT publish a record that the reviewed exclusion list names. An excluded record SHALL have no page, list row, or search entry, and SHALL NOT count toward a published count. A relation row whose counterpart is an excluded record SHALL NOT appear. A requirement that names an excluded record SHALL show the record name without a link. Excluded records SHALL NOT take part in name qualification. Each exclusion SHALL name a catalog key, a reason, and its evidence. The publication SHALL fail when an entry names a key that the catalog lacks, or when the recorded evidence no longer holds in the catalog.

#### Scenario: Test item
- **WHEN** the exclusion list names Scythe Test
- **THEN** no page, list row, search entry, or count includes Scythe Test
- **AND** the catalog still retains its record

#### Scenario: Quest giver without a placement
- **WHEN** the exclusion list names the Task board record, and its quest has three placed givers
- **THEN** the quest page shows only the three placed givers

#### Scenario: Requirement names an excluded recipe
- **WHEN** a world condition requires the excluded recipe Oakenvale tavern level 2
- **THEN** the requirement shows the recipe name without a link

#### Scenario: Name shared only with excluded records
- **WHEN** a published place shares its name only with excluded scene records
- **THEN** the name of the published place has no qualifier

#### Scenario: Evidence no longer holds
- **WHEN** an excluded item has a source in a new catalog
- **THEN** the publication fails and names the exclusion entry

#### Scenario: Entry names an unknown key
- **WHEN** an exclusion entry names a key that the catalog lacks
- **THEN** the publication fails and names the entry
