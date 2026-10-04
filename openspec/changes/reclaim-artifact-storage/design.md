## Context

See `proposal.md` for motivation. The specs define the required behavior. This document explains the mechanism and the choices behind it.

### Observed implementation

- **Objects**: `ArtifactStore.putStream` (`packages/artifacts/src/store.ts:85-137`) writes a temporary file under `objects/sha256/.tmp/` and records a pending protection. It then hard-links the file into place. If the object already exists, it verifies that object and reuses it. Because of this deduplication, a writer can adopt an existing object at a moment when no root protects it.
- **Runs**: `beginArtifactRun` (`runs.ts:47-212`) creates `runs/<id>/revisions/` and a lease named after the run. When the run ends, it stores the canonical manifest as an object and writes `runs/<id>/manifest.json`. Manifests record `execution.host` and `execution.pid`, and `inspectArtifactRun` (`runs.ts:226-247`) uses them only to classify unfinished runs.
- **Leases**: `createArtifactLease` (`leases.ts:18-114`) persists `leases/<key>.json`. Schema v2 has no owner, heartbeat, or expiry, and `release()` unlinks the file. Besides run leases, scan, capture, tiles, game-map, catalog, publication, and acceptance create admission leases under random keys. A crashed command leaves all of its leases behind.
- **Selection and reuse**: Runs are selected through `refs/<build>/<operation>/latest-success.json` (`references.ts:117-160`). Step reuse through `findReusableStep` (`reuse.ts:5-21`) reads only that reference. Capture tile reuse is the exception. `findReusableTiles` (`packages/capture/src/capture-cache.ts:127-173`) scans every capture manifest of the build, including failed and unselected runs, and reuses their tile checkpoints.
- **Closure**: `verifyArtifactRunClosure` (`references.ts:54-105`) follows reuse sources, inputs and input manifests, outputs, and output references. Each manifest dependency must be a successful run of the same build. The run contract accepts only `compendium.artifact-run.v2` (`packages/contracts/src/lifecycle.ts:223`).
- **Reporting and cleaning**:
  - `reportGarbageCollection` (`gc.ts:16-98`) is called only by tests. It traces retained runs, latest-success references, and leases, and it hashes every object.
  - `compactTerminalRunRevisions` (`maintenance.ts:23-76`) is the whole of `clean` (`apps/compendium-cli/src/cli.ts:74-78`).
- **Acceptance**: `acceptUpdate` verifies the report evidence without holding a lease (`accept-update.ts:82`, `:72-76`). It then creates a lease only to store the report and rollback bytes, and releases that lease (`:130-137`) before it writes `accepted-build.json` (`:146`). The descriptor names the report, the catalog manifest and object, the publication manifest and root, and the rollback selection and descriptor objects. No other command reads store objects after publication. Staging, deployment verification, and production rollback read publication roots (`apps/site/scripts/`).
- **Publication roots**: `materializePublication` (`packages/publication/src/selection.ts:105-165`) copies each object into `<root>/publications/<root-sha>/` through a 1 MiB read/write loop, hashing as it copies.
- **Scratch**: These are removed only when the command exits normally:
  - scan working directories `.scan-<uuid>` (`apps/compendium-cli/src/scan.ts:35`, `:139-140`);
  - capture workspaces `.work/<runId>` (`packages/capture/src/content-run.ts`);
  - catalog candidates `runs/<id>/candidate.sqlite` and `runs/<id>/.catalog-<uuid>/` (`packages/catalog/src/application.ts:42-65`, `assembly.ts:39-62`);
  - object temporaries.

  Runtime ownership receipts in `.runtime/` are never removed, and the runtime ownership protocol reads them (`packages/runtime/src/runtime.ts`).
- **Locks**: Runtime ownership and publication selection each use a SQLite `BEGIN EXCLUSIVE` transaction as a lock (`runtime.ts`; `packages/publication/src/application.ts:115-123`). The store itself has no lock.

### Measured store (2026-10-04, before cutover)

