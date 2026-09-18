<script lang="ts">
  import type { PublicGearSet, PublicKindEntry } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import ChipGrid, { type Chip } from './ChipGrid.svelte';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import RefList from './RefList.svelte';
  import { signedAmount } from './format';

  export let document: PublicGearSet;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: headerFacts = [
    { label: 'Pieces', value: String(document.facts.memberCount) },
    ...(document.tiers.length > 0 ? [{ label: 'Tiers', value: String(document.tiers.length) }] : []),
  ] satisfies HeaderFact[];
  $: tiers = (limit === undefined ? document.tiers : document.tiers.slice(0, limit)).map((tier, index) => ({
    heading: `Tier ${index + 1}`,
    equipped: tier.equipped,
    chips: tier.stats.map((stat) => ({
      label: stat.stat.key === null ? stat.stat.label : stat.stat.name,
      value: signedAmount(stat.amount, stat.isPercent),
    })) satisfies Chip[],
  }));
</script>

<article class="document" class:c-compact={compact}>
  <EntityHeader
    name={document.ref.name}
    art={document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'gearSets')?.icon}
    facts={headerFacts}
    description={document.description}
    {compact}
  />

  <div class="c-stack">
    <RefList title="Members" refs={document.members} {registry} {limit} />
    {#if tiers.length}
      <Card title="Set bonuses" count={document.tiers.length}>
        <div class="tiers">
          {#each tiers as tier}
            <div class="tier">
              <p class="tier-name">{tier.heading}<span class="equipped">{tier.equipped} pieces equipped</span></p>
              <ChipGrid chips={tier.chips} />
            </div>
          {/each}
        </div>
      </Card>
    {/if}
    {#if showRelations && document.members.length === 0}<p class="c-empty">No member item is published for this set.</p>{/if}
  </div>
</article>

<style>
  .tiers { display: grid; gap: .9rem; }
  .tier-name { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; margin: 0 0 .45rem; color: var(--c-text-dim); font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .equipped { color: var(--c-text-mute); font-weight: 400; letter-spacing: normal; text-transform: none; }
</style>
