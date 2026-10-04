## Why

The artifact store never deletes anything. It grew to 280 GB in three weeks. 245 GB of that came from 120 catalog runs: each run seals a new database of up to 3.2 GB, and rebuilding one takes a median of 1.1 minutes. Publication roots copy every published file byte for byte, and 160 experiment roots under `local/` held another 84 GB. Retention reporting exists but no command uses it. It also treats the accepted release as garbage, fails on legacy references, and counts leases left by crashed commands as live. So nothing can be deleted safely today.

## What Changes

- **BREAKING**: `compendium clean` collects what no retention rule protects. It removes collectible run directories, unreachable objects, abandoned leases, and scratch left by crashed commands. Without `--apply` it remains a dry run. It still compacts the revisions of terminal runs. It replaces the report-only reachability API and the revision-only maintenance API.
- Retention roots are the latest-success references of current builds, the accepted release with every object its update report cites, pending publication selections, and runs named with `--retain-run`. Clean also keeps the release that the accepted one replaced while its objects remain. Every catalog already records the scans, rules evidence, coverage policy, and imagery it used, so these roots keep exactly the evidence that the shipped and selected results rest on.
- Current builds are the accepted build, any newer build, and any build with a publication selection awaiting recovery. Older builds leave retention automatically. Clean removes their latest-success references and keeps only what the accepted and replaced releases reach. Nothing is retained permanently, and no build has to be retired by hand.
- Within a current build, catalog and publish keep their two newest successful runs, because each produces one complete result that supersedes the previous one. Every other operation keeps all its successful runs, because those runs are batches of distinct observations and inputs, such as scan shards, captured scenes, game maps, and registered inputs, that later runs combine. Each operation also keeps its newest failed or interrupted run for diagnosis. No rule depends on age.
- A store lock keeps maintenance away from active operations. Every lease and every unprotected object write holds the lock shared. Clean holds it exclusively and fails at once while another operation runs. A command that starts during clean waits up to 30 minutes for it to finish. So any lease that remains while clean holds the lock belongs to a crashed command, and clean releases it.
- An operation keeps its lease until a durable reference names what it keeps. Acceptance holds its lease from evidence verification until the accepted-build descriptor is written.
- Clean deletes nothing when a root or a successful retained run has a missing, damaged, or unreadable dependency, and it names that dependency. Failed and interrupted runs can record dependencies that never verified, so for those clean keeps what exists and reports the rest. It never deletes runtime receipts or entries that the pipeline does not create. It reports those entries with their sizes.
- Publication materializes files as copy-on-write clones of verified store objects where the filesystem supports clones. It still verifies every materialized file.
- A one-time cutover prepares the existing store. Builds `25153357`, `25419293`, and `25434619` are no longer current, so they leave retention. That includes the seven legacy run manifests of `25153357`, which no current reader accepts. Collection also releases the four leases left by two interrupted publications on 2 October.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artifact-lifecycle`: Retention reporting becomes collection. The requirements now cover retention roots, build-scoped retention rules, the store lock, lease scope, scratch cleanup, and the integrity gate. They replace the report-only and revision-only clean requirements.
- `static-publication`: Materialized publication files share storage with their verified store objects.

## Impact

- Code: `packages/artifacts` gains the store lock and lock-holding leases and object writes, and a collector replaces `gc.ts` and `maintenance.ts`. `packages/contracts` drops the unused reachability report schema. `packages/publication` gains clone materialization and exposes pending selection references. `apps/compendium-cli` gets the clean command, the retention policy, accepted-release roots, and the acceptance lease scope. `README.md` is updated.
- Operators: Run `clean` while no other store command runs. Review the dry run, then apply it. Store commands wait while clean runs. A simulation on the current store keeps about 21 GB of 280 GB. Collection cannot be undone. A collected candidate is rebuilt by running catalog and publish again.
- Compatibility: The active `show-update-changes` change compares a new-build candidate with the accepted build's catalog. That catalog stays a retention root until the next acceptance and then stays as part of the replaced release. Step reuse reads only latest-success references, so it does not change. Staging, deployment, and production rollback read publication roots rather than the store, so they do not change either. Runtime ownership receipts are left in place.
