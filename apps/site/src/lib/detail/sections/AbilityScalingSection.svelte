<script lang="ts">
  import type { AbilityAppliedEffect, EffectScaling, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import HowItWorks from '../HowItWorks.svelte';
  import { hasScaling } from '../scaling-formula';
  import Section from '../Section.svelte';
  import ScalingFormula from './ScalingFormula.svelte';

  export let rows: AbilityAppliedEffect[];
  export let registry: PublicKindEntry[];

  const combat = { key: 'mechanics:combat', kind: 'mechanics', name: 'Combat', slug: 'combat' } as const;
  type Group = { effect: AbilityAppliedEffect['effect']; ranks: { label: string; scaling: EffectScaling }[] };

  // One group per effect. Ranks become columns only when their parts differ.
  $: groups = [...rows.reduce((map, row) => {
    if (!hasScaling(row.scaling)) return map;
    const group = map.get(row.effect.key) ?? { effect: row.effect, ranks: [] };
    if (!group.ranks.some((rank) => JSON.stringify(rank.scaling) === JSON.stringify(row.scaling)))
      group.ranks.push({ label: `Rank ${formatNumber((row.rank ?? 0) + 1)}`, scaling: row.scaling });
    return map.set(row.effect.key, group);
  }, new Map<string, Group>()).values()];
  $: healing = groups.map((group) => group.ranks.every((rank) => rank.scaling.healing));
  $: title = healing.every(Boolean) ? 'Healing' : healing.some(Boolean) ? 'Damage and Healing' : 'Damage';
  $: named = groups.length > 1;
  // The damage type decides which stat adds to the hit, so it is stated once when every group shares it.
  $: types = [...new Set(groups.flatMap((group) => group.ranks.flatMap((rank) => !rank.scaling.healing && rank.scaling.mainType ? [rank.scaling.mainType] : [])))];
  $: line = types.length === 1 ? `${types[0]} damage.` : undefined;
</script>

{#if groups.length}
  <Section id="scaling" {title} {line}>
    <div class="groups">
      {#each groups as group}
        <div class="group">
          {#if named}<h3><EntityLink ref={group.effect} {registry} /></h3>{/if}
          <ScalingFormula ranks={group.ranks} {registry} label={`${group.effect.name} ${healing.every(Boolean) ? 'healing' : 'damage'}`} />
        </div>
      {/each}
      <HowItWorks guide={combat} section="damage-and-defense" label={healing.every(Boolean) ? 'How healing scales' : 'How damage scales'} />
    </div>
  </Section>
{/if}

<style>
  .groups { display: grid; gap: 1.1rem; min-width: 0; }
  .group { display: grid; gap: .5rem; min-width: 0; }
  h3 { margin: 0; font-size: var(--c-text-body); font-weight: 600; }
</style>
