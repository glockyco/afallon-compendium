## Context

The site renders both component-owned copy and immutable, previously generated documents. Publication generation lives in `packages/publication`, while the CLI invokes that generator. Staging an existing candidate does not regenerate its document text.

## Goals / Non-Goals

**Goals:** Keep missing facts honest and retain gameplay meaning when replacing data-process language in display copy and future generated documents.

**Non-Goals:** Rewrite game-provided quest dialogue or names, development diagnostics, schema identifiers, or an already accepted publication.

## Decisions

- Rewrite messages at the component where they render. For generated text, change the producer in `packages/publication` and its direct consumers where needed.
- Call relative spawner weights Relative Chance, preserving their numeric values and distinguishing them from verified exact percentages.
- Call grouped NPC distinctions versions. Keep underlying `variant` schema keys and anchors stable so links and existing documents remain compatible.
- Reword the reviewed mechanics rules in a new rules fragment and register a merged candidate. Project rule phrases without substitution. The already-staged publication remains unchanged.

## Risks / Trade-offs

Static builds using a staged candidate still include its original names and rule prose. Future generated documents reflect producer changes only after a new candidate is built and selected. Rewriting game-provided text could change its meaning, so it remains untouched.
