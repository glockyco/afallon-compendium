<script lang="ts" context="module">
  import type { Ref } from '@afallon/contracts/public';

  /** One identity fact: plain text, or links to the entities that it names. */
  export type TitleFact = { label?: string; text: string } | { label?: string; refs: Ref[] };
</script>

<script lang="ts">
  import { MapPin } from 'lucide';
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import '../compendium.css';
  import EntityLink from '../EntityLink.svelte';
  import { iconNodeToSvg } from '../icon-svg';

  export let name: string;
  /** The rarity tone of an item, which colours its name as the game does. */
  export let rarity: string | undefined = undefined;
  /** Published art URL, when the entity has an icon or portrait. */
  export let imageUrl: string | undefined = undefined;
  export let portrait = false;
  /** A concise type line replaces a list of identity facts in redesigned pages. */
  export let typeLine: string | undefined = undefined;
  /** Optional linked type prefix; `typeLine` follows it as plain text. */
  export let typeRef: Ref | undefined = undefined;
  /** What the entity is and where it belongs. The hero holds every other fact. */
  export let facts: TitleFact[] = [];
  /** The map address that shows the entity. Without it, the title block has no map action. */
  export let mapHref: string | undefined = undefined;
  export let registry: PublicKindEntry[];

  const mapGlyph = iconNodeToSvg(MapPin, 'currentColor');
</script>

<header class="title-block" data-rarity={rarity}>
  <div class="heading" class:no-art={!imageUrl} class:without-action={!mapHref}>
    {#if imageUrl}<div class="identity-art" class:portrait><img src={imageUrl} alt="" /></div>{/if}
    <div class="identity">
      <h1 class:coloured={Boolean(rarity)}>{name}</h1>
      {#if typeLine || typeRef || facts.length}
        <ul class="facts">
          {#if typeRef || typeLine}<li class="type">{#if typeRef}<EntityLink ref={typeRef} {registry} />{/if}{#if typeLine}{typeRef ? ' ' : ''}{typeLine.split(' · ')[0]}{/if}</li>{/if}
          {#each typeLine?.split(' · ').slice(1) ?? [] as part}<li class="type">{part}</li>{/each}
          {#each facts as fact}
            <li>
              {#if fact.label}<span class="label">{fact.label}</span>{/if}
              {#if 'refs' in fact}
                <span class="refs">{#each fact.refs as ref, index}{index > 0 ? ', ' : ''}<EntityLink {ref} {registry} />{/each}</span>
              {:else}<span class="value">{fact.text}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if mapHref}<a class="c-action map" href={mapHref}><span class="glyph" aria-hidden="true">{@html mapGlyph}</span>Show on Map</a>{/if}
  </div>
  <slot />
</header>

<style>
  .title-block { display: grid; gap: .5rem; margin-bottom: 1.25rem; }
  :global(.detail-frame) .title-block { margin-bottom: 0; }
  .heading { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1.1rem; align-items: center; }
  .heading.no-art { grid-template-columns: minmax(0, 1fr) auto; }
  .heading.no-art.without-action { grid-template-columns: minmax(0, 1fr); }
  .identity { min-width: 0; }
  .identity-art { width: 4.5rem; height: 4.5rem; padding: .375rem; border: 1px solid var(--c-rarity); border-radius: .625rem; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--c-rarity) 22%, transparent), var(--c-surface-1) 70%); }
  .identity-art.portrait { width: 5.5rem; height: 5.5rem; padding: 0; overflow: hidden; border-color: var(--c-frame); }
  .identity-art img { width: 100%; height: 100%; object-fit: contain; }
  .identity-art.portrait img { object-fit: cover; }
  h1 { min-width: 0; margin: 0; color: var(--c-text-strong); font: 700 clamp(1.7rem, 3.5vw, 2.25rem)/1.1 var(--c-serif); overflow-wrap: break-word; }
  .coloured { color: var(--c-rarity); }
  .map { flex: none; }
  .glyph { display: inline-grid; place-items: center; }
  .glyph :global(svg) { width: .95rem; height: .95rem; }
  .facts { display: flex; flex-wrap: wrap; align-items: baseline; gap: .3rem 0; margin: .35rem 0 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .facts li { display: inline-flex; align-items: baseline; gap: .35rem; }
  .facts .type { color: var(--c-text-dim); }
  .facts li:not(:first-child)::before { content: '·'; white-space: nowrap; margin: 0 .2rem 0 .55rem; color: var(--c-text-mute); }
  .label { color: var(--c-text-dim); }
  .value { color: var(--c-text-strong); }
  @media (max-width: 640px) {
    .facts { column-gap: 1rem; }
    .facts li { flex: none; max-width: 100%; }
    .facts li:not(.type) { flex-basis: 100%; }
    .facts li:not(:first-child)::before { display: none; }
    .heading { grid-template-columns: auto minmax(0, 1fr); gap: .8rem; }
    .heading .identity-art:not(.portrait) { width: 3rem; height: 3rem; padding: .25rem; }
    .heading:has(.identity-art:not(.portrait)) h1 { font-size: 1.5rem; }
    .map { grid-column: 1 / -1; justify-self: start; }
  }
</style>
