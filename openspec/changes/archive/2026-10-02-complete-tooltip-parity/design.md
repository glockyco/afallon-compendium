## Context

See `proposal.md` for motivation and `specs/compendium-tooltips/spec.md` for the behavior contract.

The current data path is runtime collector → decoded scan artifact → normalized catalog facts → public static document → `FactCard` in `EntityTooltip`. That path loses tooltip facts at several boundaries:

- the support collector publishes ability identity but no rank mechanics;
- the item collector retains action ability IDs but not `ConsumableTooltip` output;
- catalog stat rows use only the local row's percentage flag even though the game also uses the referenced stat's global flag;
- catalog requirements reduce a native predicate to type, target, and two amounts;
- item documents reference a set document, but the item tooltip does not load it;
- the site uses page-oriented fact cards as generic compact tooltips.

The static publication is content-addressed and schema-checked. Any contract change must update the whole resource graph without a compatibility period. The existing loader already deduplicates requests by resource path, so a referenced set document can be loaded without adding another cache.

The game evidence is build 25419293. Live probes established that all 373 authored ability ranks generate non-empty text without a combat entity, 87 items generate non-empty use or buff text, and item or gem percentage display is the logical OR of local and canonical stat flags. The reference armor screenshot establishes member and tier state. Character-dependent requirements use the user-selected synthetic state: fulfilled.

## Goals / Non-Goals

**Goals:**

- Preserve native tooltip observations through every typed boundary.
- Keep one normalized public graph while allowing pages and tooltips to present different subsets and state.
- Derive synthetic requirement and gear-set state at presentation time rather than storing fictional character state.
- Keep tooltip markup safe, deterministic, accessible, and testable.
- Cut over public documents atomically and remove obsolete compact-card paths.

**Non-Goals:**

- Simulate a real saved character, equipment comparison, randomized item instance, or combat scaling context.
- Reproduce Unity layout pixels or fonts exactly; fact order, wording, colour meaning, and active state are the parity boundary.
- Turn page-less support entities into new routed kinds.
- Add compatibility aliases, legacy schema readers, or duplicated embedded gear-set snapshots.
- Expand every relation table into a tooltip.

## Decisions

### 1. Capture native generated text as source evidence

Extend the runtime collection that owns each entity:

- canonical item records gain the non-empty result of `ConsumableTooltip.Build(item, false)`;
- support ability records gain one row per authored rank with its source index and the result of `AbilityTooltipGenerator.Generate(null, ability, rank)`;
- NPC phase ability observations retain the authored rank and source index instead of reducing the row to an ability ID.

The scan artifact keeps the exact native string and provenance. Generation exceptions and unsupported output become coverage issues tied to the entity and source path. Complete-mode publication cannot silently replace them with an empty block.

Alternative: rebuild native wording from effect and action fields in TypeScript. Rejected because it would duplicate game formatting logic, miss effect types, and drift across builds. The live generator already succeeds without character state for every current rank.

### 2. Parse native tooltip markup before publication

Add a small, exhaustive parser for the observed TextMeshPro subset: line breaks, `<color=…>`, `<i>`, and their closing tags. Normalized tooltip content is a list of lines and typed spans. Each span carries plain text, optional semantic tone, and italic state. The colour mapping is explicit for observed named colours and hex values; unknown tags or malformed nesting are coverage errors.

The catalog and public contracts store typed spans, not HTML. Svelte renders span text through normal escaping and maps tones to CSS variables. Raw native strings remain only in scan evidence and diagnostic JSON.

Alternative: strip every tag to plain text. Rejected because damage, healing, positive effects, muted mechanics, and authored emphasis are observable tooltip meaning. Alternative: render sanitized HTML. Rejected because typed spans are smaller, easier to validate, and do not create an HTML trust boundary.

### 3. Compute effective percentage once in catalog normalization

For item, random-item, gem, and gear-set tier stat rows:

`effectiveIsPercent = row.isPercent || canonicalStat.isPercentStat`

The catalog stores the effective value consumed by publication. The raw row flag and canonical stat record remain available through provenance; the site does not recompute the rule.

