<script lang="ts">
  import type { EntityRef, PublicDocument, PublicKindEntry } from '@afallon/contracts/public';
  import { clientAtlasLoader } from './client-publication';
  import FactCard from './FactCard.svelte';

  export let ref: EntityRef;
  export let registry: PublicKindEntry[];

  let open = false;
  let loading = false;
  let error = '';
  let document: PublicDocument | null = null;
  let mapSpaceLabels: Readonly<Record<string, string>> = {};
  let intentTimer: ReturnType<typeof setTimeout> | undefined;

  export async function show(): Promise<void> {
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
    intentTimer = setTimeout(() => void show(), 160);
  }

  export function close(): void {
    clearTimeout(intentTimer);
    open = false;
  }

  export function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }
</script>

{#if open}
  <span class="entity-tooltip" role="tooltip">
    {#if loading}<span class="tooltip-status">Loading details…</span>
    {:else if error}<span class="tooltip-status error">Details are unavailable.</span>
    {:else if document}<FactCard {document} {registry} {mapSpaceLabels} compact />{/if}
  </span>
{/if}

<style>
  .entity-tooltip { position: absolute; z-index: 20; top: calc(100% + .45rem); left: 0; width: min(28rem, calc(100vw - 2rem)); max-height: min(32rem, 70vh); overflow: auto; padding: .8rem; border: 1px solid #74684e; border-radius: 3px; background: #202120; box-shadow: 0 8px 28px #000a; color: #e9e4d9; text-align: left; }
  .tooltip-status { display: block; color: #bbb6aa; font-size: .8rem; }
  .tooltip-status.error { color: #e5afa6; }
  @media (max-width: 640px) { .entity-tooltip { position: fixed; inset: auto 1rem 1rem; width: auto; } }
</style>