- **Size**: 280 GB in 259,544 objects and 1,474 run directories, with 21 further non-run entries in `runs/`.
- **Catalog output**: 120 successful catalog runs first stored 245.1 GB, up to 3.16 GB per run. A catalog run's median duration is 1.1 minutes.
- **Evidence**: Scans stored 16.6 GB across 78 successful runs and 2.3 GB across 25 failed runs. Captures stored 4.8 GB across 41 successful runs and 4.5 GB across 22 failed runs. 587 register runs stored 0.2 GB.
- **Roots**: Latest-success closures hold 22.2 GB, the accepted release 8.8 GB, and the replaced release 8.7 GB. Together they hold 28.7 GB.
- **Leases**: Four leases from two publish runs interrupted on 2026-10-02 protect 11.8 GB. No live command holds them.
- **Orphans**: 6,438 objects (2.0 GB) are referenced by no run.
- **Scratch**: `.scan-*` holds 1.1 GB.
- **Unmanaged entries**: 55 store-root entries hold 4.1 GB of research output written through the runtime output root. `.work/` holds 17 MB of non-run entries. `.runtime/` holds 1,505 receipts (5.9 MB).
- **Legacy data**: Seven runs of build `25153357` use `compendium.artifact-run.v1`. About 1.0 GB is referenced only by them. That build's three latest-success references name v1 manifests that were never stored as objects. `readLatestSuccess` therefore fails with `ENOENT`, and it would fail schema validation even if the objects existed.
- **Publication roots**: 160 experiment roots under `local/` held 84 GB before they were deleted on 2026-10-04. On the Data volume, copying a 512 MiB file through the current loop used 512 MiB of free space, and Bun's `copyFile` used none.

The table simulates retention policies on this store as of 2026-10-04. The accepted build is `25653798`, and no newer build exists. "Release roots" means the accepted release and the replaced release, including every object their update reports cite, together with the latest-success references of the accepted build. The current build has 66 successful catalog runs and 566 successful runs of other operations.

| Policy | Retained | Collected |
| --- | --- | --- |
| Release roots only | 15.1 GB | 264.9 GB |
| Release roots, then the two newest successful runs of every operation in current builds | 18.4 GB | 261.6 GB |
| Release roots, then the two newest successful catalog and publish runs and every other successful run of current builds (chosen) | 21.4 GB | 258.6 GB |
| Earlier draft: all evidence regardless of age or build, the newest reproducible run per build, and a 24-hour window | 77.4 GB | 202.6 GB |

Both last-two policies also keep the newest failed or interrupted run of each operation.

## Goals / Non-Goals

**Goals:**

- Bound store growth by what the accepted, replaced, selected, and newest results depend on, with no age-based rule and no permanent tier.
- Make collection safe against concurrent commands and crashed commands without relying on time-based heuristics.
- Keep deletion decisions behind an integrity gate and a reviewable dry run.
- Stop publication roots from duplicating stored bytes.

**Non-Goals:**

- Automatic or scheduled collection. Clean remains an explicit operator command.
- Pruning publication roots or the history in their `publications/` directories. Those roots are operator-owned directories outside the store, and clones make their history cheap.
- Removing runtime ownership receipts. They belong to the runtime ownership protocol and total 5.9 MB.
- A managed location for research output written through the runtime. Clean reports those entries and leaves them in place.
- Compressing catalog databases or changing step reuse.

## Decisions

### 1. One store lock provides both liveness and exclusion

The store gets a lock file, `.store-lock.sqlite`, at its root. It stays in rollback-journal mode, never WAL, because WAL lets readers coexist with an exclusive writer.

- A lease opens its own connection, starts a transaction, and reads `sqlite_schema`. The resulting shared lock lasts until the lease is released.
- An object write without a protection holds the shared lock in the same way for the duration of the write.
- Clean runs `BEGIN EXCLUSIVE` with a zero busy timeout, so it fails at once when any shared holder exists.
- Writers wait up to 30 minutes for a running clean and then fail with a maintenance error, before they admit a run or write an object. On the current store, clean is expected to finish within minutes: it hashes about 21 GB of retained objects and unlinks about 250,000 files. The wait is injectable, so tests can exercise both outcomes in milliseconds.
- The operating system drops the lock when the holding process exits, so a crash cannot leave the store locked.
- Only SQLite opens the lock file. POSIX advisory locks drop when any descriptor of the file closes, and SQLite's unix VFS accounts for that.

While clean holds the exclusive lock, no command can hold a lease. Every lease file present at that point therefore belongs to a dead process and is abandoned. This needs no PIDs, heartbeats, or expiry fields.

