<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { detailNavigation } from './detail-navigation';
  import { fragmentId } from './tab-state';
  export let title: string;
  export let id: string | undefined = undefined;
  export let summary: string | undefined = undefined;
  let element: HTMLDetailsElement;
  const navigation = detailNavigation();

  async function reveal(anchor: string): Promise<boolean> {
    if (!anchor || (anchor !== id && ![...element.querySelectorAll('[id]')].some((child) => child.id === anchor))) return false;
    element.open = true;
    await tick();
    return true;
  }

  onMount(() => {
    const follow = async () => {
      const anchor = fragmentId(window.location.hash);
      if (await reveal(anchor)) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: 'center' }));
    };
    void follow();
    window.addEventListener('hashchange', follow);
    window.addEventListener('popstate', follow);
    const removeRevealer = navigation?.addRevealer(reveal);
    return () => {
      window.removeEventListener('hashchange', follow);
      window.removeEventListener('popstate', follow);
      removeRevealer?.();
    };
  });
</script>

<details bind:this={element} {id} class="details-disclosure">
  <summary>{title}{#if summary}<span class="summary-note">{summary}</span>{/if}</summary>
  <div class="content"><slot /></div>
</details>

<style>
  .details-disclosure { min-width: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-sunken); scroll-margin-top: 6rem; }
  summary { display: flex; flex-wrap: wrap; gap: .6rem; align-items: baseline; min-height: 2.75rem; padding: .8rem 1rem; cursor: pointer; color: var(--c-text-soft); font-weight: 600; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary::before { content: '▸'; color: var(--c-text-mute); }
  [open] > summary::before { content: '▾'; }
  summary:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .summary-note { color: var(--c-text-mute); font-size: var(--c-text-small); font-weight: 400; }
  .content { padding: 0 1rem 1rem; }
</style>
