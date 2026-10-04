## 1. Store lock and lease scope

- [x] 1.1 Add the store lock to `packages/artifacts`:
  - a `.store-lock.sqlite` file in rollback-journal mode;
  - a shared mode, held by an open read transaction, that waits up to 30 minutes, with the wait injectable for tests;
  - an exclusive mode that fails immediately.

  Verify with separate processes that a shared holder makes exclusive acquisition fail at once. Verify that an exclusive holder makes shared acquisition wait and then succeed after release. Verify that, with a short injected wait, a writer fails with the maintenance error before it admits a run or writes an object. Verify that killing a holder process releases the lock.
- [x] 1.2 Make each lease hold the shared lock from creation until release, and make each object write without a protection hold it for the duration of the write. Verify that lease creation and an unprotected write both wait while an exclusive holder exists. Verify that releasing a lease releases its shared lock.
- [x] 1.3 Make acceptance create its lease before it verifies the update report's evidence, and protect the cited identities and manifests. Release the lease only after `accepted-build.json` is written. In the acceptance test, verify that an exclusive acquisition attempted from the staging callback fails, and that an exclusive acquisition attempted after the report is stored also fails. Verify that a failed acceptance still releases its lease.

## 2. Collector in the artifacts package

- [x] 2.1 Replace `gc.ts` and `maintenance.ts` with a collector that works under the exclusive lock. It inventories run headers, the latest-success references of current builds, leases, scratch, and unmanaged entries. It applies the supplied roots and rules, traces the retained closures, and returns a plan. It traces interrupted runs from their latest revision. Verify each rule boundary with fixture stores:
  - a latest-success reference of a current build, and one of a build that is not current;
  - a named run;
  - the three newest successful catalog runs of a current build, of which only two are kept;
  - a batch of successful scan runs newer than every catalog run, all kept;
  - an unknown operation treated as a batch operation;
  - three failed runs of one operation, of which only the newest is kept, with an interrupted run counting as a failure;
  - a run of a build that is not current, kept only when a release root reaches it.
- [x] 2.2 Apply the plan in this order: latest-success references of builds that are no longer current, abandoned leases, run directories, unreachable objects, scratch, terminal revisions. Verify that a dry run leaves every file in the store unchanged. Verify that apply removes exactly the reported set and that shared objects remain. Verify that an apply interrupted after it removes run directories leaves no reference to a removed object, and that the next clean completes the work.
- [x] 2.3 Enforce the integrity gate. Verify that each of these stops clean before any change and names the reference path: a missing object, a damaged object, and a v1 manifest, each in the closure of a root or a successful retained run. Verify that a failed evidence run naming a missing input is retained with a warning while collection continues. Verify the same for an incomplete replaced release.
- [x] 2.4 Derive the current builds: the accepted build, every build with a larger build number, every build with a pending publication selection, every build with an identifier that is not a number, and every build while no release is accepted. Verify each case. Verify that accepting a newer build moves the earlier builds out of retention except for what the replaced release reaches.
- [x] 2.5 Remove the scratch left by crashed commands: object temporaries, `.scan-*`, `.work/<runId>` of known runs, and `candidate.sqlite` and `.catalog-*` inside run directories. Verify that each is removed. Verify that `.runtime/`, lock and journal files, and unmanaged entries remain, and that the report lists them with their sizes.
- [x] 2.6 Remove `reportGarbageCollection`, `GarbageCollectionPolicy`, `compactTerminalRunRevisions`, and the `compendium.artifact-gc-report.v1` schema. Move the protection assertions in the run, reference, and lease tests to the collector. Verify that no reference to a removed name remains and that the artifacts tests pass.

## 3. Policy composition and command

- [x] 3.1 Export one accepted-release root enumeration from the acceptance module. It covers the descriptor identities, every update-report evidence pointer, and the rollback objects, and `verifyReportEvidence` uses it. Verify on an acceptance fixture that clean retains the accepted catalog, publication, report, cited evidence, and rollback objects of a candidate that no latest-success reference names. Verify that it retains the replaced release on a best-effort basis.
- [x] 3.2 Make the publication package expose the previous references of pending publication selections. Verify that clean retains the previous publication run of a pending journal, and that preparing and settled journals add no root.
- [x] 3.3 Add `apps/compendium-cli/src/clean.ts` with the product operations, catalog and publish, and the derivation of current builds. Wire `clean --store DIR [--apply] [--retain-run RUN]...` into `cli.ts` and its help text. Verify through the CLI:
  - invalid options are rejected;
  - a busy store and an integrity failure each exit with a non-zero status without changes;
  - the JSON report lists the policy, roots, warnings, retained counts, collected runs, objects, leases, scratch, revisions, and unmanaged entries.

## 4. Publication clones

- [x] 4.1 Materialize each publication file with `copyFile`, using exclusive creation and copy-on-write cloning, then verify the file and mark it read-only. Verify that the publication tests pass. Verify that materializing a publication into a root on the store's volume reduces free space by far less than the publication's logical size. Verify that a materialized file still verifies after its source object is removed.

## 5. Documentation, verification, and cutover

- [x] 5.1 Update `README.md` with the clean command line, the retention roots, the current-build rules, the store lock's behavior, scratch and unmanaged entries, and when to run clean. Verify that the documented command matches `--help`.
- [x] 5.2 Run `bun run check`, `bun run check:dependencies`, and `bun run test`. Verify that all pass.
- [x] 5.3 While no other store command runs, dry-run clean on `artifacts/` and review the report with the operator. Verify:
  - the report shows no integrity failure;
  - it retains the accepted release, the replaced release, and the latest-success references of build `25653798`;
  - builds `25153357`, `25419293`, and `25434619` leave retention, including the seven legacy runs;
  - it lists the four abandoned leases.
- [x] 5.4 After the operator approves, apply the reviewed command. Verify:
  - a second dry run collects nothing beyond new activity;
  - the accepted catalog and publication manifests and every latest-success reference resolve;
  - staging the accepted publication root passes.

  Record free space before and after.
- [ ] 5.5 When syncing the deltas, update the artifact-lifecycle purpose so that it describes collection. Verify that `openspec validate reclaim-artifact-storage --strict` passes before archiving.

### Cutover evidence

The dry run on 2026-10-04 reported no integrity failure and no warnings. It kept 21.4 GB in 29,277 objects for current build `25653798`: 566 batch runs, 4 newest product runs, 6 newest failures, and 4 runs reached through lineage. It would collect 897 runs and 258.6 GB, including all 7 legacy runs of `25153357`. It would also remove `refs/25153357`, `refs/25419293`, `refs/25434619`, the four leases of the publications interrupted on 2 October, and 1.2 GB of scan scratch. The operator approved the report.

Applying it took 83 s and collected 897 runs and 258.6 GB. Free space on `/` rose from 189.9 GiB to 425.5 GiB. The difference from the collected bytes is space still shared with clones in publication roots. `artifacts/` now holds 25 GB.

A second dry run collected nothing, with no leases, scratch, or references left to remove. The accepted catalog run `a3f839d9` and publication run `f7950aa4` resolve with their closures, the accepted catalog object and report verify, and every latest-success reference of `25653798` resolves. Staging `local/compendium-v3-previous` in a temporary worktree passed, and its selection `7ae505cc…` and publication `de2c1ce3…` match `accepted-build.json`.
