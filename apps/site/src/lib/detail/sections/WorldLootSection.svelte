<script lang="ts">
  import type { ItemWorldLoot, LevelChance, PlacedRule } from '@afallon/contracts/public';
  import MissingValue from '../../MissingValue.svelte';
  import { eventChanceText, KILL_CHANCE_HINT } from '../../format';
  import HowItWorks from '../HowItWorks.svelte';
  import { levelRangeText, worldLootSubject } from '../item-sources';
  import LootChanceHint from '../LootChanceHint.svelte';
  import type { RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  // The item's chance per kill from World Loot, by the creature levels that can give it.
  export let loot: ItemWorldLoot;
  export let guide: PlacedRule | undefined = undefined;

  const columns: RelationColumn<LevelChance>[] = [
    { id: 'level', label: 'Creature Level', value: (row) => levelRangeText(row.minLevel, row.maxLevel), sort: (row) => row.minLevel },
    { id: 'rate', label: 'Chance per Kill', hint: KILL_CHANCE_HINT, numeric: true, value: (row) => row.chance ?? 'Unknown', sort: (row) => row.chance },
  ];
</script>

<Section id="world-loot" title="World Loot" line={`${worldLootSubject(loot)} can drop it as World Loot.${loot.levels.length > 1 ? " The chance depends on the creature's level." : ''}`}>
  <p class="rate-line">Chance for each kill, assuming no Loot Chance. <LootChanceHint /></p>
  <RelationTable {columns} rows={loot.levels} label="World Loot chance per kill by creature level" mobileAlignedNumbers>
    <svelte:fragment slot="cell" let:row let:column>
      {#if column === 'level'}{levelRangeText(row.minLevel, row.maxLevel)}
      {:else if row.chance === undefined}<MissingValue explanation={loot.oddsUnavailable ?? 'Chance unknown'} />
      {:else}{eventChanceText(row.chance, 'kill')}{/if}
    </svelte:fragment>
  </RelationTable>
  {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How creature drops work" />{/if}
</Section>

<style>
  .rate-line { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
</style>
