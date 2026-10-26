# artifact-lifecycle Specification

## Purpose

Provide content-addressed evidence, verifiable run lineage, and explicit successful-run selection for the compendium pipeline. Retain what the accepted release, current selections, and current builds depend on, and collect the rest without treating unselected or partial evidence as a successful result.

## Requirements

### Requirement: Artifacts have content identities

Every stored artifact SHALL be identified by the SHA-256 hash and byte count of its content. The store SHALL retain one immutable object for a hash, verify an existing object's bytes before reuse, and keep logical names in run manifests rather than object paths. It SHALL reject an existing object whose bytes disagree with its identity.

#### Scenario: Two runs produce identical evidence
- **WHEN** two runs register byte-identical evidence
- **THEN** both manifests reference the same content identity
- **AND** the store retains one object for those bytes

#### Scenario: A stored object is damaged
- **WHEN** verification finds bytes that do not match the object's content identity
- **THEN** the object is not reused or replaced under that identity
- **AND** verification reports the expected and observed hashes

### Requirement: Runs remain immutable and failure-safe

An admitted run SHALL record its game build, operation, settings, schema identities, implementation fingerprint, input and output identities, timestamps, status, and any failure evidence. A terminal run manifest and its registered artifact references SHALL be immutable. Only a verified successful run SHALL be eligible to replace the latest-success reference for its build and operation.

#### Scenario: A run fails after producing some outputs
- **WHEN** an admitted operation fails after registering artifacts
- **THEN** its terminal manifest records the failure and registered content identities
- **AND** the previous latest-success reference remains unchanged

#### Scenario: A completed manifest is changed
- **WHEN** a caller attempts to mutate a terminal run or its artifact references
- **THEN** the lifecycle rejects the mutation
- **AND** the original manifest remains verifiable

### Requirement: Reuse follows complete step fingerprints

A reusable step result SHALL match the game build, operation, settings, input content identities, schema identities, executable dependency fingerprint, and probe hashes of the new run. A change to an executable dependency SHALL change the fingerprint without a maintained file list; an unrelated file SHALL NOT change it. Reuse SHALL verify the selected source run and record its identity and outputs in the consuming run.

#### Scenario: A transitive implementation dependency changes
- **WHEN** code or an included probe used by the step changes
- **THEN** the step receives a different implementation fingerprint
- **AND** the prior selected outputs do not qualify for step reuse

#### Scenario: Inputs and implementation are unchanged
- **WHEN** a selected successful step has matching build, operation, settings, schemas, inputs, and implementation identity
- **THEN** its verified output identities are eligible for reuse
- **AND** a run that reuses them records the source run and outputs in its manifest

### Requirement: All pipeline operations use one run contract

Scan, capture, catalog, and publication SHALL record build, settings, schema identities, implementation identity, inputs, outputs, outcomes, and failures through the artifact-run contract. Successful downstream operations SHALL verify registered input objects and run manifests instead of relying on copied run files.

#### Scenario: A fresh scan feeds the offline pipeline
- **WHEN** an operator supplies a successful scan to catalog construction and then publication
- **THEN** downstream stages resolve registered input identities and manifests from the artifact store
- **AND** the publication retains its catalog and evidence lineage through those references

### Requirement: Operational failures preserve a terminal evidence record

After run admission, a preparation or execution failure SHALL retain the registered outputs and attributable failure in a terminal run when finalization succeeds, without changing a prior successful reference. Invalid arguments rejected before admission SHALL require no runtime mutation. Run inspection SHALL distinguish a running record, an interrupted record, and a terminal record.

#### Scenario: Planning fails after evidence collection
- **WHEN** scan planning registers inventory evidence and target resolution then fails
- **THEN** the failed run retains the inventory identity and attributed error
- **AND** the previous successful scan remains selected

#### Scenario: Reference selection fails after output verification
- **WHEN** a terminal successful run exists but replacement of its latest-success reference fails
- **THEN** the previous reference remains valid and the operation reports selection failure
- **AND** the successful terminal manifest remains immutable

### Requirement: Retention follows the complete evidence dependency closure

Clean SHALL retain every object and run manifest that is reachable from a retention root or a retained run. Reachability SHALL follow reuse sources, inputs, input manifests, outputs, and output references.

