<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { COMPENDIUMS, iconUrl, THIS_COMPENDIUM } from './compendiums';

  // The logo stays the link home, so switching to another compendium has a control of its own. Escape, an outside click
  // or a navigation closes the panel.
  let open = false;
  let root: HTMLElement;
  let toggle: HTMLButtonElement;

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return;
    open = false;
    toggle.focus();
  }

  onMount(() => {
    const onPointerDown = (event: PointerEvent) => { if (open && event.target instanceof Node && !root.contains(event.target)) open = false; };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  });
  afterNavigate(() => { open = false; });
</script>

<svelte:window on:keydown={onKeydown} />

<!-- The panel is placed against the bar, like Browse, so it stays on the screen at every width. -->
<div class="switcher" bind:this={root}>
  <button bind:this={toggle} type="button" class="toggle" aria-label="Switch compendium" title="Switch compendium" aria-expanded={open} aria-controls="compendium-switcher" on:click={() => (open = !open)}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></button>
  <div id="compendium-switcher" class="panel" hidden={!open}>
    <p class="title">Game Compendiums</p>
    <ul>
      {#each COMPENDIUMS as compendium (compendium.icon)}
        <li>{#if compendium.icon === THIS_COMPENDIUM}<a href={`${base}/`} aria-current="true"><img src={iconUrl(compendium)} alt="" width="128" height="128" /><span>{compendium.name}</span><svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg></a>{:else}<a href={compendium.url} rel="external"><img src={iconUrl(compendium)} alt="" width="128" height="128" /><span>{compendium.name}</span></a>{/if}</li>
      {/each}
    </ul>
    <p class="foot"><a href={`${base}/about/`}>About this Compendium</a></p>
  </div>
</div>

<style>
  .switcher { display: flex; align-self: center; }
  .toggle { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; padding: 0; border: 0; border-radius: var(--c-radius-sm); background: none; color: var(--c-text-dim); }
  .toggle:hover { color: var(--c-text-strong); }
  .toggle[aria-expanded='true'] { background: var(--c-tint-hover); color: var(--c-accent); }
  .toggle:focus-visible, .panel a:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .toggle svg { width: 1.15rem; height: 1.15rem; fill: none; stroke: currentcolor; stroke-width: 1.7; }
  .panel { position: absolute; z-index: 1; top: calc(100% + .35rem); right: 1.5rem; width: min(19rem, calc(100% - 3rem)); overflow: hidden; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 14px 32px var(--c-shadow); }
  .panel[hidden] { display: none; }
  .title { margin: 0; padding: .9rem 1.1rem .45rem; color: var(--c-accent); font-size: .8125rem; font-weight: 600; line-height: 1.3; letter-spacing: .06em; text-transform: uppercase; }
  ul { display: grid; gap: .15rem; margin: 0; padding: 0 .55rem .55rem; list-style: none; }
  ul a { display: flex; align-items: center; gap: .65rem; min-height: 2.75rem; padding: 0 .55rem; border-radius: var(--c-radius-sm); color: var(--c-text); font-weight: 600; text-decoration: none; white-space: nowrap; }
  ul a:hover { background: var(--c-tint-hover); color: var(--c-accent); }
  ul a[aria-current='true'] { background: var(--c-tint-hover); }
  img { width: 1.75rem; height: 1.75rem; flex: none; object-fit: contain; }
  .check { width: 1rem; height: 1rem; margin-left: auto; fill: none; stroke: var(--c-accent); stroke-width: 2.5; }
  .foot { margin: 0; padding: .7rem 1.1rem .8rem; border-top: 1px solid var(--c-line-soft); background: var(--c-surface-2); font-size: var(--c-text-small); }
  .foot a { color: var(--c-text-dim); text-decoration: none; }
  .foot a:hover { color: var(--c-accent); }

  @media (max-width: 1039px) {
    .panel { right: 1rem; width: min(19rem, calc(100% - 2rem)); }
  }
  @media (max-width: 640px) {
    .panel { right: .5rem; width: min(19rem, calc(100% - 1rem)); }
  }
</style>
