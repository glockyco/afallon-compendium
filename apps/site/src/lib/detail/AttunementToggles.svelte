<script lang="ts">
  import type { Attunement, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import { formatNumber, nameOf } from '../format';
  import { attunementKey as keyOf } from './gathering-odds';

  export let attunements: Attunement[];
  export let registry: PublicKindEntry[];
  /** The items whose attunements are active. */
  export let active: string[] = [];
  /** Leaves out the nodes, for a list of the attunements of one node. */
  export let compact = false;

  function toggle(key: string, on: boolean): void {
    active = on ? [...active, key] : active.filter((entry) => entry !== key);
  }
</script>

{#if attunements.length}
  <fieldset class="attunements">
    <legend>Attunements</legend>
    {#each attunements as attunement (keyOf(attunement))}
      <label>
        <input type="checkbox" checked={active.includes(keyOf(attunement))} on:change={(event) => toggle(keyOf(attunement), event.currentTarget.checked)} />
        <span><EntityLink ref={attunement.item} {registry} />{#if compact}: +{formatNumber(attunement.boost)} weight{:else}{' '}gives {attunement.effect}: +{formatNumber(attunement.boost)} weight for {attunement.nodes.map(nameOf).join(' and ')}{/if}{#if attunement.minutes !== undefined}, {formatNumber(attunement.minutes)} minutes{/if}</span>
      </label>
    {/each}
  </fieldset>
{/if}

<style>
  .attunements { display: grid; gap: .45rem; min-width: 0; margin: 0; padding: 0; border: 0; }
  legend { margin-bottom: .35rem; padding: 0; color: var(--c-text-strong); font-weight: 600; }
  label { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .55rem; align-items: baseline; color: var(--c-text-dim); line-height: 1.45; }
  input { margin: 0; accent-color: var(--c-accent); }
</style>
