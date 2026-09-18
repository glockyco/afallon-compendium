## Why

Publication validation and atlas state have multiple owners, which permits inconsistent acceptance and stale state. Recent geometry-loading and gesture fixes also conflict with pending specifications, which risks reintroducing those regressions.

## What Changes

- Give publication graph semantics one pure validator, shared by producer and deployment readers. Return verified resources for parity checks without reading the candidate again.
- Preserve reader-specific integrity, containment, catalog-gate, and inventory checks. Deployment will reject malformed relationships already rejected by the producer.
- Make the controller snapshot authoritative for persistent atlas state. Replace component-wide state reconstruction with focused actions while preserving Deck ownership of the live camera.
- Reconcile pending architecture guidance with eager geometry readiness and disabled inertia. Preserve independent search and detail loading, game-map defaults, and optional captured terrain.
- Consolidate package-local artifact path validation and filesystem primitives. Preserve distinct immutable-create, lease-update, and reference-replacement guarantees.
- Separate pure render-data projection and layer construction from Deck lifecycle and interaction management.
- Consolidate deployment file traversal and integrity helpers without introducing a general utility package.
- Consolidate capture-local validation and tile bounds. Retain the separate numeric tolerances for capture validation and readiness validation.
- Remove superseded implementations and migrate every caller. Preserve supported public formats, URLs, CLI commands, and valid publication output.

## Capabilities

### New Capabilities

- `static-publication`: Add consistent semantic acceptance across producer and deployment boundaries. This path already exists in pending changes, but not in the empty main specification directory.
- `interactive-atlas`: Add canonical state ownership, eager geometry readiness, and non-inertial gesture requirements. This path also exists only in pending changes.

These additions extend existing capability paths rather than introduce new product surfaces. New requirement titles avoid collisions with pending additions. The design identifies conflicting pending requirements that implementation must reconcile before specification synchronization.

### Modified Capabilities

None against the current main specification directory. Artifact, renderer, deployment-helper, and capture refactors preserve existing behavioral contracts and do not need invented requirements.

## Impact

- Public graph validation belongs under `packages/contracts/src/public/`, alongside existing schema, identity, and resource-edge functions. It must not import filesystem, catalog, artifact-store, or image-processing code.
- Producer integration affects `packages/publication/src/selection.ts` and its callers. Deployment integration affects graph verification, parity, staging, and deployment assertion scripts.
- Atlas integration affects `MapExplorer.svelte`, `atlas-controller.ts`, `atlas-state.ts`, `map-renderer.ts`, and focused `map/` modules.
- Local helper changes affect `packages/artifacts/src/` and `packages/capture/src/`.
- Documentation reconciliation affects the overlapping atlas and publication artifacts in existing changes, relevant operator documentation, and stale OpenSpec configuration context.
- No schema version migration, additional workspace package, frontend state framework, game extraction, coverage expansion, production deployment, or archival is included.
- Compatibility tightening: structurally valid but semantically inconsistent staged publications will fail verification. Valid publications and existing parity protections remain supported.
