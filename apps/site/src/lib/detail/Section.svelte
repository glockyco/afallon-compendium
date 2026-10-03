<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import '../compendium.css';
  import { detailNavigation } from './detail-navigation';

  /** The anchor of the section. Hero lines and other links scroll to it. */
  export let id: string;
  export let title: string;
  /** The number of rows. A section of prose or facts has no count. */
  export let count: number | undefined = undefined;
  /** One sentence that explains the values or states the values that all rows share. */
  export let line: string | undefined = undefined;
  /** One optional action alongside the section heading. */
  export let showAllHref: string | undefined = undefined;
  /** The heading level: 2 for a section of the page, 3 for a section inside a titled part of the page. */
  export let level: 2 | 3 = 2;

  // A rendered section enters the section lens of its page, with the heading that the reader sees.
  let element: HTMLElement;
  const handle = detailNavigation()?.addSection(id, title);
  $: handle?.update(id, title);
  onMount(() => handle?.place(element));
  onDestroy(() => handle?.remove());
</script>

<section class="section" {id} aria-labelledby={`${id}-title`} bind:this={element}>
  <header>
    <div class="heading">
      <svelte:element this={`h${level}`} class="title" id={`${id}-title`}>{title}{#if count !== undefined}<span class="count">{count}</span>{/if}</svelte:element>
      {#if showAllHref}<a class="c-link" href={showAllHref}>Show All</a>{/if}
    </div>
    {#if line}<p class="line">{line}</p>{/if}
  </header>
  <div class="panel c-stack"><slot /></div>
</section>

<style>
  .section { scroll-margin-top: 1rem; }
  header { display: grid; gap: .3rem; margin-bottom: var(--c-space-block); }
  .heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem; }
  .title { display: flex; align-items: baseline; gap: .6rem; color: var(--c-text-strong); font: 700 var(--c-text-title)/1.3 var(--c-serif); }
  .count { color: var(--c-text-mute); font: 500 var(--c-text-small)/1 ui-sans-serif, system-ui, sans-serif; font-variant-numeric: tabular-nums; }
  .line { color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  .panel { min-width: 0; }
</style>
