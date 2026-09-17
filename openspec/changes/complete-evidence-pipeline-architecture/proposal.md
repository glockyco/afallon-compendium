## Why

The documented scan-to-site pipeline is not executable end to end: catalog ingestion requires retired run formats, bypasses the catalog assembler, and publication mutates its input database. Complete the architectural cutover so evidence, catalog identity, release decisions, and reader state have one authoritative path.

## What Changes

- **BREAKING**: Make catalog ingestion consume current scan target envelopes and immutable artifact references. Remove permanent extract/traverse manifest readers and copied-run assumptions after a verified one-time import.
- Use one artifact lifecycle for scan, capture, catalog, and publication. Retain planning evidence and failed-run diagnostics, stream integrity verification, and protect referenced inputs and outputs through retention tracing.
- Keep runtime ownership, cancellation, native restoration, and cleanup receipts. Close preparation failure gaps without replacing the game-specific scan and capture workflows with a generic engine.
- Move normalization from the CLI into the catalog package. Decode every field used by supported domain rules, preserve opaque evidence separately, and assemble all identities and facts through one transactional candidate database.
- Seal the catalog before downstream use. Preserve both logical catalog identity and the SQLite byte hash. Register imagery before sealing and make publication strictly read-only.
- **BREAKING**: Replace absence-of-issues release logic with build-scoped coverage obligations, reviewed scope, evidence-backed dispositions, and explicit release policy. Empty or unreviewed coverage cannot satisfy a complete release.
- Compile deterministic static publications from sealed inputs. Validate resource closure, identities, registration, and applicable coverage before atomic selection.
- Preserve the shared-world atlas while separating essential atlas resources, search, optional geometry, and selected details. Correct immutable asset caching and establish measured resource budgets.
- Centralize URL-driven selection and asynchronous loading. Keep transient UI state and the live renderer camera separate. Preserve development-only detail and authoring controls.
- Prove the complete fresh-scan-to-browser path, failure safety, semantic parity, reproducibility, and rollback before removing obsolete implementations.

## Capabilities

### New Capabilities

The main `openspec/specs/` directory is empty. These capability paths already occur in unarchived changes, so this change preserves those paths and adds uniquely named requirements. It does not duplicate their existing requirement headings.

- `artifact-lifecycle`: One production run format, immutable dependency closure, streaming integrity, and failure-safe selection across every operation.
- `scan-workflow`: Consumable target evidence, retained planning context, and preparation-safe runtime lifecycle.
- `screenshot-basemaps`: Capture reuse and pyramid outputs that consume only immutable registered evidence under the common lifecycle.
- `canonical-catalog`: One typed ingestion and assembly boundary, complete transaction scope, immutable sealing, and traceable domain transformations.
- `coverage-accounting`: Positive build-scoped obligations, reviewed dispositions, closure, and release evaluation.
- `static-publication`: Read-only compilation, typed resource closure, bounded startup projections, and correct deployment caching.
- `interactive-atlas`: Unified navigation effects, isolated resource state, progressive shared-world startup, and consistent authoring coordinates.

### Modified Capabilities

None against the current main specification tree. The design records the relationship to pending capability definitions and the required specification reconciliation before archive.

## Impact

- Affected implementation: `apps/compendium-cli`, `apps/site`, and all seven existing packages. Keep the Bun workspace, TypeBox, SQLite, HotRepl, SvelteKit, deck.gl, and static Cloudflare deployment.
- Operator compatibility: catalog and publication plans become immutable-reference contracts. Retained legacy evidence requires a bounded one-time importer. Old commands, manifest readers, and runtime compatibility branches do not survive cutover.
- Product compatibility: all published maps remain together at reviewed translation-only offsets. Game-provided imagery remains the default. Captured terrain remains opt-in and overworld-only. No floors, inferred gameplay facts, production evidence panels, request-time services, or new search engine are introduced.
- This change follows `rebuild-project-architecture` and retains the domain requirements from `build-screenshot-first-map`. Checked tasks in the former are intent and historical evidence, not proof of current integration.
- The older configuration still describes captured imagery as primary. Some pending specifications also disagree about visible completeness notices and detail-panel scenarios. This change preserves the current game-imagery and development-only panel policy, with coverage diagnostics in operator artifacts rather than new player-facing disclosures. Reconciliation belongs to implementation closeout, not to this planning-only request.
- No game binaries, extracted assets, saves, snapshots, or local publications enter Git. This request creates planning artifacts only.
