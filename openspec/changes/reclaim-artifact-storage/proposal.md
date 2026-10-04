## Why

The artifact store never deletes anything. It grew to 280 GB in three weeks. 245 GB of that came from 120 catalog runs: each run seals a new database of up to 3.2 GB, and rebuilding one takes a median of 1.1 minutes. Publication roots copy every published file byte for byte, and 160 experiment roots under `local/` held another 84 GB. Retention reporting exists but no command uses it. It also treats the accepted release as garbage, fails on legacy references, and counts leases left by crashed commands as live. So nothing can be deleted safely today.

## What Changes

- **BREAKING**: `compendium clean` collects what no retention rule protects. It removes collectible run directories, unreachable objects, abandoned leases, and scratch left by crashed commands. Without `--apply` it remains a dry run. It still compacts the revisions of terminal runs. It replaces the report-only reachability API and the revision-only maintenance API.
- Retention roots are the latest-success references, the accepted release with every object its update report cites, pending publication selections, and runs named with `--retain-run`. Clean also keeps the release that the accepted one replaced while its objects remain.
- Retention rules keep every run of an evidence operation regardless of age, whether it succeeded, failed, or was interrupted, because a game update makes its observations irreplaceable. They keep the newest successful run of each reproducible operation in each build. They keep every run inside the retention window, which defaults to 24 hours and is set with `--retain-hours`.
- `--retire-build` removes a build's latest-success references and collects its runs. It refuses the accepted build, the build of the replaced release, and a build with a pending publication selection.
- A store lock keeps maintenance away from active operations. Every lease and every unprotected object write holds the lock shared. Clean holds it exclusively and fails at once while another operation runs. A command that starts during clean waits up to 30 minutes for it to finish. So any lease that remains while clean holds the lock belongs to a crashed command, and clean releases it.
- An operation keeps its lease until a durable reference names what it keeps. Acceptance holds its lease from evidence verification until the accepted-build descriptor is written.
- Clean deletes nothing when a root or a successful retained run has a missing, damaged, or unreadable dependency, and it names that dependency. Failed and interrupted runs can record dependencies that never verified, so for those clean keeps what exists and reports the rest. It never deletes runtime receipts or entries that the pipeline does not create. It reports those entries with their sizes.
- Publication materializes files as copy-on-write clones of verified store objects where the filesystem supports clones. It still verifies every materialized file.
- A one-time cutover prepares the existing store. It retires legacy build `25153357`, whose seven run manifests no current reader accepts. Then it collects, which releases the four leases left by two interrupted publications on 2 October.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artifact-lifecycle`: Retention reporting becomes collection. The requirements now cover retention roots and rules, the store lock, lease scope, build retirement, scratch cleanup, and the integrity gate. They replace the report-only and revision-only clean requirements.
- `static-publication`: Materialized publication files share storage with their verified store objects.

## Impact

- Code: `packages/artifacts` gains the store lock and lock-holding leases and object writes, and a collector replaces `gc.ts` and `maintenance.ts`. `packages/contracts` drops the unused reachability report schema. `packages/publication` gains clone materialization and exposes pending selection references. `apps/compendium-cli` gets the clean command, the retention policy, accepted-release roots, and the acceptance lease scope. `README.md` is updated.
- Operators: Run `clean` while no other store command runs. Review the dry run, then apply it. Store commands wait while clean runs. A simulation on the current store keeps about 77 GB of 280 GB with the default window. Collection cannot be undone. A collected candidate is rebuilt by running catalog and publish again.
- Compatibility: The active `show-update-changes` change compares a new-build candidate with the accepted build's catalog. That catalog stays a retention root until the next acceptance and then stays as part of the replaced release. Step reuse reads only latest-success references, so it does not change. Staging, deployment, and production rollback read publication roots rather than the store, so they do not change either. Runtime ownership receipts are left in place.