#### Scenario: A retained catalog outlives its source run retention window
- **WHEN** a retained catalog manifest references a scan manifest whose run no retention rule keeps on its own, as when the replaced release's catalog belongs to a build that is no longer current
- **THEN** clean still retains and verifies the scan evidence through the catalog lineage
- **AND** it identifies the retaining run and the reference path

#### Scenario: A selected publication is retained
- **WHEN** the latest-success publication run refers to its catalog, imagery, and resource objects
- **THEN** clean traverses, verifies, and retains those recorded dependencies
- **AND** clean does not treat an incomplete temporary write as a published object

#### Scenario: A retained reference is broken
- **WHEN** a latest-success reference names a manifest object that is missing, or that the current run contract does not accept
- **THEN** clean deletes nothing
- **AND** it reports the reference and the missing or unreadable identity

#### Scenario: A failed evidence run names a missing input
- **WHEN** a retained failed scan run names an input object that does not exist
- **THEN** clean retains the run and its existing objects
- **AND** it reports the missing input and continues collecting

#### Scenario: Retention follows the complete evidence dependency closure
- **WHEN** A retained run reaches objects through reuse sources, inputs, input manifests, outputs, and output references.
- **THEN** Clean retains every reachable object and run manifest through those references.

### Requirement: Interrupted run tracing uses the latest revision

Clean SHALL trace an interrupted run from its latest revision.

#### Scenario: Interrupted run tracing uses the latest revision
- **WHEN** An interrupted run has multiple revisions.
- **THEN** Clean traces the interrupted run from its latest revision.

### Requirement: Protected evidence closures are verified before changes

Clean SHALL verify the closure of every retention root and of every successful run that it retains. Any missing, damaged, or unreadable dependency in those closures SHALL stop clean before it changes the store, and clean SHALL report the dependency's reference path. This does not apply to the replaced release.

#### Scenario: Protected evidence closures are verified before changes
- **WHEN** A retained successful run other than the replaced release has a damaged dependency in its closure.
- **THEN** Clean stops before changing the store and reports the dependency's reference path.

### Requirement: Unverified failed run dependencies do not stop clean

A failed or interrupted run can record dependencies that never verified. For each such run that it retains, clean SHALL keep the dependencies that exist and SHALL report the missing or invalid ones without stopping.

#### Scenario: Unverified failed run dependencies do not stop clean
- **WHEN** A retained interrupted run records existing dependencies and a missing dependency that never verified.
- **THEN** Clean keeps the existing dependencies, reports the missing dependency, and does not stop.

### Requirement: Kept runs identify their retention basis

Clean SHALL identify the root or rule that retains each kept run.

#### Scenario: Kept runs identify their retention basis
- **WHEN** Clean keeps a run because a retention rule retains it.
- **THEN** Clean identifies the rule that retains the kept run.
### Requirement: Integrity verification has bounded memory use

Object registration and hash verification SHALL stream bytes using memory bounded independently of object size. Run reuse SHALL verify referenced inputs, outputs, and dependency manifests before accepting them. A relocated artifact store SHALL resolve content identities and relative run references without original working directories.

#### Scenario: A large catalog object is verified
- **WHEN** the store verifies an object larger than its verification buffer
- **THEN** verification hashes the complete byte stream in bounded chunks
- **AND** corruption near the end of the object causes rejection

#### Scenario: Evidence moves to another store root
- **WHEN** all referenced objects, manifests, and selections move intact to a different root
- **THEN** their content identities and relative run references remain resolvable
- **AND** consumers do not need the original scratch directory

### Requirement: Clean collects what retention does not protect

Clean SHALL report every run directory, object, abandoned lease, stale scratch entry, and terminal revision journal that it would remove.

#### Scenario: A dry run leaves the store unchanged
- **WHEN** an operator runs clean without `--apply`
- **THEN** it reports the runs, objects, leases, scratch entries, and revision journals that it would remove, and the roots and rules that retain the remaining runs
- **AND** the store is unchanged

#### Scenario: A superseded candidate is collected
- **WHEN** a successful catalog run is not selected, not accepted, and not one of the two newest successful catalog runs of its build
- **THEN** applying clean removes its run directory and every object that no retained run or root references
- **AND** objects that a retained run also references remain

#### Scenario: A shared object remains protected
- **WHEN** a retained run and a collected run reference the same object
- **THEN** clean keeps the object
- **AND** the retained run remains verifiable

