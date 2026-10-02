## 1. Capture and catalog

- [x] 1.1 Capture `AdventurerWorldSettings` job fields (`JobRegionNames`, `MaximumPresent`, `MinimumJobSeconds`, `MaximumJobSeconds`, `ExperienceBarPerJob`, `GoldPerLevelPerJob`), the `DungeonFinderSettings` tank fields (`TankItemPowerShare`, `TankGearPieces`), and the pet facts of each roster NPC's invite effect. Test the evidence contracts.
- [x] 1.2 Store and query the new facts in the catalog with their sources. Test the queries.

## 2. Runtime checks

- [x] 2.1 Run the read-only adventurer probes: settings and saved journey records, invite eligibility, Dungeon Finder level bounds and role matching. Record the results beside the review.

## 3. Guide

- [x] 3.1 Write the rules record phrases and guide sections from verified rules only, with sentences that name values from published data.
- [x] 3.2 Publish the guide, link it from the Browse menu and adventurer NPC pages, and check it in a browser at 1440 px and 390 px.
  - Result: candidate `al` (`34c23d7b`) publishes the guide with four sections. It shows at 1440 and 390 px without sideways scroll, the Browse menu lists it, Zarrok Grimhowl and the other 114 roster adventurers link How adventurers join your party, and an NPC outside the roster does not.
- [x] 3.3 Accept the catalog and publication together.
  - Result: Accepted with catalog `51f119e8` and publication `34c23d7b` (update report `local/update-report-25653798-adventurers.json`, accepted descriptor `cbb7987c` in the main checkout).
