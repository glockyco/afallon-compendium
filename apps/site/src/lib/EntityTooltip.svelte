<script lang="ts">
  import { onDestroy } from 'svelte';
  import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';
  import type { EntityRef, PublicDocument, PublicKindEntry } from '@afallon/contracts/public';
  import { clientAtlasLoader } from './client-publication';
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
  let document: PublicDocument | null = null;
  let mapSpaceLabels: Readonly<Record<string, string>> = {};
  let intentTimer: number | undefined;
  let closeTimer: number | undefined;

  export async function show(): Promise<void> {
    clearTimeout(closeTimer);
    open = true;
    if (document || loading) return;
    const activeLoader = clientAtlasLoader();
    if (!activeLoader) return;
    loading = true;
    error = '';
    try {
      const [loadedDocument, root] = await Promise.all([activeLoader.loadDocumentForRef(ref), activeLoader.loadRoot()]);
      document = loadedDocument;
      mapSpaceLabels = Object.fromEntries(root.maps.map((map) => [map.mapSpaceId, map.label]));
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  export function showAfterIntent(): void {
    clearTimeout(intentTimer);
    clearTimeout(closeTimer);
    intentTimer = window.setTimeout(() => void show(), 160);
  }

  export function keepOpen(): void {
    clearTimeout(closeTimer);
  }

  export function closeAfterIntent(): void {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (anchor?.contains(globalThis.document.activeElement)) return;
      close();
    }, 100);
  }

  export function close(): void {
    clearTimeout(intentTimer);
    clearTimeout(closeTimer);
    open = false;
  }

  export function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }

  onDestroy(() => {
    clearTimeout(intentTimer);
    clearTimeout(closeTimer);
  });

  function positionTooltip(node: HTMLElement) {
    if (!anchor) return;
    const reference = anchor;
    let active = true;
    const stop = autoUpdate(reference, node, () => {
      // `size` writes a max height. Clearing it first lets `flip` measure the content's natural height, so a
      // tooltip that grows when its document loads moves to the side with room instead of scrolling.
      node.style.maxHeight = '';
      // A tooltip opens right of its link, or left when the right side lacks room, so it never covers the rows
      // above or below. Only horizontal room decides the side. A vertical shift keeps it inside the viewport.
      void computePosition(reference, node, {
        placement: 'right-start',
        strategy: 'fixed',
        middleware: [
          offset(10),
          flip({ padding: 12, crossAxis: false, fallbackPlacements: ['left-start'] }),
          shift({ padding: 12, mainAxis: true, crossAxis: false }),
          size({
            padding: 12,
            apply({ availableHeight, elements }) {
              elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
            },
          }),
        ],
      }).then(({ x, y }) => {
        if (!active) return;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.visibility = 'visible';
      });
    });
    return { destroy() { active = false; stop(); } };
  }
</script>

{#if open}
  <span {id} class="entity-tooltip" role="tooltip" use:positionTooltip on:pointerenter={keepOpen} on:pointerleave={closeAfterIntent}>
    {#if loading}<span class="tooltip-status">Loading details…</span>
    {:else if error}<span class="tooltip-status error">Details are unavailable.</span>
    {:else if document}<TooltipPresenter {document} {registry} {mapSpaceLabels} {rankIndex} variant={ref.variant} />{/if}
  </span>
{/if}

<style>
  .entity-tooltip { position: fixed; z-index: 40; top: 0; left: 0; visibility: hidden; width: min(28rem, calc(100vw - 2rem)); overflow: auto; padding: .85rem; border: 1px solid #74684e; border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 10px 30px #000b; color: var(--c-text); text-align: left; }
  .tooltip-status { display: block; color: #bbb6aa; font-size: .8rem; }
  .tooltip-status.error { color: #e5afa6; }
  @media (max-width: 640px) { .entity-tooltip { inset: auto 1rem 1rem !important; width: auto !important; max-height: 60vh !important; } }
</style>