#### Scenario: Collection stops part way
- **WHEN** an applied clean stops after it removes some run directories and before it removes their objects
- **THEN** no remaining reference or run names a removed object
- **AND** the next clean removes the objects that were left unreachable

#### Scenario: Clean collects what retention does not protect
- **WHEN** Clean would remove a run directory, an object, an abandoned lease, a stale scratch entry, and a terminal revision journal.
- **THEN** Clean reports every one of those items.

### Requirement: Clean reports retention reasons and category sizes

Clean SHALL also report the root or rule that retains each kept run and the logical bytes of each category.

#### Scenario: Clean reports retention reasons and category sizes
- **WHEN** Clean keeps runs and reports collection categories.
- **THEN** Clean reports each kept run's retaining root or rule and the logical bytes of each category.

### Requirement: Clean without apply leaves the store unchanged

Without `--apply` clean SHALL change nothing.

#### Scenario: Clean without apply leaves the store unchanged
- **WHEN** An operator runs clean without `--apply`.
- **THEN** Clean changes nothing.

### Requirement: Applied clean removes its reported set

With `--apply` clean SHALL remove the set that it reports in that invocation.

#### Scenario: Applied clean removes its reported set
- **WHEN** An operator runs clean with `--apply`.
- **THEN** Clean removes the set reported in that invocation.

### Requirement: Run directories are removed before exclusive objects

Clean SHALL remove a run directory before the objects that only that run references.

#### Scenario: Run directories are removed before exclusive objects
- **WHEN** Clean removes a run directory and objects referenced only by that run.
- **THEN** Clean removes the run directory before those objects.

### Requirement: Retained or reachable runs keep their directories

Clean SHALL keep a run directory while a rule retains the run or while the run's manifest object is reachable.

#### Scenario: Retained or reachable runs keep their directories
- **WHEN** No rule retains a run, but the run's manifest object is reachable.
- **THEN** Clean keeps the run directory.
### Requirement: Retention roots protect selected and accepted results

Clean SHALL treat the latest-success references of every current build as retention roots.

#### Scenario: An accepted candidate was never selected
- **WHEN** the accepted release names a candidate catalog and publication that no latest-success reference names
- **THEN** clean retains them, their closures, and the objects that the update report cites

#### Scenario: The replaced release is incomplete
- **WHEN** objects of the release named by the accepted release's rollback descriptor are missing
- **THEN** clean reports the replaced release as incomplete
- **AND** it retains the replaced release's remaining objects and continues

#### Scenario: A publication selection awaits recovery
- **WHEN** an interrupted selection leaves a pending journal whose previous reference names an earlier publication run
- **THEN** clean retains that run so that recovery can restore the reference

#### Scenario: An operator keeps a candidate
- **WHEN** an operator names a run to retain
- **THEN** clean retains that run and its closure, whatever its build and whatever the retention rules decide

#### Scenario: Retention roots protect selected and accepted results
- **WHEN** A current build has a latest-success reference.
- **THEN** Clean treats that reference as a retention root.

### Requirement: Accepted release evidence forms retention roots

Clean SHALL treat the accepted release as a retention root, including its catalog, publication, update report, every object that the report cites, and its rollback selection and descriptor.

#### Scenario: Accepted release evidence forms retention roots
- **WHEN** An accepted release includes a catalog, publication, update report citing objects, and a rollback selection and descriptor.
- **THEN** Clean treats the accepted release and all of those included items as retention roots.

### Requirement: Pending selections protect previous references

Clean SHALL treat the previous reference of every pending publication selection as a retention root.

#### Scenario: Pending selections protect previous references
- **WHEN** A pending publication selection records a previous reference.
- **THEN** Clean treats the previous reference as a retention root.

### Requirement: Operator named runs form retention roots

Clean SHALL treat every run that the operator names to retain as a retention root.

#### Scenario: Operator named runs form retention roots
- **WHEN** An operator names a run to retain.
- **THEN** Clean treats that run as a retention root.

### Requirement: Replaced releases remain while objects remain

Clean SHALL also keep the release that the accepted release replaced while that release's objects remain.

#### Scenario: Replaced releases remain while objects remain
- **WHEN** Objects remain for the release that the accepted release replaced.
- **THEN** Clean keeps the replaced release.

### Requirement: Incomplete replaced releases are reported without failure

When the replaced release is incomplete, clean SHALL report it and SHALL NOT fail.

