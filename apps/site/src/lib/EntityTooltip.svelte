<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { EntityRef, PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import { clientMapLoader } from './client-publication';
  import { FloatingController, placeBeside } from './floating';
  import TooltipPresenter from './TooltipPresenter.svelte';

  export let ref: EntityRef;
  export let registry: PublicKindEntry[];
  export let rankIndex: number | undefined = undefined;
  export let id: string | undefined = undefined;
  /** The link that owns this tooltip. A relation table scrolls, so the tooltip is positioned
      against the viewport instead of the anchor's clipping box. */
  export let anchor: HTMLElement | undefined = undefined;

  let open = false;
  let loading = false;
  let error = '';
  let page: StaticDocument | null = null;
  let mapSpaceLabels: Readonly<Record<string, string>> = {};

  const floating = new FloatingController(() => { open = true; void load(); }, () => { open = false; });

  async function load(): Promise<void> {
    if (page || loading) return;
    const activeLoader = clientMapLoader();
    if (!activeLoader) return;
    loading = true;
    error = '';
    try {
      const [loadedPage, root] = await Promise.all([activeLoader.loadPageForRef(ref), activeLoader.loadRoot()]);
      page = loadedPage;
      mapSpaceLabels = Object.fromEntries(root.maps.map((map) => [map.mapSpaceId, map.label]));
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  export function show(): void { floating.show(); }
  export function showAfterIntent(): void { floating.showAfterIntent(); }
  export function keepOpen(): void { floating.keepOpen(); }
  export function closeAfterIntent(): void { floating.closeAfterIntent(); }
  export function close(): void { floating.close(); }
  export function handleKeydown(event: KeyboardEvent): void { floating.handleKeydown(event, open); }

  onDestroy(() => floating.destroy());

  function position(node: HTMLElement) {
    if (!anchor) return;
    return { destroy: placeBeside(anchor, node) };
  }
</script>

{#if open}
  <span {id} class="entity-tooltip" role="tooltip" use:position on:pointerenter={keepOpen} on:pointerleave={closeAfterIntent}>
    {#if loading}<span class="tooltip-status">Loading details…</span>
    {:else if error}<span class="tooltip-status error">Details are unavailable.</span>
    {:else if page}<TooltipPresenter {page} {registry} {mapSpaceLabels} {rankIndex} variant={ref.variant} />{/if}
  </span>
{/if}

<style>
  .entity-tooltip { position: fixed; z-index: 40; top: 0; left: 0; visibility: hidden; width: min(28rem, calc(100vw - 2rem)); overflow: auto; padding: .85rem; border: 1px solid #74684e; border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 10px 30px #000b; color: var(--c-text); text-align: left; }
  .tooltip-status { display: block; color: #bbb6aa; font-size: var(--c-text-small); }
  .tooltip-status.error { color: #e5afa6; }
  @media (max-width: 640px) { .entity-tooltip { inset: auto 1rem 1rem !important; width: auto !important; max-height: 60vh !important; } }
</style>