Alternative: fix only Lifesteal or maintain a name list. Rejected as a data-dependent special case. Alternative: compute in the site. Rejected because JSON consumers, lists, pages, and tooltips must agree.

### 4. Preserve complete requirement predicates and classify their display scope

Replace the reduced catalog requirement with a typed predicate that retains the native fields needed for wording: state, comparison, value, ownership, item condition, progression, entity, point type, subtype references, amount type, effect condition, thresholds, and group count behavior. Reference-valued fields continue to use catalog endpoints.

Each normalized item condition receives an explicit scope:

- `equipment` for predicates the native item requirement block presents;
- `use` for action gates such as inactive effects, equipped weapon subtypes, region, mounted, grounded, or combat state.

The mapping is exhaustive and based on the recovered `ItemTooltip.HandleRequirements` behavior plus live representative probes. An unclassified native requirement type is a coverage blocker, not a generic label. Predicate identity, not display text, deduplicates template and inline copies. The scalar level requirement and an equivalent condition collapse to one equipment predicate.

Public item facts expose `equipmentRequirements` and `useConditions` separately. Full pages may show both under distinct headings. Item tooltips show only equipment requirements. Fulfillment is not persisted: the item tooltip renderer passes `fulfilled=true` for every equipment predicate and applies the game's positive green tone.

Alternative: infer scope from English labels or a broad type-name heuristic. Rejected because it produced `Potion Sickness`, `Item or Item or Item`, and `inline-requirements`. Alternative: drop use conditions. Rejected because they are valid compendium facts even though they are not native equipment lines.

### 5. Keep gear sets normalized and assemble item context at load time

An item document continues to carry only its set reference. When an item tooltip opens, the tooltip loader loads the item and, when present, the referenced set document through the existing content-addressed request cache. The item presenter receives both documents and the current item key.

It derives:

- active member key = current item key;
- synthetic equipped count = 1;
- member active state = member key equals active member key;
- tier active state = tier threshold is at most the synthetic count.

Members and tiers retain authored order. Missing or identity-mismatched set data produces the existing unavailable state and never an empty synthetic set.

Alternative: embed members and tiers into every member item. Rejected because it duplicates 27 source records across 184 item documents and creates two public sources of truth.

### 6. Publish ability ranks and contextual references explicitly

`PublicAbility.facts` becomes a non-empty rank list. Each rank carries its authored index and parsed tooltip lines. Context-free pages and links expose all ranks; the single current multi-rank ability therefore remains complete. NPC phase ability rows and item action-ability relations use a contextual ability reference with an optional authored rank. A contextual hover selects that rank while the destination remains the same ability page.

Alternative: publish only rank zero. Rejected because it silently loses authored data. Alternative: create one routed ability document per rank. Rejected because rank is a variant of one native ability identity, not a new entity.

### 7. Separate page cards from tooltip presenters

Remove the generic `FactCard compact` route for tooltips. `EntityTooltip` dispatches to dedicated non-interactive presenters that consume the same public documents:

- item: native fact order, native use lines, referenced set, fulfilled equipment requirements, sell price last;
- ability: selected rank or every labelled rank;
- recipe: station, skill, rank, product, and materials;
- quest: level, giver, turn-in, objective summary, reward summary, and quest text;
- gear set: members and tiers;
- NPC: identity facts, combat facts, ability summary, and counts for large relations;
- place: identity facts, parent, and counts for occupants, services, quests, and connections;
- property: place, income, price, and location count.

The full page cards keep their page-oriented grids and tables. Shared leaf components may format stats, prices, typed native text, and requirement predicates, but no component switches between substantially different page and tooltip layouts with a `compact` branch.

Alternative: continue adding compact conditionals to every page card. Rejected because page relations and tooltip facts have different order, state, interaction, and density.

### 8. Keep ARIA tooltips non-interactive and make the owner region stable

The rendered tooltip has a stable ID referenced by the owner link's `aria-describedby`. It contains no links, buttons, or focusable descendants; entity references render as icons and text. The owner wrapper coordinates pointer entry and exit across both the link and fixed tooltip, with close deferred long enough to inspect `relatedTarget`. Moving into the tooltip preserves it and permits overflow scrolling. Leaving both closes it.

