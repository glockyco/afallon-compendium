<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcVariant, NpcVariantField, PublicKindEntry, PublicNpc } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, levelText, nameOf, npcTypeName } from '../../format';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  const FIELD_LABELS: Record<NpcVariantField, string> = {
    npcType: 'Type', creatureType: 'Creature type', tameable: 'Hunter pet', family: 'Family', faction: 'Faction', species: 'Species', respawn: 'Respawn',
    experience: 'Experience', stats: 'Stats', immunities: 'Immune to', aggroRange: 'Aggro range', lootSpecialization: 'Favoured loot',
    abilityPhases: 'Abilities', factionRewards: 'Faction changes', linkedNpc: 'Linked NPC',
  };

  const statText = (amount: number, isPercent: boolean) => `${formatNumber(amount)}${isPercent ? '%' : ''}`;

  /** The comparable text of one differing fact of a variant, or `undefined` when the variant lacks it. */
  function fieldValue(variant: NpcVariant, field: NpcVariantField): string | undefined {
    const facts = variant.facts;
    switch (field) {
      case 'npcType': return facts.npcType ? npcTypeName(facts.npcType) : undefined;
      case 'creatureType': return creatureTypeLabel(facts.creatureType);
      case 'tameable': return facts.tameable ? 'Can be tamed' : 'Cannot be tamed';
      case 'family': return facts.family ? categoryLabel(facts.family) : undefined;
      case 'faction': return facts.faction ? nameOf(facts.faction) : undefined;
      case 'species': return facts.species ? nameOf(facts.species) : undefined;
      case 'respawn': return facts.respawn ? durationRangeText(facts.respawn.min, facts.respawn.max) : undefined;
      case 'experience': return facts.experience ? killExperienceText(facts.experience, variant.level) : undefined;
      case 'stats': return facts.stats?.map((stat) => `${nameOf(stat.stat)} ${statText(stat.amount, stat.isPercent)}`).join(', ') || undefined;
      case 'immunities': return facts.immunities?.map(categoryLabel).join(', ') || undefined;
      case 'aggroRange': return facts.aggroRange === undefined ? undefined : `${formatNumber(facts.aggroRange)} m`;
      case 'lootSpecialization': return facts.lootSpecialization ? JSON.stringify(facts.lootSpecialization) : undefined;
      case 'abilityPhases': return facts.abilityPhases?.flatMap((phase) => phase.abilities).map((reference) => nameOf(reference.ability)).join(', ') || undefined;
      case 'factionRewards': return facts.factionRewards?.map((reward) => `${nameOf(reward.counterpart)} ${reward.amount}`).join(', ') || undefined;
      case 'linkedNpc': return facts.linkedNpc ? nameOf(facts.linkedNpc) : undefined;
    }
  }

  $: variants = document.variants;
  $: columns = [
    { id: 'variant', label: 'Variant', value: (variant) => variant.label },
    { id: 'level', label: 'Level', value: (variant) => variant.level ? levelText(variant.level) + (variant.level.scales ? '*' : '') : undefined, whenShared: omitAlways },
    ...document.variantFields.map((field) => ({ id: field, label: FIELD_LABELS[field], value: (variant: NpcVariant) => fieldValue(variant, field), ...(field === 'experience' ? { rules: document.placedRules.filter((entry) => entry.target === 'experience') } : {}) })),
  ] satisfies RelationColumn<NpcVariant>[];
  $: plan = planColumns(columns, variants);
  $: portraits = variants.some((variant) => variant.portrait);
  $: fieldOf = (column: string): NpcVariantField | undefined => document.variantFields.find((field) => field === column);
</script>

<Section id="variants" title="Variants" count={variants.length} line={`The game has several versions of ${document.ref.name}. They share a name but differ in the facts below.`}>
  <RelationTable columns={plan.columns} rows={variants} label="Variants" rowAnchors={(variant) => [variant.anchor]}>
    <svelte:fragment slot="cell" let:row let:column>
      {@const field = fieldOf(column)}
      {#if column === 'variant'}
        {@const portrait = row.portrait ?? document.art.portrait}
        {#if portraits && portrait}<img src={`${base}/data/${portrait.url}`} width={portrait.width} height={portrait.height} alt="" loading="lazy" />{/if}{row.label}
      {:else if column === 'level'}<NpcLevel level={row.level} />
      {:else if field === 'faction' && row.facts.faction}<EntityLink ref={row.facts.faction} {registry} />
      {:else if field === 'species' && row.facts.species}<EntityLink ref={row.facts.species} {registry} />
      {:else if field === 'linkedNpc' && row.facts.linkedNpc}<EntityLink ref={row.facts.linkedNpc} {registry} />
      {:else if field === 'stats' && row.facts.stats}
        <ul>{#each row.facts.stats as stat}<li>{nameOf(stat.stat)} {statText(stat.amount, stat.isPercent)}</li>{/each}</ul>
      {:else if field === 'abilityPhases' && row.facts.abilityPhases}
        <ul>{#each row.facts.abilityPhases.flatMap((phase) => phase.abilities) as reference}<li><EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} /></li>{/each}</ul>
      {:else if field === 'lootSpecialization' && row.facts.lootSpecialization}
        {@const loot = row.facts.lootSpecialization}
        {[loot.armorType ? categoryLabel(loot.armorType) : '', ...loot.weaponTypes.map(categoryLabel)].filter(Boolean).join(', ')}{#if loot.stat}<div><EntityLink ref={loot.stat} {registry} /></div>{/if}
      {:else if field}{fieldValue(row, field) ?? 'None'}{/if}
    </svelte:fragment>
  </RelationTable>
</Section>

<style>
  /* The portrait sits inline and centers on the letters, so the label keeps the text baseline that the other cells align to. */
  img { width: 2rem; height: 2rem; margin-right: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; vertical-align: middle; }
  ul { display: grid; gap: .25rem; margin: 0; padding: 0; list-style: none; }
</style>
