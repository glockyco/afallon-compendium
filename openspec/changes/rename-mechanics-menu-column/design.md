## Context

`apps/site/src/lib/site-navigation.ts` defines the Browse panel columns. The fourth column has the id `guides` and the label Guides, and it lists the four mechanics topics. The `mechanics` kind entry already has the plural Mechanics, and the breadcrumb of a topic page reads Compendium / Mechanics.

## Goals / Non-Goals

**Goals:** One name, Mechanics, for these pages in the navigation, the specs, and the README.

**Non-Goals:** Changing topic routes, topic names, the step anchors that entity pages link, or the internal type names of the mechanics documents.

## Decisions

- Rename the column id and label together. The id names the column in tests and in markup, so a `guides` id with a Mechanics label would keep the rejected term in the code.
- Keep the internal spec requirement named "Mechanics pages are guides" unchanged. It is not reader text, and a rename would collide with other open changes that modify that requirement.

## Risks / Trade-offs

- [The `publish-corrupted-gear` proposal still says Guides column] → That proposal records its own scope. This change supersedes the column name, and the archived specs carry the Mechanics name.