Focus opens the tooltip. Escape closes it without moving focus. Blur closes it because no tooltip descendant accepts focus. Touch continues to follow the underlying entity link normally.

Alternative: make the tooltip an interactive popover. Rejected because the entity page is already the interaction target and a popover would require focus management, a different ARIA pattern, and a second navigation surface.

### 9. Use stable native IDs for duplicate abilities

Duplicate abilities always use `Name (#nativeId)` as their public display name and stable slug discriminator. Usage relations remain separate page data. NPCs, items, and places may keep their existing concise semantic suffixes where those suffixes are bounded and unique.

Alternative: retain the ability user list when unique. Rejected because relation growth changed names and produced labels up to 698 characters.

### 10. Version all static document schemas together

Bump every static page-document schema ID to the next version. Requirement rows are shared by several document kinds, contextual ability references change NPCs, and tooltip data changes items and abilities; one document-generation version avoids a mixed graph and complicated partial compatibility rules. Update the document reference union, publisher, loader registry, fixtures, and graph audits in the same commit. Do not add legacy readers or emit both generations.

The root manifest continues to be selected atomically and content-addressed. Search and list schema shapes need not change, although regenerated names and hashes will change their content.

Alternative: bump only item and ability documents. Rejected because shared requirement and ability-reference shapes would make unchanged schema IDs describe new payloads.

### 11. Make parity checks data-driven and retain a small reference set

Catalog and publication checks assert invariants across the whole build: every ability has every authored rank, every generated tooltip block is non-empty, every non-empty native item use block reaches its item document, requirement predicates are classified, and every set member resolves. These are production gates, not source-text tests.

Browser verification uses representative evidence cases whose values exercise different rules: Oathbreaker's Edge, Frost loop, Red gem of lifesteal, Minor health potion, Rough Sharpening Stone, Adept Leather hood, Cleave #0, and the multi-rank Healing potion ability. Interaction verification moves the pointer into an overflowing tooltip, scrolls it, dismisses with Escape, inspects keyboard association, and checks touch navigation.

## Risks / Trade-offs

- [Native generators change tags or require runtime state in a later build] → Treat generation or parsing failures as coverage evidence and stop complete publication; keep raw source text for diagnosis.
- [Typed predicate coverage is incomplete] → Use exhaustive decoding with no generic user-facing fallback; add each newly observed native enum through the normal update workflow.
- [Context-free multi-rank ability tooltips become tall] → Render labelled ranks in authored order and rely on the repaired bounded scrolling behavior.
- [Loading a referenced gear set adds latency] → Use the existing content-addressed request cache and fetch the set concurrently after the item reveals its reference; never duplicate the data.
- [All document schema IDs changing invalidates older staged resources] → Select code and publication roots atomically and retain the previous deployment pair for rollback.
- [Separate presenters duplicate superficial markup] → Share only leaf formatters and visual primitives; keep entity-specific order and state explicit.
- [A richer compact policy makes some tooltips large] → Use summaries for high-cardinality relations and full rows only for core recipe, quest, item, ability, and gear-set facts.

## Migration Plan

1. Transfer the unfinished gear-set tooltip ownership by marking task 7.4 in `build-compendium-reference` as superseded by `complete-tooltip-parity`; do not implement both paths.
2. Extend runtime observations and decoders, then run a real build scan to prove all expected ability ranks and item use blocks are captured with no unsupported markup.
3. Extend normalized catalog storage and queries for tooltip spans, effective percentages, contextual ability ranks, and complete classified requirement predicates.
4. Replace the public contracts and projections in one clean cutover, bump every static document schema ID, and regenerate fixtures.
5. Add dedicated tooltip presenters and stable owner interaction, then remove obsolete compact fact-card branches and relation-backed fallback labels.
6. Publish and stage a fresh current-build graph. Run the whole-build invariants, representative browser scenarios, production build, and deployment verification.
7. Deploy site code and the matching publication root together. Roll back by restoring the previous site deployment and its previous accepted publication root as a pair.
