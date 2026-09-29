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
  /** What the entity is and where it belongs. The hero holds every other fact. */
  export let facts: TitleFact[] = [];
  /** The map address that shows the entity. Without it, the title block has no map action. */
  export let mapHref: string | undefined = undefined;
  export let registry: PublicKindEntry[];

  const mapGlyph = iconNodeToSvg(MapPin, 'currentColor');
</script>

<header class="title-block" data-rarity={rarity}>
  <div class="heading">
    <h1 class:coloured={Boolean(rarity)}>{name}</h1>
    {#if mapHref}<a class="c-action map" href={mapHref}><span class="glyph" aria-hidden="true">{@html mapGlyph}</span>View on map</a>{/if}
  </div>
  {#if facts.length}
    <ul class="facts">
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
</header>

<style>
  .title-block { display: grid; gap: .5rem; margin-bottom: 1.25rem; }
  .heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem 1.25rem; }
  h1 { min-width: 0; margin: 0; color: var(--c-text-strong); font: 600 clamp(1.6rem, 3.5vw, 2.2rem)/1.15 var(--c-serif); overflow-wrap: break-word; }
  .coloured { color: var(--c-rarity); }
  .map { flex: none; }
  .glyph { display: inline-grid; place-items: center; }
  .glyph :global(svg) { width: .95rem; height: .95rem; }
  .facts { display: flex; flex-wrap: wrap; align-items: baseline; gap: .3rem 0; margin: 0; padding: 0; list-style: none; font-size: var(--c-text-body); }
  .facts li { display: inline-flex; align-items: baseline; gap: .35rem; }
  .facts li + li::before { content: '·'; margin: 0 .55rem; color: var(--c-text-mute); }
  .label { color: var(--c-text-dim); }
  .value { color: var(--c-text-strong); }
</style>
