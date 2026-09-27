<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcVariantField, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import DataTable, { type TableColumn } from './DataTable.svelte';
  import EntityLink from './EntityLink.svelte';
  import NpcLevel from './NpcLevel.svelte';
  import { formatNumber, labelOf, rangeText, signedAmount } from './format';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  const FIELD_LABELS: Record<NpcVariantField, string> = {
    npcType: 'Type', creatureType: 'Creature type', family: 'Family', faction: 'Faction', species: 'Species', respawn: 'Respawn',
    experience: 'Experience', stats: 'Stats', immunities: 'Immune to', aggroRange: 'Aggro range', lootSpecialization: 'Loot',
    abilityPhases: 'Abilities', factionRewards: 'Faction rewards', linkedNpc: 'Linked NPC',
  };

  $: variants = document.variants;
  $: showLevel = new Set(variants.map((variant) => JSON.stringify(variant.level ?? null))).size > 1;
  $: portraits = variants.some((variant) => variant.portrait);
  $: columns = [
    { id: 'variant', label: 'Variant' },
    ...(showLevel ? [{ id: 'level', label: 'Level' }] : []),
    ...document.variantFields.map((field) => ({ id: field, label: FIELD_LABELS[field] })),
  ] satisfies TableColumn[];
</script>

<Card title="Variants" count={variants.length}>
  <DataTable {columns}>
    {#each variants as variant}
      {@const facts = variant.facts}
      {@const portrait = variant.portrait ?? document.art.portrait}
      <tr id={variant.anchor}>
        <td><span class="variant">{#if portraits && portrait}<img src={`${base}/data/${portrait.url}`} width={portrait.width} height={portrait.height} alt="" loading="lazy" />{/if}{variant.label}</span></td>
        {#if showLevel}<td><NpcLevel level={variant.level} /></td>{/if}
        {#each document.variantFields as field}
          <td>
            {#if field === 'npcType' && facts.npcType}{labelOf(facts.npcType)}
            {:else if field === 'creatureType' && facts.creatureType}{labelOf(facts.creatureType)}
            {:else if field === 'family' && facts.family}{labelOf(facts.family)}
            {:else if field === 'faction' && facts.faction}<EntityLink ref={facts.faction} {registry} />
            {:else if field === 'species' && facts.species}<EntityLink ref={facts.species} {registry} />
            {:else if field === 'respawn' && facts.respawn}{rangeText(facts.respawn.min, facts.respawn.max)} s
            {:else if field === 'experience' && facts.experience}{rangeText(facts.experience.min, facts.experience.max)}
            {:else if field === 'stats' && facts.stats?.length}
              <ul>{#each facts.stats as stat}<li>{stat.stat.key === null ? stat.stat.label : stat.stat.name} {signedAmount(stat.amount, stat.isPercent)}</li>{/each}</ul>
            {:else if field === 'immunities' && facts.immunities?.length}{facts.immunities.map(labelOf).join(', ')}
            {:else if field === 'aggroRange' && facts.aggroRange !== undefined}{formatNumber(facts.aggroRange)} m
            {:else if field === 'lootSpecialization' && facts.lootSpecialization}
              {[facts.lootSpecialization.armorType ? labelOf(facts.lootSpecialization.armorType) : '', ...facts.lootSpecialization.weaponTypes.map(labelOf)].filter(Boolean).join(' · ')}
              {#if facts.lootSpecialization.stat}<EntityLink ref={facts.lootSpecialization.stat} {registry} />{/if}
            {:else if field === 'abilityPhases' && facts.abilityPhases?.some((phase) => phase.abilities.length > 0)}
              <ul>{#each facts.abilityPhases.flatMap((phase) => phase.abilities) as reference}<li><EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} /></li>{/each}</ul>
            {:else if field === 'factionRewards' && facts.factionRewards?.length}
              <ul>{#each facts.factionRewards as reward}<li>{reward.counterpart.key === null ? reward.counterpart.label : reward.counterpart.name} {signedAmount(reward.amount)}</li>{/each}</ul>
            {:else if field === 'linkedNpc' && facts.linkedNpc}<EntityLink ref={facts.linkedNpc} {registry} />
            {:else}<span class="none">None</span>{/if}
          </td>
        {/each}
      </tr>
    {/each}
  </DataTable>
</Card>

<style>
  tr { scroll-margin-top: 5rem; }
  tr:target td { background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
  .variant { display: inline-flex; align-items: center; gap: .5rem; }
  img { width: 2rem; height: 2rem; flex: none; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; }
  ul { display: grid; gap: .25rem; margin: 0; padding: 0; list-style: none; }
  .none { color: var(--c-text-mute); }
</style>
