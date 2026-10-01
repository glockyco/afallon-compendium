## Context

Scan run 228ac53d (8 scene targets of build 25434619) took 2,114 s. The object write times of its per-collector context files give this timeline per target: about 18 s to load the scene, about 1 s for the canonical, localization, and quest-level collectors, then the artwork step (117 s on the first target, 261 s on the eighth), then about 20 s for the scene collectors, and about 30 s for the serialized-asset identity step. The artwork steps sum to 1,624 s, 77% of the run. Each target registered about 1,446 artwork objects; 11,568 of the run's 12,490 outputs are artwork.

The catalog reads canonical, localization, quest levels, artwork, relationships, loot rules, support, and the scene catalog only from the canonical target that its plan names (`packages/catalog/src/evidence.ts`). Artwork of every other target is never read. The other database-wide collectors take about 1 s and stay per target, because each target's placement roles use canonical and relationship facts.

A benchmark of `packages/artifacts` registration (4 KB files) measured 4.5 ms per output at 500 outputs and 20.6 ms at 3,000: each `putFile` and `addArtifact` rewrites the run lease and writes a full run revision.

## Goals / Non-Goals

**Goals:**
- Collect the build's artwork once per update, on the canonical target.
- Fail the catalog clearly when the canonical target lacks artwork, instead of publishing without artwork.

**Non-Goals:**
- Changing the lease and revision formats to remove the quadratic registration cost. With artwork once, a scene run has about 120 outputs per target, so the growth is a few seconds per run.
- Pipelining the serialized-asset identity step with the next scene load (about 30 s per target). It is the next largest cost and stays recorded.

## Decisions

- **Plan field, not a catalog-side choice.** The scan plan names `artworkTarget` by target identity (`build-scene:44`). The scan cannot know the catalog's later choice, and an explicit plan field keeps the run's evidence self-describing. Alternative: collect artwork on the first target of each run. Rejected: shards would still collect it four times, and the catalog's canonical target could still lack it.
- **Version bump.** The absent field now means no artwork, which changes what a v1 plan meant. The plan moves to `compendium.scan-plan.v2`, and v1 plans are rejected. Stored runs keep their recorded plans; nothing re-reads them as v2.
- **Required in the catalog.** `loadOptional` for artwork becomes a required load from the canonical target, with an error that names the target.

## Risks / Trade-offs

- An operator forgets `artworkTarget` on the canonical scene plan → the catalog fails at assembly and names the target; the fix is a single-target rescan.
- Artwork now comes from one target only → a failure of that one target blocks artwork, as it already blocked the canonical facts.
