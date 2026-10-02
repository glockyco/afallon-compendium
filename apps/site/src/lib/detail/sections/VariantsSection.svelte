<script lang="ts">
  import { base } from '$app/paths';
  import type { NpcVariant, NpcVariantField, PublicKindEntry, PublicNpc, Ref } from '@afallon/contracts/public';
  import { categoryLabel } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import NpcLevel from '../../NpcLevel.svelte';
  import { creatureTypeLabel, durationRangeText, formatNumber, killExperienceText, levelText, nameOf, npcTypeName } from '../../format';
  import HowItWorks from '../HowItWorks.svelte';
  import { omitAlways, planColumns, type RelationColumn } from '../relation-table';
  import Section from '../Section.svelte';

  // The versions of an NPC compared side by side: one column for each version, headed by where it appears, and one row
  // for each fact in which the versions differ. A fact that every version shares says nothing about the difference and
  // has no row. The versions share the width evenly and center their values, so the space spreads across the columns.
  // When the versions do not fit across the column, they wrap into blocks of equal size, each repeating the fact names,
  // so the comparison never scrolls sideways. A phone shows one version per block, which reads as a list of facts.
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

  // Widths in pixels at the base font size: the fact names, and the narrowest version column that keeps a common ability
  // name, such as Fireball Friendly, on one line beside its icon.
  const FACT_WIDTH = 168;
  const VERSION_MIN = 170;
  // Before the first layout the width is unknown, and three versions fit the widest common column.
  let width = 0;
  $: perBlock = width ? Math.max(1, Math.floor((width - FACT_WIDTH) / VERSION_MIN)) : 3;
  $: blockCount = Math.ceil(variants.length / perBlock);
  $: blockSize = Math.ceil(variants.length / blockCount);
  // Block sizes differ by at most one, so no version is left alone in a last block: seven versions read as 3, 2, and 2.
  $: blocks = Array.from({ length: blockCount }, (_, index) => {
    const smaller = Math.floor(variants.length / blockCount);
    const larger = variants.length % blockCount;
    const start = index * smaller + Math.min(index, larger);
    return { start, variants: variants.slice(start, start + smaller + (index < larger ? 1 : 0)) };
  });
  const present = (fact: RelationColumn<NpcVariant>, variant: NpcVariant) => { const value = fact.value(variant); return value !== undefined && value !== ''; };
</script>

<Section id="variants" title="Variants" count={variants.length} line={`The game has ${formatNumber(variants.length)} versions of ${document.ref.name} with the same name. They differ in these facts.${allScale ? ' Every level scales with the player.' : ''}`}>
  <div class="compare" class:side-by-side={blockSize > 1} bind:clientWidth={width}>
    {#each blocks as { start, variants: block }}
      <table aria-label={blocks.length > 1 ? `Versions ${start + 1} to ${start + block.length}` : 'Versions'}>
        <colgroup><col style:width={`${FACT_WIDTH}px`} />{#each { length: blockSize } as _}<col />{/each}</colgroup>
        <thead>
          <tr>
            <td></td>
            {#each block as variant (variant.anchor)}
              {@const portrait = variant.portrait ?? document.art.portrait}
              <th scope="col" id={variant.anchor}>{#if portraits && portrait}<img src={`${base}/data/${portrait.url}`} width={portrait.width} height={portrait.height} alt="" loading="lazy" />{/if}<span>{variant.label}</span></th>
            {/each}
            {#each { length: blockSize - block.length } as _}<td></td>{/each}
          </tr>
        </thead>
        <tbody>
          {#each facts.filter((fact) => block.some((variant) => present(fact, variant))) as fact (fact.id)}
            <tr>
              <th scope="row">{fact.label}{#if fact.id === 'experience' && experienceRule}<HowItWorks guide={experienceRule.guide} section={experienceRule.section} label="How kill experience works" compact />{/if}</th>
              {#each block as variant (variant.anchor)}
                {@const stat = statOf(variant, fact.id)}
                {@const link = linkOf(variant, fact.id)}
                <td>
                  {#if fact.id === 'level'}<NpcLevel level={variant.level} showScalingNote={!allScale} />
                  {:else if fact.id === 'abilityPhases'}
                    {#if abilities(variant).length}<ul>{#each abilities(variant) as reference}<li><EntityLink ref={reference.ability} rankIndex={reference.rankIndex} {registry} /></li>{/each}</ul>{:else}<span class="none">None</span>{/if}
                  {:else if stat}{statText(stat.amount, stat.isPercent)}
                  {:else if link}<EntityLink ref={link} {registry} plain />
                  {:else}{fieldValue(variant, fact.id as Field) ?? ''}{/if}
                </td>
              {/each}
              {#each { length: blockSize - block.length } as _}<td></td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
  </div>
</Section>

<style>
  /* One frame as a relation table has. Each block of versions is its own table with equal version columns. */
  .compare { min-width: 0; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); overflow: hidden; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: var(--c-text-body); }
  table + table { border-top: 1px solid var(--c-line); }
  th, td { padding: .55rem .75rem; text-align: left; vertical-align: top; overflow-wrap: break-word; }
  thead tr { background: var(--c-surface-2); }
  thead tr > * { border-bottom: 1px solid var(--c-line-soft); }
  thead th { color: var(--c-text-strong); font-weight: 600; line-height: 1.3; vertical-align: bottom; scroll-margin-top: 6rem; }
  thead th:target { color: var(--c-accent); box-shadow: inset 0 -2px 0 var(--c-accent); }
  thead img { display: block; width: 2.5rem; height: 2.5rem; margin-bottom: .4rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; }
  tbody th { color: var(--c-text-dim); font-weight: 400; }
  tbody th :global(.how-it-works) { margin-left: .35rem; vertical-align: middle; }
  tbody tr + tr > * { border-top: 1px solid var(--c-line-soft); }
  td { font-variant-numeric: tabular-nums; }
  td :global(small) { display: block; color: var(--c-text-mute); font-size: var(--c-text-small); }
  td :global(.separator) { display: none; }
  ul { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  /* A long name that wraps continues under its first letter, not under its icon: the icon and its gap hang in the indent. */
  li { padding-left: 1.8em; text-indent: -1.8em; }
  li :global(*) { text-indent: 0; }
  /* Versions side by side center on their columns. An ability list stays one left-aligned block. */
  .side-by-side thead th, .side-by-side td { text-align: center; }
  .side-by-side thead img { margin-inline: auto; }
  .side-by-side ul { display: inline-grid; text-align: left; }
  .none { color: var(--c-text-mute); }
</style>
