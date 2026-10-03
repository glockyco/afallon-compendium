<script lang="ts">
  import { base } from '$app/paths';
  import { categoryLabel, type PublicEffect, type PublicKindEntry, type Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import DetailsDisclosure from '../DetailsDisclosure.svelte';
  import { actionWords, durationWords, effectImpact, rankOutcome } from '../effect-outcome';
  import FactsCard from '../FactsCard.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import { mergeRows, planColumns, omitWhenShared, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import RulePhrase from '../sections/RulePhrase.svelte';
  import ScalingFormula from '../sections/ScalingFormula.svelte';
  import { hasScaling } from '../scaling-formula';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicEffect;
  export let registry: PublicKindEntry[];
  export let subtitle: string | undefined = undefined;
  const combat = { key: 'mechanics:combat', kind: 'mechanics', name: 'Combat', slug: 'combat' } as const;
  function subtitleTitle(value: string): string {
    if (value.startsWith('stacks up to ')) {
      const suffix = value.slice('stacks up to '.length);
      const separator = suffix.indexOf(', ');
      return separator < 0 ? `Stacks Up to ${suffix}` : `Stacks Up to ${suffix.slice(0, separator)}, ${subtitleTitle(suffix.slice(separator + 2))}`;
    }
    if (/^\d+ ranks$/.test(value)) return value.replace(' ranks', ' Ranks');
    if (/^\d/.test(value)) return categoryLabel(value);
    if (/:\s*\d/u.test(value)) return categoryLabel(value);
    if (value.startsWith('summons ')) return `Summons ${value.slice('summons '.length)}`;
    if (value.startsWith('travels to ')) return `Travels to ${value.slice('travels to '.length)}`;
    return value;
  }
  type Source = PublicEffect['appliedBy'][number];
  type World = PublicEffect['worldSources'][number];
  type Check = PublicEffect['checkedBy'][number];
  const sourceColumns: RelationColumn<Source>[] = [
    { id: 'source', label: 'Source', value: (row) => 'name' in row.source ? row.source.name : row.source.label, sort: (row) => 'name' in row.source ? row.source.name : row.source.label },
    { id: 'via', label: 'How', value: (row) => row.via, sort: (row) => row.via, whenShared: omitWhenShared('Ability') },
    { id: 'rank', label: 'Rank', numeric: true, value: (row) => row.rank === undefined ? undefined : row.rank + 1, sort: (row) => row.rank ?? -1, whenShared: omitWhenShared(1) },
    { id: 'chance', label: 'Chance', hint: 'Abilities roll each time they hit a target. Item actions roll per use. On-hit stats roll this effect chance only after the stat triggers.', numeric: true, value: (row) => row.chance, sort: (row) => row.chance },
    { id: 'target', label: 'Target', value: (row) => row.target, sort: (row) => row.target, whenShared: omitWhenShared('Target') },
  ];
  const worldColumns: RelationColumn<World>[] = [
    { id: 'place', label: 'Place', value: (row) => row.place ? ('name' in row.place ? row.place.name : row.place.label) : 'Place not mapped' },
    { id: 'family', label: 'Interaction', value: (row) => row.family },
    { id: 'count', label: 'Sources', numeric: true, value: (row) => row.sourceCount, sort: (row) => row.sourceCount },
  ];
  const checkColumns: RelationColumn<Check>[] = [
    { id: 'owner', label: 'Used By', value: (row) => row.owner ? ('name' in row.owner ? row.owner.name : row.owner.label) : row.label },
    { id: 'condition', label: 'Condition', value: (row) => `${row.state.toLowerCase()} on ${row.target.toLowerCase()}` },
    { id: 'count', label: 'Checks', numeric: true, value: (row) => row.count, sort: (row) => row.count },
  ];
  $: icon = document.art.icon ?? document.ref.icon;
  $: first = document.ranks[0];
  $: actions = first?.actions ?? [];
  $: impact = effectImpact(document);
  $: scales = hasScaling(first?.scaling);
  // Each distinct rank calculation becomes a column of the breakdown, so the Ranks table need not repeat it.
  $: scalingRanks = document.ranks.flatMap((rank) => hasScaling(rank.scaling) ? [{ label: `Rank ${formatNumber(rank.rank + 1)}`, scaling: rank.scaling }] : [])
    .filter((rank, index, all) => all.findIndex((other) => JSON.stringify(other.scaling) === JSON.stringify(rank.scaling)) === index);
  $: leadImpact = ['Instant Damage', 'Damage Over Time', 'Instant Heal', 'Heal Over Time', 'Pet'].includes(document.type) || !actions.length ? impact : '';
  $: summon = document.type === 'Pet' ? actions.find((entry) => entry.label === 'Summons') : undefined;
  $: summonCount = actions.find((entry) => entry.label === 'Summon Count')?.amount;
  $: summonDuration = actions.find((entry) => entry.label === 'Pet Duration')?.amount;
  $: detailActions = actions.filter((entry) => !['Authored Damage', 'Authored Healing', 'Damage Type', 'Damage Category', 'Life Steal Modifier', 'Summons', 'Summon Count', 'Pet Duration'].includes(entry.label)
    && !(entry.label === 'Restores' && actions.some((action) => action.label === 'Authored Healing')));
  $: hasRanks = document.ranks.length > 1 && document.ranks.some((rank) =>
    rankOutcome(document, rank) !== (first ? rankOutcome(document, first) : '')
    || (!scales && JSON.stringify(rank.scaling) !== JSON.stringify(first?.scaling))
    || rank.requiredEffect?.key !== first?.requiredEffect?.key
    || rank.requiredEffectDamageModifier !== first?.requiredEffectDamageModifier);
  $: sourceRows = mergeRows(document.appliedBy, (row) => JSON.stringify([row.source.key, row.via, row.rank, row.chance, row.target]), (group) => group[0]!);
  $: sourcePlan = planColumns(sourceColumns, sourceRows);
  $: worldPlan = planColumns(worldColumns, document.worldSources);
  $: checkPlan = planColumns(checkColumns, document.checkedBy);
  $: duration = document.isState && document.durationSeconds > 0 ? durationWords(document.durationSeconds) : document.isState && document.endless ? 'Until removed' : undefined;
  $: facts = [
    ...(duration ? [{ label: 'Duration', value: duration }] : []),
    ...(document.stackLimit > 1 ? [{ label: 'Stack limit', value: formatNumber(document.stackLimit) }] : []),
    ...(document.pulses > 1 ? [{ label: 'Pulses', value: formatNumber(document.pulses) }] : []),
  ];
  $: side = facts.length > 1;
  $: howLinks = [...new Map(document.explainedBy.map(({ guide, section, label }) => [`${guide.key}#${section}`, { guide, section, label }])).values()];
  $: condition = !impact ? document.checkedBy.find((row) => row.owner?.key && ['abilities', 'items'].includes(row.owner.kind)) : undefined;
</script>

<article class="detail-page">
  <DetailFrame {side}>
    <div slot="head"><TitleBlock name={document.ref.name} typeLine={`${document.type} Effect${subtitle ? ` · ${subtitleTitle(subtitle)}` : ''}`} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry} /></div>
    <div slot="answer"><AnswerCard title="What it does" id="what-it-does">
      {#if condition}<p><EntityLink ref={condition.owner!} {registry} /> checks whether {document.ref.name} is {condition.state.toLowerCase()} before it can be used.</p>
      {:else if document.explainedBy.length}
        {#each document.explainedBy as explanation (explanation.rule.id)}
          <div class="impact"><RulePhrase rule={explanation.rule} {registry} self={document.ref.key} /></div>
        {/each}
      {:else if summon?.target}<p class="impact">Summons {summonCount && summonCount > 1 ? `${formatNumber(summonCount)} ` : ''}<EntityLink ref={summon.target} {registry} />{summonDuration ? ` for ${durationWords(summonDuration)}` : ''}.</p>
      {:else if scales}{#if first?.scaling?.mainType && !first.scaling.healing}<p>{first.scaling.mainType} damage.</p>{/if}<ScalingFormula ranks={scalingRanks} {registry} label={`${document.ref.name} ${first?.scaling?.healing ? 'healing' : 'damage'}`} />
      {:else if leadImpact}<p class="impact">{leadImpact}</p>{/if}
      {#if scales && (condition || document.explainedBy.length)}
        <ScalingFormula ranks={scalingRanks} {registry} label={`${document.ref.name} ${first?.scaling?.healing ? 'healing' : 'damage'}`} />
      {/if}
      {#if (document.type === 'Damage Over Time' || document.type === 'Heal Over Time') && scales}
        <p>Each pulse uses your stats at that moment.</p>
      {/if}
      {#if document.description && document.description !== impact && !document.explainedBy.length}<p>{document.description}</p>{/if}
      {#if actions.length && !['Instant Damage', 'Damage Over Time', 'Instant Heal', 'Heal Over Time', 'Pet'].includes(document.type)}
        <ul class="actions">{#each actions as entry}{@const text = actionWords(entry)}<li>{text.before}{#if entry.target}<EntityLink ref={entry.target} {registry} />{/if}{text.after}</li>{/each}</ul>
      {:else if detailActions.length}
        <DetailsDisclosure title="More Effect Details">
          <ul class="actions">{#each detailActions as entry}{@const text = actionWords(entry)}<li>{text.before}{#if entry.target}<EntityLink ref={entry.target} {registry} />{/if}{text.after}</li>{/each}</ul>
        </DetailsDisclosure>
      {/if}
      {#if duration && !side}<p>Lasts {duration.toLowerCase()}.</p>{/if}
      {#if first?.requiredEffect}<p>Damage depends on <EntityLink ref={first.requiredEffect} {registry} />.</p>{/if}
      {#if document.explainedBy.length}
        {#each howLinks as explanation (`${explanation.guide.key}#${explanation.section}`)}
          <HowItWorks guide={explanation.guide} section={explanation.section} label={explanation.label} />
        {/each}
      {:else}
        <HowItWorks guide={combat} section="effects" label="How combat effects work" />
      {/if}
      {#if scales && !howLinks.some((row) => row.guide.key === combat.key && row.section === 'damage-and-defense')}
        <HowItWorks guide={combat} section="damage-and-defense" label={first?.scaling?.healing ? 'How healing scales' : 'How damage scales'} />
      {/if}
    </AnswerCard></div>
    <svelte:fragment slot="side"><FactsCard {facts} title="At a Glance" /></svelte:fragment>
    <Sections>
      {#if sourceRows.length}<Section id="applied-by" title="Sources" count={sourceRows.length} line="Abilities, items, and other sources that apply this effect.">
        <RelationTable columns={sourcePlan.columns} rows={sourceRows} label="Effect sources"><svelte:fragment slot="cell" let:row let:column>
          {#if column === 'source'}<EntityLink ref={row.source} {registry} />
          {:else if column === 'via'}{row.via === 'Stat On Hit' ? 'On hit' : row.via === 'Item Use' ? 'Using item' : row.via === 'Item Ability' ? 'Item ability' : row.via === 'NPC Ability' ? 'Creature ability' : row.via === 'Caster Ability' ? 'Caster ability' : `${row.via.charAt(0)}${row.via.slice(1).toLowerCase()}`}
          {:else if column === 'rank'}{row.rank === undefined ? '' : formatNumber(row.rank + 1)}
          {:else if column === 'chance'}{row.chance === undefined ? '' : `${formatNumber(row.chance)}% ${row.via === 'Stat On Hit' ? 'when stat triggers' : row.via === 'Item Use' ? 'per use' : 'per hit'}`}
          {:else if column === 'target'}{row.target ?? ''}{/if}
        </svelte:fragment></RelationTable>
      </Section>{/if}
      {#if document.worldSources.length}<Section id="world-sources" title="World Interactions" count={document.worldSources.length}>
        <RelationTable columns={worldPlan.columns} rows={document.worldSources} label="World effect sources"><svelte:fragment slot="cell" let:row let:column>
          {#if column === 'place'}{#if row.place}<EntityLink ref={row.place} {registry} />{:else}Place not mapped{/if}
          {:else if column === 'family'}{row.family}{:else if column === 'count'}{formatNumber(row.sourceCount)}{/if}
        </svelte:fragment></RelationTable>
      </Section>{/if}
      {#if document.checkedBy.length > 1 || (!condition && document.checkedBy.length > 0)}<Section id="checked-by" title="Requirements" count={document.checkedBy.length} line="These abilities check whether the effect is active or inactive.">
        <RelationTable columns={checkPlan.columns} rows={document.checkedBy} label="Effect requirements"><svelte:fragment slot="cell" let:row let:column>
          {#if column === 'owner'}{#if row.owner}<EntityLink ref={row.owner} {registry} />{:else}{row.label}{/if}
          {:else if column === 'condition'}{row.state.toLowerCase()} on {row.target.toLowerCase()}
          {:else if column === 'count'}{row.count === undefined ? '' : formatNumber(row.count)}{/if}
        </svelte:fragment></RelationTable>
      </Section>{/if}
      {#if hasRanks}<Section id="ranks" title="Ranks" count={document.ranks.length} line="How the outcome changes with rank.">
        <table class="c-table c-table--compact" aria-label="Effect ranks"><thead><tr><th scope="col">Rank</th><th scope="col">Outcome</th></tr></thead><tbody>{#each document.ranks as rank}<tr><th scope="row">{formatNumber(rank.rank + 1)}</th><td>{rankOutcome(document, rank)}{#if rank.requiredEffect}{' '}Damage changes with <EntityLink ref={rank.requiredEffect} {registry} />.{/if}</td></tr>{/each}</tbody></table>
      </Section>{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .impact { color: var(--c-text-strong); font-size: 1.06rem; line-height: 1.5; text-wrap: balance; }
  @supports (text-wrap: pretty) { .impact { text-wrap: pretty; } }
  .actions { display: grid; gap: .4rem; list-style: none; padding: 0; margin: .7rem 0; }
  .actions li { min-width: 0; }
</style>
