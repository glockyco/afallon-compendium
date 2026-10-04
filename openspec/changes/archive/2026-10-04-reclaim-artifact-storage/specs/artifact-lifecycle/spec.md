## ADDED Requirements

### Requirement: Clean collects what retention does not protect

Clean SHALL report every run directory, object, abandoned lease, stale scratch entry, and terminal revision journal that it would remove. It SHALL also report the root or rule that retains each kept run and the logical bytes of each category. Without `--apply` it SHALL change nothing. With `--apply` it SHALL remove the set that it reports in that invocation. It SHALL remove a run directory before the objects that only that run references. It SHALL keep a run directory while a rule retains the run or while the run's manifest object is reachable.

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

### Requirement: Retention roots protect selected and accepted results

Clean SHALL treat these as retention roots:
- the latest-success references of every current build;
- the accepted release, including its catalog, publication, update report, every object that the report cites, and its rollback selection and descriptor;
- the previous reference of every pending publication selection;
- every run that the operator names to retain.

Clean SHALL also keep the release that the accepted release replaced while that release's objects remain. When the replaced release is incomplete, clean SHALL report it and SHALL NOT fail.

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

### Requirement: Retention rules keep each current build's newest products and its observations

A build SHALL be current when any of these holds:
- it is the accepted build;
- its build number is larger than the accepted build's;
- it has a publication selection that awaits recovery.

While no release is accepted, every build SHALL be current. A build identifier that is not a number SHALL count as current.

Within each current build, clean SHALL retain the two newest successful runs of catalog and of publish. Each of those runs produces one complete result that supersedes the previous one. Clean SHALL retain every successful run of every other operation, including any operation added later. Those operations produce batches of distinct observations and inputs that later runs combine. Clean SHALL also retain the newest failed or interrupted run of each operation.

A run of a build that is not current SHALL be collectible unless a retention root reaches it. Applying clean SHALL remove the latest-success references of every build that is not current.

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

### Requirement: Store maintenance excludes active operations

A command SHALL hold the store's shared lock while it holds a lease or writes an object. Its process SHALL release the lock when it ends, including when it crashes. Clean SHALL hold the lock exclusively for its whole invocation, including a dry run. While another command holds the lock, clean SHALL fail without changes. A command that needs the lock while clean holds it SHALL wait up to 30 minutes for clean to finish. If clean is still running after that time, the command SHALL fail with a maintenance error before it admits a run or writes an object. A lease that exists while clean holds the lock SHALL count as abandoned. Clean SHALL report and remove an abandoned lease, which protects nothing.

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

## MODIFIED Requirements

### Requirement: Retention follows the complete evidence dependency closure

Clean SHALL retain every object and run manifest that is reachable from a retention root or a retained run. Reachability SHALL follow reuse sources, inputs, input manifests, outputs, and output references. Clean SHALL trace an interrupted run from its latest revision.

Clean SHALL verify the closure of every retention root and of every successful run that it retains. Any missing, damaged, or unreadable dependency in those closures SHALL stop clean before it changes the store, and clean SHALL report the dependency's reference path. This does not apply to the replaced release.

A failed or interrupted run can record dependencies that never verified. For each such run that it retains, clean SHALL keep the dependencies that exist and SHALL report the missing or invalid ones without stopping. Clean SHALL identify the root or rule that retains each kept run.

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

## REMOVED Requirements

### Requirement: References report live artifacts

**Reason**: Clean now collects whatever retention does not protect. A requirement for reporting without deletion, and for revision-only cleaning, no longer describes its behavior.

**Migration**: Run `compendium clean --store <dir>` without `--apply` to get the retention report. These requirements replace this one: "Clean collects what retention does not protect", "Retention roots protect selected and accepted results", "Retention rules keep each current build's newest products and its observations", and "Store maintenance excludes active operations". Pending-object reporting for active operations is replaced by the store lock, which prevents clean from running while any lease is held.
