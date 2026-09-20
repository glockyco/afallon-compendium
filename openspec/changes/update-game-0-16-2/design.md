## Context

See `proposal.md` for motivation. The selected pipeline describes Steam build 25153357. `buildIdentity` already binds scans and captures to the Steam build plus `GameAssembly.dll`, `UnityPlayer.dll`, and `global-metadata.dat` hashes. Candidate mode already protects selected artifact references, and catalog admission already rejects cross-build inputs.

The missing boundary is before extraction. The repository has no command that asks Steam to update Afallon, proves Steam completed the request, snapshots the installed identity, or organizes a build-to-build review. Previous schema recovery used Cpp2IL from a temporary path. Recovered declarations and generated interop assemblies are ignored evidence, not a repeatable update stage.

The 0.16.2 world merge invalidates assumptions embedded in `local/reviewed-map-spaces.json`, traversal plans, restoration settings, and capture plans. Names from the prior build cannot prove that coordinates or source identities survived.

## Goals / Non-Goals

**Goals:**

- Make the Steam update and installation identity reproducible and testable.
- Preserve one prior recovered declaration snapshot for direct build comparison.
- Use inventory evidence to generate the current target review instead of editing the prior target list by label.
- Keep all new-build pipeline work in candidate mode until one explicit selection step.
- Produce one machine-readable report that accounts for every 0.16.2 risk area and selected artifact.

**Non-Goals:**

- Automate Steam account authentication or install CrossOver.
- Treat patch-note totals or names as canonical data.
- Publish mutable character, auction, mail, bank, friend, or queue state.
- Add compendium pages merely because 0.16.2 adds an in-game interface.
- Deploy production as part of update acceptance.
- Preserve prior outdoor scene bindings as compatibility aliases.

## Decisions

### Add a narrow `compendium update` command

The command will read the configured Afallon installation and derive its Steam manifest, CrossOver bottle, Steam logs, and launcher. It will record the initial manifest and input hashes, start or reuse Steam inside the bottle, and send `steam://validate/2597810`.

The command will read only log bytes appended after its own request. It will wait for an Afallon `removed from schedule` result, then wait for `StateFlags` to settle at `4`. It will report an unchanged build as a successful validation. Process exit only proves that CrossOver accepted the URL, so it is not a completion condition.

The implementation will isolate manifest parsing, appended-log parsing, process execution, and polling behind small functions. Tests will use a temporary bottle tree and a scripted process runner. This follows the measured Ancient Kingdoms mechanism without importing its .NET build-tool architecture.

Alternative: open Steam and ask the operator to watch it. Rejected because it cannot distinguish accepted, suspended, incomplete, and already-current outcomes.

Alternative: invoke `steam://install/2597810`. Rejected because the sibling workflow measured that this can defer the download. Validation actively schedules work and verifies installed files.

### Store an immutable local update receipt

A successful command will write a content-addressed receipt under the configured artifact store. The receipt will include schema version, requested release label, app ID, previous and current manifest fields, previous and current input hashes, completion evidence offsets, and timestamp. The release label is metadata. The current Steam build and hashes remain the extraction key.

The command will not change any latest-success reference. Installation mutation is unavoidable, but data selection is independent and remains on the prior build.

Alternative: print JSON only. Rejected because later reconciliation needs a stable input and terminal capture is easy to lose.

### Snapshot schema declarations by build before runtime reconciliation

A repository command will run a pinned Cpp2IL version against the completed installation and write into an ignored staging directory. On success it will atomically promote the output to `.recovered/steam-<build>-<metadata-hash-prefix>/`, record the tool version and complete input identity, and retain the current entry plus one previous entry. A stable ignored pointer will identify the current snapshot.

The update review will compare the two declaration trees before editing probes. This detects renamed or added types and fields, but it does not establish behavior. Runtime observations remain required for supported facts.

Alternative: rely only on regenerated MelonLoader interop assemblies. Rejected because they are replaced in place and provide no retained build-to-build comparison.

Alternative: commit recovered declarations. Rejected because game binaries and recovered code stay outside Git.

### Separate discovery, compatibility repair, and full extraction

The first runtime action on 0.16.2 will be a candidate current-scene inventory run. Its world inventory and canonical data will establish current scenes, addressable sources, entity counts, and supported source shapes. The update report will compare these records with the prior selected scan.

Compatibility repairs will follow observed failures and declaration differences. Collectors and decoders will change only when 0.16.2 evidence requires it. After repairs, a reviewed full target plan will enumerate every current build scene and streamed source required by coverage. It will not retain retired targets to preserve prior counts.

A release-note matrix in the update report will name each risk area, the evidence that resolves it, its disposition, and any contract change. `supported-unchanged`, `supported-changed`, `not-authored`, and `unsupported` are explicit states. Free-form completion notes are insufficient.

### Rebuild spatial evidence from the merged world

The current world inventory will define the new outdoor scene and streamed-source topology. A new build-scoped map-space profile will bind those identities to one `world-surface` map space. Existing coordinates can be used as comparison hints only. Current-build landmarks, map zones, geometry, and runtime positions must establish each frame.

Traversal and restoration settings will move to a safe location in the merged world. Every current teleport and flight endpoint found by supported action or connection collectors will resolve through the new profile. Removed outdoor scene targets and bindings will be deleted rather than aliased.

Game-map imagery will be recaptured when its current-build content hash changes. Optional terrain capture will be regenerated only where the selected presentation still uses it. No prior-build raster will count as 0.16.2 coverage.

### Build all 0.16.2 outputs as candidates

Scan, imagery registration, catalog, and publication commands will use candidate mode. Their plans will reference only 0.16.2 objects and reviewed inputs. Candidate publication verification will compare semantic domains with the prior publication, but count changes are review signals rather than automatic failures because this patch intentionally adds and removes content.

The acceptance report will bind:

- the update and schema-snapshot receipts;
- previous and current build identities;
- declaration and inventory differences;
- full scan and capture run identities;
- reviewed profile and plan identities;
- release-note matrix dispositions;
- catalog and publication identities and coverage;
- targeted command results;
- browser observations for the merged map, search, representative new entities, relations, and coverage.

A final selection command will verify the report references and atomically move successful references and the local production stage to the accepted publication. Deployment remains a separate operator command.

Alternative: run ordinary commands without `--candidate` and rely on rollback. Rejected because each successful intermediate stage could select an unreconciled mixed state.

### Keep the first report patch-specific

The report schema will support this workflow, but the initial checklist will name 0.16.2 domains directly. It will not introduce a generic release-note language or a multi-game update framework. Later releases can extend the schema only after a second use shows a stable need.

## Risks / Trade-offs

- Steam log wording can change. Parsers must fail with retained log context, not infer success from manifest movement.
- Cpp2IL output can drift when the tool changes. Pin its version and never combine a Cpp2IL bump with a game update.
- A merged scene can preserve labels while changing coordinates. Current-build spatial controls prevent false reuse but require manual review.
- Full extraction can be long. Candidate isolation permits retries without disturbing the selected build.
- Data counts can change for legitimate reasons. The report requires explicit domain review rather than fixed equality.
- New systems may expose mutable runtime state beside authored templates. Publication must stop at the authored boundary unless a separate capability defines player-state semantics.