#### Scenario: Incomplete replaced releases are reported without failure
- **WHEN** The replaced release is incomplete.
- **THEN** Clean reports the incomplete replaced release without failing.
### Requirement: Retention rules keep each current build's newest products and its observations

A build SHALL be current when any of these holds:
- it is the accepted build.
- its build number is larger than the accepted build's.
- it has a publication selection that awaits recovery.

#### Scenario: Only the two newest catalog candidates remain
- **WHEN** a current build has three unselected successful catalog runs that no root reaches
- **THEN** clean retains the two newest
- **AND** it collects the oldest

#### Scenario: A scan batch awaits its catalog
- **WHEN** five successful scan runs of the current build are newer than every catalog run of that build
- **THEN** clean retains all five

#### Scenario: Only the newest failure remains
- **WHEN** an operation of a current build has failed three times and no root reaches those runs
- **THEN** clean retains the newest failed run
- **AND** it collects the two earlier ones

#### Scenario: An earlier build stops being current
- **WHEN** a newer build has been accepted
- **THEN** clean retains only those runs and objects of earlier builds that the accepted release or the replaced release reaches
- **AND** applying clean removes the latest-success references of the earlier builds

#### Scenario: A newer build is still a candidate
- **WHEN** runs exist for a build whose number is larger than the accepted build's
- **THEN** clean applies the current-build rules to that build

#### Scenario: Retention rules keep each current build's newest products and its observations
- **WHEN** A build older than the accepted build has a publication selection awaiting recovery.
- **THEN** The build counts as current.

### Requirement: Builds are current before release acceptance

While no release is accepted, every build SHALL be current.

#### Scenario: Builds are current before release acceptance
- **WHEN** No release is accepted and several builds exist.
- **THEN** Every build counts as current.

### Requirement: Nonnumeric build identifiers remain current

A build identifier that is not a number SHALL count as current.

#### Scenario: Nonnumeric build identifiers remain current
- **WHEN** A build has the identifier "preview".
- **THEN** The build counts as current.

### Requirement: Retain the newest complete catalog and publish results

Within each current build, clean SHALL retain the two newest successful runs of catalog and of publish. Each of those runs produces one complete result that supersedes the previous one.

#### Scenario: Retain the newest complete catalog and publish results
- **WHEN** A current build has two successful catalog runs and two successful publish runs.
- **THEN** Clean retains both catalog runs and both publish runs.

### Requirement: Retain successful observation and input batches

Within each current build, clean SHALL retain every successful run of every operation other than catalog and publish, including any operation added later. Those operations produce batches of distinct observations and inputs that later runs combine.

#### Scenario: Retain successful observation and input batches
- **WHEN** A current build has successful runs of a newly added operation other than catalog or publish.
- **THEN** Clean retains every successful run of that operation.

### Requirement: Retain the newest failed or interrupted operation run

Within each current build, clean SHALL also retain the newest failed or interrupted run of each operation.

#### Scenario: Retain the newest failed or interrupted operation run
- **WHEN** A current build's newest failed or interrupted publish run is interrupted.
- **THEN** Clean retains that interrupted publish run.

### Requirement: Noncurrent runs are collectible unless rooted

A run of a build that is not current SHALL be collectible unless a retention root reaches it.

#### Scenario: Noncurrent runs are collectible unless rooted
- **WHEN** A run belongs to a noncurrent build and no retention root reaches the run.
- **THEN** The run is collectible.

### Requirement: Remove noncurrent latest-success references

Applying clean SHALL remove the latest-success references of every build that is not current.

#### Scenario: Remove noncurrent latest-success references
- **WHEN** Two noncurrent builds each have latest-success references and clean is applied.
- **THEN** Clean removes the latest-success references of both builds.
### Requirement: Store maintenance excludes active operations

A command SHALL hold the store's shared lock while it holds a lease or writes an object.

#### Scenario: Clean runs while a scan is active
- **WHEN** an operator runs clean while a scan holds a lease
- **THEN** clean fails and names the leases in the store
- **AND** the store is unchanged

#### Scenario: A command starts during a short clean
- **WHEN** a catalog command starts while clean holds the lock, and clean finishes within the wait
- **THEN** the catalog command waits for clean to finish, then admits its run

