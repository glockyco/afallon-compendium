## 1. Publication

- [x] 1.1 Query the adventurer world settings rows per item and publish them in item documents: kit upgrades with the adventurer, equipment bands with the content level, and job rewards with the reward chance.
- [x] 1.2 Add the `itemAdventurerOnly` coverage group and keep those items out of `itemWithoutSource`. Verify with a publication test of an item whose only relation is a kit upgrade.

## 2. Site

- [x] 2.1 Show the Adventurers section on item pages and the adventurer-only answer in How to get it.

## 3. Proof

- [ ] 3.1 Check a tank kit item, an equipment band item with a player source, and the coverage page in the browser at 1440 and 390 px.
- [ ] 3.2 Run the repository checks and `openspec validate show-adventurer-gear --strict`.
