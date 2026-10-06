<script lang="ts">
  import type { NpcDropRow, NpcSharedDrop, NpcVariant, PlacedRule, PublicKindEntry } from '@afallon/contracts/public';
  import VariantLinks from '../../VariantLinks.svelte';
  import { clothGroupText, dropGroupText, worldLootGroupText } from '../../format';
  import DropTable from '../DropTable.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import type { LevelLoot } from '../level-loot';
  import LootGroup from '../LootGroup.svelte';
  import { mergeRows } from '../relation-table';

  // What one kill of the creature gives, one group per roll in the game's order: each of its own loot lists, then World
  // Loot, then cloth. World Loot and cloth show the creature level of `loot`, which their sentences name.
  export let rows: NpcDropRow[];
  export let shared: NpcSharedDrop[] = [];
  export let loot: LevelLoot | undefined = undefined;
  /** Why `loot` is not yet at the level that the reader chose, when it could not load. */
  export let lootError: string | undefined = undefined;
  export let variants: NpcVariant[] = [];
  export let registry: PublicKindEntry[];
  /** The name of the NPC, which the empty state names. */
  export let name: string;
  export let guide: PlacedRule | undefined = undefined;

  const ruleKey = (row: NpcDropRow) => JSON.stringify([row.lootGroup ?? null, row.tableChance ?? null, row.tableMinimum ?? null, row.tableLimit ?? null]);
  $: groups = mergeRows(rows, ruleKey, (group) => [...group]);
  $: world = shared.find((drop) => drop.roll === 'worldLoot') && loot?.worldLoot;
  $: cloth = shared.find((drop) => drop.roll === 'cloth') && loot?.cloth;
  $: titled = groups.length + (world ? 1 : 0) + (cloth ? 1 : 0) > 1;
  $: sharedVariants = (roll: NpcSharedDrop['roll']) => shared.find((drop) => drop.roll === roll)?.variants;
</script>

{#if groups.length || world || cloth}
  <div class="groups">
    {#each groups as group, index}
      {@const calculated = group.filter((row) => row.killChance !== undefined)}
      {@const listed = group.filter((row) => row.killChance === undefined)}
      {@const title = titled ? `Drop Group ${index + 1}` : undefined}
      <LootGroup {title} line={dropGroupText(group[0]!, group.length, listed.length > 0)}>
        {#if calculated.length}
          <DropTable rows={calculated} {variants} {registry} heading={listed.length ? 'Calculated chance per kill' : undefined}
            label={`${title ?? 'Drops'}${listed.length ? ': calculated chance per kill' : ''}`} />
        {/if}
        {#if listed.length}
          <DropTable rows={listed} rate="listed" {variants} {registry} heading={calculated.length ? 'Listed rates' : undefined}
            label={`${title ?? 'Drops'}${calculated.length ? ': listed rates' : ''}`} />
        {/if}
      </LootGroup>
    {/each}
    {#if world || cloth}<slot name="level" />{/if}
    {#if lootError}<p class="load-error" role="status">{lootError}</p>{/if}
    {#if world && loot}
      <LootGroup title={titled ? 'World Loot' : undefined} line={worldLootGroupText(loot.level, world, world.rows.length)}>
        <svelte:fragment slot="line">{#if sharedVariants('worldLoot')}{' '}Only for <VariantLinks anchors={sharedVariants('worldLoot') ?? []} {variants} />.{/if}</svelte:fragment>
        {#if world.rows.length}<DropTable rows={world.rows} {registry} label={`World Loot at creature level ${loot.level}`} />{/if}
      </LootGroup>
    {/if}
    {#if cloth && loot}
      <LootGroup title={titled ? 'Cloth' : undefined} line={clothGroupText(loot.level, cloth, cloth.rows.length)}>
        <svelte:fragment slot="line">{#if sharedVariants('cloth')}{' '}Only for <VariantLinks anchors={sharedVariants('cloth') ?? []} {variants} />.{/if}</svelte:fragment>
        <DropTable rows={cloth.rows} rate="cloth" quantity={false} {registry} label={`Cloth at creature level ${loot.level}`} />
      </LootGroup>
    {/if}
    {#if guide}<HowItWorks guide={guide.guide} section={guide.section} label="How creature drops work" />{/if}
  </div>
{:else}<p class="empty">No known drops for {name}.</p>{/if}

<style>
  .groups { display: grid; gap: 1.25rem; }
  .load-error { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-body); }
  .empty { margin: 0; color: var(--c-text-dim); }
</style>