#### Scenario: Clean outlasts the wait
- **WHEN** clean still holds the lock when a waiting command's wait ends
- **THEN** the command fails with a maintenance error
- **AND** it has admitted no run and written no object

#### Scenario: A crashed command left a lease
- **WHEN** a lease file remains from a process that ended without releasing it
- **THEN** clean reports and removes the lease
- **AND** the lease no longer protects its objects

#### Scenario: Store maintenance excludes active operations
- **WHEN** A command writes an object without holding a lease.
- **THEN** The command holds the store's shared lock while writing the object.

### Requirement: Release command locks on process termination

A command's process SHALL release the store's shared lock when the process ends, including when the process crashes.

#### Scenario: Release command locks on process termination
- **WHEN** A command's process crashes while holding the store's shared lock.
- **THEN** The process releases the lock.

### Requirement: Clean holds an exclusive lock throughout invocation

Clean SHALL hold the store's lock exclusively for its whole invocation, including a dry run.

#### Scenario: Clean holds an exclusive lock throughout invocation
- **WHEN** Clean is invoked as a dry run.
- **THEN** Clean holds the store's lock exclusively for the whole dry-run invocation.

### Requirement: Clean fails without changes when another command holds the lock

While another command holds the store's lock, clean SHALL fail without changes.

#### Scenario: Clean fails without changes when another command holds the lock
- **WHEN** A command holds the store's shared lock while writing an object and clean is invoked.
- **THEN** Clean fails without making changes.

### Requirement: Commands wait for maintenance to finish

A command that needs the store's lock while clean holds the lock SHALL wait up to 30 minutes for clean to finish.

#### Scenario: Commands wait for maintenance to finish
- **WHEN** A command needs the store's lock while clean holds it and clean finishes after 10 minutes.
- **THEN** The command waits for clean to finish.

### Requirement: Maintenance timeout prevents run admission and object writes

If clean is still running after a command has waited 30 minutes for the store's lock, the command SHALL fail with a maintenance error before it admits a run or writes an object.

#### Scenario: Maintenance timeout prevents run admission and object writes
- **WHEN** Clean remains running after a command has waited 30 minutes for the store's lock.
- **THEN** The command fails with a maintenance error without admitting a run or writing an object.

### Requirement: Leases present during clean are abandoned

A lease that exists while clean holds the store's lock SHALL count as abandoned.

#### Scenario: Leases present during clean are abandoned
- **WHEN** A lease exists while clean holds the store's lock.
- **THEN** The lease counts as abandoned.

### Requirement: Report and remove unprotective abandoned leases

Clean SHALL report and remove an abandoned lease, which protects nothing.

#### Scenario: Report and remove unprotective abandoned leases
- **WHEN** Clean encounters an abandoned lease referencing an object.
- **THEN** Clean reports and removes the lease, and the lease provides no protection to the object.

### Requirement: Operations protect what they keep until a durable reference names it

A command SHALL keep its lease until a durable reference names every object that it intends to keep. That reference SHALL be a latest-success reference or the accepted-build descriptor. A candidate command MAY instead release its lease and leave its unselected run to the retention rules. Acceptance SHALL hold its lease from the moment it verifies the update report's evidence until it has written the accepted-build descriptor.

#### Scenario: Clean is requested during acceptance
- **WHEN** clean is requested after acceptance has stored the update report and before acceptance has written the accepted-build descriptor
- **THEN** clean cannot start
- **AND** the descriptor that acceptance writes names only stored objects

#### Scenario: A candidate run ends
- **WHEN** a candidate run finishes without selection and releases its lease
- **THEN** only the retention rules decide whether clean keeps the run

### Requirement: Clean removes crashed-command scratch and reports unmanaged entries

While it holds the exclusive lock, clean SHALL remove:
- temporary object files;
- scan working directories;
- capture workspaces of known runs;
- catalog candidate files left inside run directories.

Clean SHALL NOT remove runtime ownership receipts, lock files, selection journal files, or any entry that the pipeline does not create. It SHALL report each unmanaged entry, with its size, that it finds under the store root, the run index, or the capture workspace directory.

#### Scenario: A crashed scan left its working directory
- **WHEN** a scan process ended without removing its working directory
- **THEN** applying clean removes that directory

#### Scenario: Research output sits in the store root
- **WHEN** a directory that no pipeline command creates exists under the store root
- **THEN** clean reports it with its size
- **AND** it leaves the directory in place
