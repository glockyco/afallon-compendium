<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcVariant, NpcVariantField, PublicKindEntry, PublicNpc, Ref } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, levelText, nameOf, npcTypeName } from '../../format';
  import CompareTable from '../CompareTable.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import Section from '../Section.svelte';

  // The versions of an NPC compared side by side: one column for each version, headed by where it appears, and one row
  // for each fact in which the versions differ. A fact that every version shares says nothing about the difference and
  // has no row.
  export let document: PublicNpc;
  export let registry: PublicKindEntry[];

  type Field = Exclude<NpcVariantField, 'stats' | 'abilityPhases'>;
  const FIELD_LABELS: Record<Field, string> = {
    npcType: 'Type', creatureType: 'Creature type', tameable: 'Hunter pet', family: 'Family', faction: 'Faction', species: 'Species', respawn: 'Respawn',
    experience: 'Experience', immunities: 'Immune to', aggroRange: 'Aggro range', lootSpecialization: 'Gear preference',
    factionRewards: 'Faction changes', linkedNpc: 'Linked NPC',
  };
  // Who it is first, then how it fights, then its stats, and its abilities last because they take the most room.
  const FIELD_ORDER: readonly Field[] = [
    'npcType', 'creatureType', 'family', 'faction', 'species', 'tameable', 'respawn', 'experience', 'aggroRange', 'immunities',
    'lootSpecialization', 'factionRewards', 'linkedNpc',
  ];

  type StatRow = NonNullable<NpcVariant['facts']['stats']>[number];
  const statId = (stat: StatRow) => `stat:${stat.stat.key ?? nameOf(stat.stat)}${stat.isPercent ? ':percent' : ''}`;
  const statText = (amount: number, isPercent: boolean) => `${formatNumber(amount)}${isPercent ? '%' : ''}`;
  const abilities = (variant: NpcVariant) => variant.facts.abilityPhases?.flatMap((phase) => phase.abilities) ?? [];

  /** The comparable text of one differing fact of a version, or `undefined` when the version lacks it. */
  function fieldValue(variant: NpcVariant, field: Field): string | undefined {
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
      case 'immunities': return facts.immunities?.map(categoryLabel).join(', ') || undefined;
      case 'aggroRange': return facts.aggroRange === undefined ? undefined : `${formatNumber(facts.aggroRange)} m`;
      case 'lootSpecialization': {
        const preference = facts.lootSpecialization;
        if (!preference) return undefined;
        return [preference.armorType ? `${categoryLabel(preference.armorType)} armor` : '', ...preference.weaponTypes.map(categoryLabel), preference.stat ? `favours ${nameOf(preference.stat)}` : '']
          .filter(Boolean).join(', ');
      }
      case 'factionRewards': return facts.factionRewards?.map((reward) => `${nameOf(reward.counterpart)} ${reward.amount}`).join(', ') || undefined;
      case 'linkedNpc': return facts.linkedNpc ? nameOf(facts.linkedNpc) : undefined;
    }
  }
  const linkOf = (variant: NpcVariant, fact: string): Ref | undefined =>
    fact === 'faction' ? variant.facts.faction : fact === 'species' ? variant.facts.species : fact === 'linkedNpc' ? variant.facts.linkedNpc : undefined;

  $: variants = document.variants;
  $: fields = new Set(document.variantFields);
  $: stats = fields.has('stats')
    ? [...new Map(variants.flatMap((variant) => variant.facts.stats ?? []).map((stat) => [statId(stat), stat] as const)).values()]
    : [];
  // The facts that differ, in reading order. The shared table planner decides which facts every version shares.
  $: facts = planColumns([
    { id: 'level', label: 'Level', value: (variant) => variant.level ? levelText(variant.level) + (variant.level.scales ? '*' : '') : undefined, whenShared: omitAlways },
    ...FIELD_ORDER.filter((field) => fields.has(field)).map((field): RelationColumn<NpcVariant> => ({ id: field, label: FIELD_LABELS[field], value: (variant) => fieldValue(variant, field), whenShared: omitAlways })),
    ...stats.map((stat): RelationColumn<NpcVariant> => ({
      id: statId(stat), label: nameOf(stat.stat), whenShared: omitAlways,
      value: (variant) => variant.facts.stats?.find((candidate) => statId(candidate) === statId(stat))?.amount,
    })),
    ...(fields.has('abilityPhases') ? [{ id: 'abilityPhases', label: 'Abilities', value: (variant: NpcVariant) => abilities(variant).map((reference) => nameOf(reference.ability)).join(', ') || undefined, whenShared: omitAlways }] : []),
  ] satisfies RelationColumn<NpcVariant>[], variants).columns;
  $: experienceRule = document.placedRules.find((entry) => entry.target === 'experience');
  $: statOf = (variant: NpcVariant, id: string) => variant.facts.stats?.find((stat) => statId(stat) === id);
  $: portraits = variants.some((variant) => variant.portrait);
  // When every listed level scales, the section line says so once instead of in every cell.
  $: levels = facts.some((fact) => fact.id === 'level') ? variants.flatMap((variant) => variant.level ? [variant.level] : []) : [];
  $: allScale = levels.length > 0 && levels.every((level) => level.scales);

  const present = (variant: NpcVariant, id: string) => { const value = facts.find((fact) => fact.id === id)?.value(variant); return value !== undefined && value !== ''; };
</script>

<Section id="variants" title="Variants" count={variants.length} line={`The game has ${formatNumber(variants.length)} versions of ${document.ref.name} with the same name. They differ in these facts.${allScale ? ' Every level scales with the player.' : ''}`}>
  <CompareTable items={variants} {facts} has={present} anchor={(variant) => variant.anchor} label="Versions" minColumn={170}>
    <svelte:fragment slot="head" let:item>
      {@const portrait = item.portrait ?? document.art.portrait}
      {#if portraits && portrait}<img src={`${base}/data/${portrait.url}`} width={portrait.width} height={portrait.height} alt="" loading="lazy" />{/if}{item.label}
    </svelte:fragment>
    <svelte:fragment slot="fact" let:fact>{fact.label}{#if fact.id === 'experience' && experienceRule}<HowItWorks guide={experienceRule.guide} section={experienceRule.section} label="How kill experience works" compact />{/if}</svelte:fragment>
    <svelte:fragment slot="cell" let:item let:fact>
      {@const stat = statOf(item, fact)}
      {@const link = linkOf(item, fact)}
      {#if fact === 'level'}<NpcLevel level={item.level} showScalingNote={!allScale} />
      {:else if fact === 'abilityPhases'}
        {#if abilities(item).length}<ul>{#each abilities(item) as reference}<li><EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} /></li>{/each}</ul>{:else}<span class="none">None</span>{/if}
      {:else if stat}{statText(stat.amount, stat.isPercent)}
      {:else if link}<EntityLink ref={link} {registry} plain />
      {:else}{fieldValue(item, fact as Field) ?? ''}{/if}
    </svelte:fragment>
  </CompareTable>
</Section>

<style>
  /* The portrait sits inline and centers on the label's letters. */
  img { width: 2.25rem; height: 2.25rem; margin-right: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; vertical-align: middle; }
  /* An ability list is one left-aligned block, centered as a whole when its column centers. */
  ul { display: inline-grid; gap: .3rem; margin: 0; padding: 0; list-style: none; text-align: left; }
  /* A long name that wraps continues under its first letter, not under its icon: the icon and its gap hang in the indent. */
  li { padding-left: 1.8em; text-indent: -1.8em; }
  li :global(*) { text-indent: 0; }
  .none { color: var(--c-text-mute); }
</style>
