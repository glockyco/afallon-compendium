<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { pushState } from '$app/navigation';
  import { detailNavigation, followLocation, provideDetailNavigation } from './detail-navigation';
  import { fragmentId, selectTab, tabOwningAnchor, withTab, type TabSpec } from './tab-state';

  /** The tabs in reading order. The first tab is selected when the address names no tab of this set. */
  export let tabs: TabSpec[];
  /** The accessible name of the tab list. */
  export let label: string;
  /** Makes the control and panel ids unique when a page holds several tab sets with the same keys. */
  export let idPrefix: string;
  /** The query field that holds the choice. Tab sets with different fields choose independently. */
  export let param = 'tab';

  // Tab sets of one page share the address, so a choice in one set selects the same key in every set with the same field.
  const parent = detailNavigation();
  const navigation = parent ?? provideDetailNavigation();
  const location = navigation.location;
  let buttons: HTMLButtonElement[] = [];
  // Each browser history event creates a new address, so Back to a fragment scrolls again. The own choices of this set
  // are marked as handled, because they select a tab and do not scroll.
  let handled: URL | null = null;

  $: selected = $location ? selectTab(tabs, $location, param).key : tabs[0]?.key ?? '';
  $: if ($location) void follow($location);

  // The address names the selected tab. A fragment that a tab owns opens that tab and then scrolls to its target.
  async function follow(url: URL): Promise<void> {
    const selection = selectTab(tabs, url, param);
    if (selection.replace) {
      // The address is repaired while the page starts, before the router accepts `replaceState`. The browser call keeps
      // the router's history state, as the map does for its initial address.
      const next = withTab(url, param, selection.key, false);
      handled = next;
      window.history.replaceState(window.history.state, '', next);
      location.set(next);
      const anchor = fragmentId(next.hash);
      if (tabOwningAnchor(tabs, anchor) !== undefined) await scrollTo(anchor);
      return;
    }
    if (url === handled) return;
    handled = url;
    const anchor = fragmentId(url.hash);
    if (tabOwningAnchor(tabs, anchor) !== undefined) await scrollTo(anchor);
  }

  async function scrollTo(anchor: string): Promise<void> {
    await tick();
    await navigation.reveal(anchor);
    // Back and Forward restore the scroll position of the entry in the same frame. The target scrolls into view after it.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    document.getElementById(anchor)?.scrollIntoView({ block: 'center' });
  }

  function choose(key: string, focus: boolean): void {
    const url = $location ?? new URL(window.location.href);
    if (key !== selectTab(tabs, url, param).key) {
      // An anchor of another tab no longer names a visible target, so an explicit choice removes it.
      const owner = tabOwningAnchor(tabs, fragmentId(url.hash));
      const next = withTab(url, param, key, owner !== undefined && owner !== key);
      handled = next;
      pushState(next, {});
      location.set(next);
    }
    if (focus) void tick().then(() => buttons[tabs.findIndex((tab) => tab.key === key)]?.focus());
  }

  function keydown(event: KeyboardEvent, index: number): void {
    const last = tabs.length - 1;
    const target = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (target < 0) return;
    event.preventDefault();
    choose(tabs[target]!.key, true);
  }

  onMount(() => {
    const stopFollowing = parent ? undefined : followLocation(navigation);
    // A repeated click on the current fragment fires no `hashchange`, so the tab set scrolls to its target itself.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
      const anchor = fragmentId(link.hash);
      if (link.hash === window.location.hash && tabOwningAnchor(tabs, anchor) !== undefined) void scrollTo(anchor);
    };
    document.addEventListener('click', onClick);
    return () => {
      stopFollowing?.();
      document.removeEventListener('click', onClick);
    };
  });
</script>

<div class="tab-set">
  <div class="tab-list" role="tablist" aria-label={label}>
    {#each tabs as tab, index (tab.key)}
      <button type="button" role="tab" id={`${idPrefix}-tab-${tab.key}`} aria-controls={`${idPrefix}-panel-${tab.key}`} aria-selected={tab.key === selected} tabindex={tab.key === selected ? 0 : -1} bind:this={buttons[index]} on:click={() => choose(tab.key, false)} on:keydown={(event) => keydown(event, index)}>{tab.label}</button>
    {/each}
  </div>
  <!-- Every tab names a panel. Only the selected panel renders its content, so hidden sections stay out of the page. A
       hidden panel keeps an empty target for each anchor that it owns, so a link to the anchor names an element of the
       page before the panel opens. -->
  {#each tabs as tab (tab.key)}
    <div role="tabpanel" id={`${idPrefix}-panel-${tab.key}`} aria-labelledby={`${idPrefix}-tab-${tab.key}`} tabindex="0" hidden={tab.key !== selected}>
      {#if tab.key === selected}<slot key={tab.key} />{:else}{#each tab.anchors ?? [] as anchor (anchor)}<span id={anchor}></span>{/each}{/if}
    </div>
  {/each}
</div>

<style>
  .tab-list { display: flex; flex-wrap: wrap; gap: .25rem; margin-bottom: .75rem; border-bottom: 1px solid var(--c-line); }
  [role='tab'] { margin-bottom: -1px; padding: .45rem .8rem; border: 1px solid transparent; border-bottom: 0; border-radius: var(--c-radius-sm) var(--c-radius-sm) 0 0; background: none; color: var(--c-text-dim); font: 600 var(--c-text-body)/1.2 Inter, ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
  [role='tab'][aria-selected='true'] { border-color: var(--c-line); background: var(--c-surface-1); color: var(--c-text-strong); }
  [role='tab']:focus-visible, [role='tabpanel']:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  [role='tabpanel'][hidden] { display: none; }
</style>
