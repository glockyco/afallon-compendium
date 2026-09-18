<script lang="ts">
  import type { PublicDocument, PublicKindEntry, PublicPlacement } from '@afallon/contracts/public';
  import FactCard from '../FactCard.svelte';

  export let detailsPanel: HTMLElement;
  export let document: PublicDocument | null;
  export let selectedPlacement: PublicPlacement | null;
  export let registry: PublicKindEntry[];
  export let mapSpaceLabels: Readonly<Record<string, string>>;
  export let loading: boolean;
  export let error: string;
  export let staleSelection: string;
  export let onRetry: () => void;
  export let onClose: () => void;
</script>

<aside class="details-panel" bind:this={detailsPanel} aria-label="Development selection details">
  <div class="details-header"><div><span class="eyebrow">Development evidence</span><h2 tabindex="-1">{document?.ref.name ?? selectedPlacement?.label ?? 'Selection'}</h2></div>{#if document || selectedPlacement || staleSelection}<button type="button" class="close-button" on:click={onClose}>Close</button>{/if}</div>
  {#if staleSelection}<div class="stale-warning" role="alert"><p>{staleSelection}</p></div>{/if}
  {#if error}<div class="stale-warning" role="alert"><p>{error}</p><button type="button" class="inline-link" on:click={onRetry}>Retry details</button></div>{/if}
  {#if loading && !document}<p class="muted" role="status">Loading document…</p>{/if}
  {#if document}<FactCard {document} {registry} {mapSpaceLabels} compact showRelations limit={5} /><details class="entity-block"><summary>Published document</summary><pre>{JSON.stringify(document, null, 2)}</pre></details>{/if}
  {#if selectedPlacement}<details class="entity-block"><summary>Published placement</summary><pre>{JSON.stringify(selectedPlacement, null, 2)}</pre></details>{/if}
  {#if !document && !selectedPlacement && !staleSelection}<div class="details-empty"><span class="eyebrow">Development details</span><p>Select a marker or a result to inspect its published data.</p></div>{/if}
</aside>

<style>
  pre { max-height: 24rem; overflow: auto; color: #c8c4ba; font: .68rem/1.4 ui-monospace, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
