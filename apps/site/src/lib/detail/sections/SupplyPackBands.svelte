<script lang="ts">
  import type { ItemUsePack, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import HowItWorks from '../HowItWorks.svelte';
  import TabSet from '../TabSet.svelte';
  import { packClasses, packPicksText, sharedPicks } from '../supply-pack-tabs';
  import SupplyPackClass from './SupplyPackClass.svelte';

  /** The class and level gated tables of a supply pack. A reader picks a class and then a level band. */
  export let packs: ItemUsePack[];
  export let guide: PlacedRule | undefined = undefined;
  export let registry: PublicKindEntry[];

  $: picksShared = sharedPicks(packs);
  $: classes = packClasses(packs);
  $: tabs = classes.map(({ key, label }) => ({ key, label }));
</script>

<div class="c-stack">
  {#if picksShared && packs[0]}<p>{packPicksText(packs[0])}</p>{/if}
  {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How supply packs work" />{/if}
  {#if classes.length > 1}
    <TabSet {tabs} label="Class" idPrefix="supply-pack-class" let:key>
      {#each classes.filter((entry) => entry.key === key) as entry (entry.key)}<SupplyPackClass bands={entry.bands} {picksShared} {registry} />{/each}
    </TabSet>
  {:else}
    {#each classes as entry (entry.key)}<SupplyPackClass bands={entry.bands} {picksShared} {registry} />{/each}
  {/if}
</div>