The lock also closes a race that liveness alone leaves open. Clean computes reachability. Then a writer reaches the deduplication path in `putStream` and adopts an existing object that clean has classified as unreachable. Then clean deletes it. With the lock, the writer cannot run between the computation and the deletion.

The repository already uses SQLite exclusive transactions as locks for runtime ownership and publication selection. A throwaway check with Bun 1.4.2 and `bun:sqlite` confirmed every behavior that this decision relies on:
- While another process holds a shared read transaction, `BEGIN EXCLUSIVE` with a zero busy timeout fails at once with "database is locked".
- Once that process releases its transaction, the exclusive transaction is acquired.
- A shared reader with a busy timeout waits for an exclusive holder and is acquired about 1.6 s later, once the holder releases.
- When a shared holder is killed with SIGKILL, its lock is released.
- A shared transaction on a second connection in the same process also blocks the exclusive transaction.

Alternatives considered:
- **PID and host liveness**: Runs already record their PID and host. But admission leases have no owner, PIDs are reused, a foreign host cannot be checked, and liveness does not prevent the deduplication race.
- **Git-style grace periods by modification time**: This needs the reuse path to freshen modification times and still leaves crashed leases.
- **Lock directories or PID files**: These go stale after a crash.
- **`flock` through FFI**: This needs platform glue, and the SQLite precedent already exists.

### 2. Retention is roots, build-scoped rules, and closure, with mechanism separate from policy

`packages/artifacts` owns the mechanism: the lock, the inventory, closure tracing, the integrity gate, the plan, and the sweep. Its policy input consists of:
- labeled object and manifest roots, each marked strict or best-effort;
- the run IDs to retain;
- the set of current builds;
- the operations whose runs are whole-build products.

Latest-success references and leases are store concepts, so the package reads them itself. It reads only the references of current builds.

`apps/compendium-cli/src/clean.ts` owns the policy. It collects:
- the accepted-release roots from the acceptance module;
- the pending selection references from the publication package;
- the current builds, derived from the accepted descriptor and the build numbers in the inventory;
- the product operations, catalog and publish;
- the command-line flags.

Following the project context, this is concrete and game-specific rather than a general retention framework.

Evidence matters only through what consumes it:
- **Scans** are catalog inputs (`packages/catalog/src/application.ts:25-26`), and the update report cites them (`packages/contracts/src/update-report.ts:76`).
- **Captures, game maps, and tiles** become catalog imagery. Capture tile reuse also reads every capture run of the build (`capture-cache.ts:127-173`).
- **Registered inputs** are spatial profiles, coverage reviews, mechanics rules, presentations, and release notes. A rules record cites the runtime checks behind its rules, and catalog admission verifies every cited object (`packages/catalog/src/evidence.ts:341-349`).
- **Failed runs** serve diagnosis only. A manifest dependency must be a successful run (`references.ts:80-82`).

Every catalog run records all its admitted sources as references on both of its outputs (`application.ts:46-55`). Those sources include scan manifests, rules evidence objects, the coverage policy, imagery inputs, and the capture or game-map manifests behind the imagery. So the closure of a retained catalog already contains exactly the evidence that the catalog rests on.

A game update makes old observations irreplaceable, but only what the shipped result rests on must survive. The replaced release keeps that for one more acceptance cycle. Evidence therefore needs no permanent tier. Instead, it lives as long as its build is current.

Current builds:
- A build is current when it is the accepted build, when its build number is larger than the accepted build's, or when it has a publication selection awaiting recovery.
- Steam build numbers increase over time: `25153357`, `25419293`, `25434619`, `25653798`. An identifier that is not a number counts as current, and so does every build while no release is accepted.
- When a newer build is accepted, the old build keeps only what the replaced release reaches. Builds older than that leave retention entirely, latest-success references included. No operator has to retire anything.

