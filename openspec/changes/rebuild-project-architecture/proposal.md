## Why

The project has proven its data model and runtime safeguards, but implementation growth has blurred module boundaries and duplicated core workflows. Rebuilding the internals now will make full-world completion safer without changing the evidence standard or the intentionally limited public interface.

## What Changes

- **BREAKING** Replace the `tools/`, `pipeline/`, and site-to-pipeline dependency graph with explicit workspace packages and one-way dependencies.
- **BREAKING** Replace copied run inputs and manually maintained implementation hash lists with immutable content-addressed artifacts and centrally computed step fingerprints.
- **BREAKING** Replace the separate extraction and traversal implementations with one scan workflow that collects the same typed snapshot for each current-scene, scene, or stream target.
- Make the canonical SQLite catalog the only normalized source of truth. Publication reads the catalog directly instead of consuming large intermediate projection documents.
- Validate runtime output at ingestion and transform typed records after validation. Remove `any`-based normalization from the trusted core.
- Store each distinct coverage issue once and attach its evidence occurrences separately. Release gates count unresolved issues rather than repeated occurrences.
- Split publication generation, map rendering, atlas state, search, and Svelte presentation into focused modules with enforced dependency direction.
- Keep the existing HotRepl runtime owner, cleanup guarantees, Afallon-specific domain model, static SvelteKit site, deck.gl renderer, and Cloudflare Static Assets deployment.
- Preserve selection details and authoring controls as development-only for now.
- Preserve game-provided imagery as the default for the overworld and interiors. Keep captured terrain as an optional additional layer.
- Cut over atomically after semantic parity checks. Do not retain old commands, URL aliases, dual writes, compatibility facades, or deprecated modules.

## Capabilities

### New Capabilities

- `artifact-lifecycle`: Immutable content-addressed evidence, run manifests, fingerprints, atomic successful-run selection, and verified artifact reuse.
- `scan-workflow`: One target-driven runtime workflow for current-scene extraction, scene traversal, and streamed-source collection.
- `canonical-catalog`: Typed evidence ingestion, the canonical relational catalog, normalized coverage issues, and direct publication queries.
- `static-publication`: Validated, bounded static atlas assets with canonical navigation state, game-imagery defaults, optional captured terrain, and development-only detail controls.

### Modified Capabilities

None. The related atlas capabilities are still change-local to `build-screenshot-first-map`, so this change records the preserved behavior as a new publication contract instead of pretending to modify an archived main spec.

## Impact

- Affects the root workspace layout, CLI, runtime orchestration, extraction, traversal, normalization, SQLite schema, publication generation, public contracts, site state, deck.gl layer construction, tests, and operator recipes.
- Preserves the current build-scoped evidence and identity semantics. Existing ignored artifacts remain frozen migration inputs and parity references.
- Changes command names, artifact paths, manifest formats, normalized schema versions, public data formats, and canonical URL parameters at one cutover.
- Does not resolve existing research blockers by redefining them. Full coverage remains a separate delivery requirement.
- Does not add a service, public API, multi-game framework, generic plugin system, account system, or request-time Cloudflare code.
