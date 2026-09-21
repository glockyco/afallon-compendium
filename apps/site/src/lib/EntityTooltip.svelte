<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { EntityRef, PublicDocument, PublicGearSet, PublicItem, PublicKindEntry } from '@afallon/contracts/public';
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
  let gearSet: PublicGearSet | null = null;
  let mapSpaceLabels: Readonly<Record<string, string>> = {};
  let intentTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let placement = '';

  export async function show(): Promise<void> {
    clearTimeout(closeTimer);
    place();
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
      if (loadedDocument.ref.kind === 'items') {
        const setRef = (loadedDocument as PublicItem).facts.gearSet;
        if (setRef && setRef.key !== null) {
          const loadedSet = await activeLoader.loadDocumentForRef(setRef as EntityRef);
          if (loadedSet.ref.kind !== 'gearSets' || loadedSet.ref.key !== setRef.key) throw new Error(`Gear set details do not match ${setRef.name}.`);
          gearSet = loadedSet as PublicGearSet;
        }
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  export function showAfterIntent(): void {
    clearTimeout(intentTimer);
    clearTimeout(closeTimer);
    intentTimer = setTimeout(() => void show(), 160);
  }

  export function keepOpen(): void {
    clearTimeout(closeTimer);
  }

  export function closeAfterIntent(): void {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
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

  function place(): void {
    if (!anchor || typeof window === 'undefined') return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(448, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - width - 16));
    const below = window.innerHeight - rect.bottom;
    const vertical = below < 260 && rect.top > below
      ? `bottom: ${Math.round(window.innerHeight - rect.top + 8)}px; max-height: ${Math.round(rect.top - 24)}px;`
      : `top: ${Math.round(rect.bottom + 8)}px; max-height: ${Math.round(below - 24)}px;`;
    placement = `left: ${Math.round(left)}px; width: ${Math.round(width)}px; ${vertical}`;
  }
</script>

{#if open}
  <span {id} class="entity-tooltip" role="tooltip" style={placement} on:pointerenter={keepOpen} on:pointerleave={closeAfterIntent}>
    {#if loading}<span class="tooltip-status">Loading details…</span>
    {:else if error}<span class="tooltip-status error">Details are unavailable.</span>
    {:else if document}<TooltipPresenter {document} {registry} {mapSpaceLabels} {rankIndex} {gearSet} />{/if}
  </span>
{/if}

<style>
  .entity-tooltip { position: fixed; z-index: 40; top: 0; left: 0; width: min(28rem, calc(100vw - 2rem)); max-height: min(32rem, 70vh); overflow: auto; padding: .85rem; border: 1px solid #74684e; border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 10px 30px #000b; color: var(--c-text); text-align: left; }
  .tooltip-status { display: block; color: #bbb6aa; font-size: .8rem; }
  .tooltip-status.error { color: #e5afa6; }
  @media (max-width: 640px) { .entity-tooltip { inset: auto 1rem 1rem !important; width: auto !important; max-height: 60vh !important; } }
</style>