Rules within a current build:
- **Whole-build products**: Catalog and publish runs each produce one complete result that supersedes the previous one. They make up 88% of the bytes. The two newest successful runs protect two parallel candidates.
- **Batch operations**: Scan, capture, capture-sweep, tiles, game-map, game-map-catalog, register, and update produce batches of distinct pieces, not successive versions of one result. Examples are scan shards, captured scenes, one game map per map space, and one registration per input. A "last two" rule would delete earlier members of a batch before the catalog that combines them runs. A deleted scan can only be redone while the same game build is installed. The rule would also empty the capture tile-reuse cache. Keeping every successful batch run of a current build costs 3 GB more than "last two" on today's store.
- **Unknown operations**: These count as batch operations, so a new operation is never collected before someone considers it.
- **Failures**: Each operation keeps its newest failed or interrupted run for diagnosis.

Alternatives considered:
- **A retention window**: Catalog churn then decides the store size. The 24-hour draft kept 77 GB, and a 72-hour window would keep 218 GB.
- **Last two runs of every operation**: This keeps 18.4 GB, but it drops batch members before their catalog runs, and it drops capture reuse sources.
- **Permanent evidence**: This is unbounded, and nothing reads evidence that no retained result reaches.
- **Explicit build retirement**: Retirement is manual and easy to forget. Build currency derives the same outcome from the accepted descriptor.
- **Explicit candidate references or persistent pins**: These add selection state to every command, while `--retain-run` covers the ad hoc need.
- **A retention class in each run manifest**: This changes the schema of every run, and the existing manifests would need the same table anyway.

### 3. Classify runs by header and verify only what is retained

The inventory reads each run directory's header: run ID, build, operation, status, and timestamps. It reads them from `manifest.json`, or from the latest revision when the manifest is missing.
- A directory with a manifest is terminal.
- A directory with only revisions is interrupted. No run can be live under the exclusive lock.
- A directory with neither is unmanaged.

Both manifest versions share the header. Build `25153357` is no longer current, so its v1 runs are collected without any v1 support code.

Verification differs by run:
- **Roots and successful runs**: Their closures must pass the v2 run contract and full verification. A v1 manifest in such a closure fails as unreadable, and clean names the run.
- **Failed and interrupted runs**: These are traced on a best-effort basis. A failed manifest can name inputs that never verified: when preparation fails, `beginArtifactRun` writes its normalized inputs into the failed manifest anyway (`runs.ts:200-209`). For example, catalog runs `aa1b3488` and `ed9f66c2` and game-map run `ea0c682e` all failed with `ENOENT`. For such runs, clean keeps every referenced identity that exists, follows the manifest dependencies that pass the contract, and reports the rest as warnings.
- **Interrupted runs**: These are traced from their latest revision, because they have no manifest object. The latest revision lists their inputs, their registered outputs, and the outputs' references.

Clean hashes the objects of strict closures once per invocation. On the current store that is about 21 GB. It only stats unreachable objects, because their integrity cannot change the decision to delete them.

### 4. Collect in an order that survives interruption

Clean computes and applies the plan under a single exclusive lock. Apply then runs these steps in order:
1. remove the latest-success references of builds that are no longer current;
2. remove abandoned lease files;
3. remove collectible run directories;
4. remove unreachable objects;
5. remove scratch;
6. compact the revisions of terminal runs.

Each step removes only entries that nothing retained names. An interruption therefore leaves orphans, which the next clean collects.

References go first, so no reference ever names a collected run. Build currency is derived on every run from the accepted descriptor, so an interrupted clean leaves no state behind, and the next clean finishes the work.

The report counts logical bytes. Clones can share blocks, so the space actually freed can be smaller.

### 5. Owners supply the accepted, replaced, and pending roots

- **Accepted release**: The acceptance module exports one enumeration of accepted-release roots. It covers the descriptor's report, catalog manifest and object, publication manifest and root, and rollback selection and descriptor objects. It also covers every identity the update report cites, using the list that `verifyReportEvidence` checks today. Acceptance and clean share this enumeration, so a new report field cannot be verified at acceptance and then dropped by retention.
- **Replaced release**: Clean parses the rollback descriptor object with the accepted-build schema and enumerates its roots the same way, but treats them as best-effort. Clean does not follow the replaced release's own rollback: retention keeps one release back. No supported command restores an older descriptor. Production rollback goes through Wrangler, and acceptance restores the descriptor only inside its own failed invocation. The replaced release is therefore a recovery aid, and an incomplete one must not block maintenance.
- **Pending selections**: The publication package owns the selection journals. It exposes the latest-success pointer that recovery would restore from each pending journal in `refs/<build>/publish/`. Journals in the preparing or settled state add nothing.

