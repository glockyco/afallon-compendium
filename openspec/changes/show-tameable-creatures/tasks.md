## 1. Evidence and contract

- [x] 1.1 Confirm canonical-to-catalog preservation of NPC rank, creature type, and tamable flag and count qualifying records from build 25653798. Canonical blob SHA-256 `08140a4da5d7814dda85eb19754bad21c3233abb86d3d366175ef86d1c80332f`: 16 of 522 NPC records qualify. Iceclaw Bear is authored at level 10, but its preceding publication has a level 20–30 scaling encounter. The 0.16.3 canonical NPC record has no tamable-flag Elite, so that exclusion uses a synthetic fixture.
- [x] 1.2 Add a variant-aware tameability fact to the public NPC contract, bump the static NPC schema identifier once, and migrate literal callers. Verify the publication test covers a qualifying Mob, an excluded flagged Elite, and a scaling qualifying Beast.

## 2. Publication and page

- [x] 2.1 Publish the eligibility fact for each NPC record and shared page only when variants agree. Verify mixed variants retain their distinct eligibility in a targeted publication test.
- [ ] 2.2 Show tameability in the title facts and a Taming fact: a Hunter of the creature's level or higher, without a pet, within 30 m, and the pet starts at the creature's level. Link Hunter only when its page is published. Verify on the 0.16.3 candidate site at 1440 and 390 px.

## 3. Validation

- [x] 3.1 Run `openspec validate show-tameable-creatures --strict` and the scoped tests. Project-wide checks are run by the integration owner after concurrent edits settle.
