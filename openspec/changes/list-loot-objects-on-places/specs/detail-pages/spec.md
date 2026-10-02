## ADDED Requirements

### Requirement: Place pages list their objects with loot

A place page SHALL list each object in the place that gives items when used, such as graves, locked chests, sacrificial altars, and For Sale signs. A row SHALL name the object and its choice, show its cost and its conditions as separate items, link the items that it can give, and count its spots in the place. Rows with the same name, cost, choice, and conditions SHALL merge. Placed gathering nodes SHALL stay on their node pages. A place variant SHALL list only the spots inside it.

#### Scenario: Locked chests in a zone
- **WHEN** Afallon holds Wooden Treasure Chest (Locked) objects that use up a Chest Key and need levels 1–10
- **THEN** the Afallon page lists Wooden Treasure Chest (Locked) with "Uses up 1 Chest Key" and "Levels 1–10", its spot count, and links to the items it can give
