<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import TabSet from '../TabSet.svelte';
  import type { PackBand } from '../supply-pack-tabs';
  import SupplyPackBand from './SupplyPackBand.svelte';

  /** The level bands of one class. */
  export let bands: PackBand[];
  /** Whether the section already states the picks that every band shares. */
  export let picksShared: boolean;
  export let registry: PublicKindEntry[];

  $: tabs = bands.map(({ key, label }) => ({ key, label }));
</script>

{#if bands.length > 1}
  <!-- The level band has its own query field, so it stays selected when the reader changes the class. -->
  <TabSet {tabs} label="Level" idPrefix="supply-pack-level" param="level" let:key>
    {#each bands.filter((band) => band.key === key) as band (band.key)}<SupplyPackBand {band} {picksShared} {registry} />{/each}
  </TabSet>
{:else}
  {#each bands as band (band.key)}<SupplyPackBand {band} {picksShared} showLabel={band.key !== 'all-levels'} {registry} />{/each}
{/if}