### 6. Leases end only at durable references

Acceptance creates its lease before it verifies the report evidence. It protects the cited identities and manifests and holds the lease until `accepted-build.json` has been written.

Scan, register, catalog, and publish already select before they release their run leases (`apps/compendium-cli/src/scan.ts:139-142`, `register.ts`, `packages/catalog/src/application.ts:57-65`, `packages/publication/src/application.ts:236-248`). Candidate runs release without selecting, by design: the retention rules then decide.

### 7. Publications clone verified objects

`materialize` calls `copyFile(source, destination, COPYFILE_EXCL | COPYFILE_FICLONE)` and then checks the destination with the existing `verifyFile` before marking it read-only. On APFS the copy is a clone that shares blocks with the store object. Across volumes or on filesystems without clones, the call falls back to a byte copy.

A clone keeps its blocks after its source object is deleted, so collection never invalidates a materialized publication. Verification now only reads the destination instead of reading the source and writing the destination.

### 8. One command produces the dry-run report

`compendium clean --store DIR [--apply] [--retain-run RUN]...` replaces both report-only APIs and keeps the existing `--apply` convention. It has no age or retirement options, because build currency and the two-newest rule are derived from the store itself.

It prints one JSON report containing:
- the policy;
- roots with their labels;
- warnings, such as an incomplete replaced release;
- the current builds and retained-run counts by rule;
- collected runs with build, operation, status, and time;
- counts and logical bytes for retained and collected objects;
- abandoned leases;
- scratch;
- revision journals;
- unmanaged entries with sizes.

It exits with a non-zero status when the store is busy or when integrity verification fails.

`reportGarbageCollection`, `GarbageCollectionPolicy`, `compactTerminalRunRevisions`, and the `compendium.artifact-gc-report.v1` schema are removed. The report is console output rather than a persisted artifact, so it uses a TypeScript type instead of a registered schema.

## Risks / Trade-offs

- [A third parallel catalog or publish candidate is collected while still in use] → Only the two newest successful product runs per current build remain. The dry run lists the others, and `--retain-run` keeps one. Publication bytes are deterministic, so rebuilding takes catalog and publish again. Sealed catalog bytes may differ, which would require the update report to be authored again.
- [Clean cannot start while agents run store commands] → Clean fails at once and names the leases. The operator reruns it when the store is idle.
- [Store commands stall while clean runs] → The wait is bounded. Clean's duration is dominated by hashing the retained objects.
- [A damaged record blocks clean] → The report names the reference path, and the operator repairs the record. Clean never deletes around a damaged record. A record in a build that is no longer current blocks nothing, because nothing in that build is retained except what the releases reach.
- [Build numbers stop increasing] → Currency compares Steam build numbers. If an older number were ever accepted again, the builds above it would count as current and be retained until a later acceptance, which wastes space but loses nothing.
- [A rules record cites evidence registered under a build that is no longer current] → That evidence survives only while a retained catalog references it. Rules records are verified against one game binary, so their evidence is normally registered under the same build.
- [Clones make the freed space smaller than the reported bytes] → The report states logical bytes.
- [SQLite lock semantics] → Tests exercise shared and exclusive holders across processes, waiting, and release on process exit. The lock file stays in rollback-journal mode.
- [Deletion is irreversible] → Clean defaults to a dry run, checks integrity first, and protects every root. The cutover requires the operator to review the dry run.

## Migration Plan

1. Land the store lock in leases and unprotected object writes, together with the acceptance lease scope. Nothing is deleted at this stage.
2. Land the collector, the policy composition, and the command. Verify them on fixture stores and with a dry run of the real store.
3. Land clone materialization.
4. Cut over:
   - Stop all store commands.
   - Run a dry run. It should show builds `25153357`, `25419293`, and `25434619` leaving retention.
   - Have the operator review it, then apply it.
   - Verify the accepted release, the latest-success references, and staging from the accepted publication root.
5. Update `README.md`. When the deltas are synced, update the artifact-lifecycle purpose so that it describes collection.

Rollback: Reverting the code restores report-only behavior. Collected data cannot be recovered, which is why the cutover depends on the reviewed dry run and the integrity gate.
