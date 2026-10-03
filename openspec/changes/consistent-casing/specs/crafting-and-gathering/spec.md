## MODIFIED Requirements

### Requirement: Reader wording stays independent of internal records

The gathering node and mechanics pages SHALL use Title Case for title-like noun headings and table columns and sentence case for headings phrased as sentences or questions, facts, filter values, and prose. Game-provided category values and names SHALL preserve their spelling. They SHALL not show native record ids, enum words, or rich-text tags. Text SHALL use straight quotes.

#### Scenario: Node name has rich-text tags
- **WHEN** a node's authored name holds color tags, such as `Small iron vein <color=red>Pickaxe</color>`
- **THEN** its visible label is the node name in title case without the tags or the tool and level hints
