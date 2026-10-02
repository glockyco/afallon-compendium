<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicEffect, PublicKindEntry } from '@afallon/contracts/public';
  import EffectTooltip from '../../EffectTooltip.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, signedAmount } from '../../format';
  import AnswerCard from '../AnswerCard.svelte';
  import DetailFrame from '../DetailFrame.svelte';
  import HowItWorks from '../HowItWorks.svelte';
  import Section from '../Section.svelte';
  import Sections from '../Sections.svelte';
  import StatStrip from '../StatStrip.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicEffect;
  export let registry: PublicKindEntry[];

  const guide = { key: 'mechanics:combat', kind: 'mechanics', name: 'Combat', slug: 'combat' } as const;
  $: overTime = document.type === 'Damage Over Time' || document.type === 'Heal Over Time';
  $: icon = document.art.icon ?? document.ref.icon;
  $: stateStats = document.isState ? [
    { label: 'Duration', value: document.endless ? 'Endless' : document.durationSeconds > 0 ? `${formatNumber(document.durationSeconds)} Seconds` : 'No Timed Duration' },
    { label: 'Stack Limit', value: formatNumber(document.stackLimit) },
    { label: 'Saved For Return', value: document.persistent ? 'Yes' : 'No' },
    { label: 'Manual Removal Setting', value: document.canBeManuallyRemoved ? 'Allowed' : 'Not Allowed' },
    ...(overTime ? [{ label: 'Configured Pulses', value: formatNumber(document.pulses) }] : []),
  ] : [];
  $: firstRank = document.ranks[0];
  $: firstActions = firstRank?.actions ?? [];
  $: appliedCount = document.appliedBy.length + document.worldSources.reduce((total, row) => total + row.sourceCount, 0);
</script>

<article class="detail-page">
  <DetailFrame>
    <div slot="head"><TitleBlock name={document.ref.name} typeLine={`${document.type} Effect`} imageUrl={icon ? `${base}/data/${icon.url}` : undefined} {registry}><StatStrip stats={stateStats} /></TitleBlock></div>
    <div slot="answer"><AnswerCard title="What It Does" id="what-it-does">
      {#if document.description}<p class="description">{document.description}</p>{/if}
      {#if document.ranks.length > 1}<p>Showing rank {formatNumber((firstRank?.rank ?? 0) + 1)}. <a class="c-link" href="#ranks">Compare All Ranks</a></p>{/if}
      {#if firstActions.length}<ul class="actions">
        {#each firstActions.slice(0, 5) as entry}<li><strong>{entry.label}</strong>{#if entry.amount !== undefined} {entry.label === 'Changes' ? signedAmount(entry.amount, entry.unit === '%') : `${formatNumber(entry.amount)}${entry.unit === '%' ? '%' : ''}`}{/if}{#if entry.target} <EntityLink ref={entry.target} {registry} />{/if}{#if entry.unit && entry.unit !== '%'} {entry.unit}{/if}{#if entry.detail} {entry.detail}{/if}</li>{/each}
      </ul>{/if}
      {#if firstRank?.requiredEffect}<p class="condition">Damage depends on <EntityLink ref={firstRank.requiredEffect} {registry} />. The recorded conditional damage modifier is {formatNumber(firstRank.requiredEffectDamageModifier ?? 0)}.</p>{/if}
      {#if firstActions.length > 5 && document.ranks.length === 1}<a class="c-link" href="#ranks">See All Recorded Actions</a>{/if}
      {#if overTime && document.durationSeconds > 0 && document.pulses > 0}<p>Interval from configured values: {formatNumber(document.durationSeconds / document.pulses)} seconds between pulses. The game may adjust the effective pulse count, so actual timing can differ.</p>{/if}
      {#if document.isState}<p class="note">These values are recorded settings. Damage and healing can change with combat modifiers. Persistence describes saving and restoring a state, not survival through death. The manual removal setting does not establish a particular button or action.</p>{:else if !document.description && !firstActions.length}<p class="note">This record identifies a {document.type} effect. No further outcome is established by the captured rank fields.</p>{/if}
      <HowItWorks {guide} section="effects" label="How Effects Work" />
    </AnswerCard></div>
    <svelte:fragment slot="side"><div class="c-game-frame"><EffectTooltip {document} /></div></svelte:fragment>
    <Sections>
      {#if document.ranks.length > 1 || firstActions.length > 5}<Section id="ranks" title="Recorded Ranks" count={document.ranks.length} line="Damage and healing values are authored inputs, not guaranteed final amounts.">
        {#each document.ranks as rank}<div class="rank"><h3>Rank {formatNumber(rank.rank + 1)}</h3><ul class="actions">{#each rank.actions as entry}<li><strong>{entry.label}</strong>{#if entry.amount !== undefined} {entry.label === 'Changes' ? signedAmount(entry.amount, entry.unit === '%') : `${formatNumber(entry.amount)}${entry.unit === '%' ? '%' : ''}`}{/if}{#if entry.target} <EntityLink ref={entry.target} {registry} />{/if}{#if entry.unit && entry.unit !== '%'} {entry.unit}{/if}{#if entry.detail} {entry.detail}{/if}</li>{/each}</ul>
          {#if rank.requiredEffect}<p>Damage depends on <EntityLink ref={rank.requiredEffect} {registry} />. Recorded modifier: {formatNumber(rank.requiredEffectDamageModifier ?? 0)}.</p>{/if}
        </div>{/each}
      </Section>{/if}
      {#if appliedCount}<Section id="applied-by" title="Applied By" count={appliedCount} line="These sources reference the effect. Chances and requirements can limit when it applies.">
        {#if document.appliedBy.length}<ul class="sources">{#each document.appliedBy.slice(0, 8) as row}<li><EntityLink ref={row.source} {registry} /><span>{row.via}{#if row.rank !== undefined}{' '}· Rank {formatNumber(row.rank + 1)}{/if}{#if row.chance !== undefined}{' '}· {formatNumber(row.chance)}% Recorded Chance{/if}{#if row.target}{' '}· {row.target}{/if}</span></li>{/each}</ul>{/if}
        {#if document.appliedBy.length > 8}<details><summary>Show {formatNumber(document.appliedBy.length - 8)} More Sources</summary><ul class="sources">{#each document.appliedBy.slice(8) as row}<li><EntityLink ref={row.source} {registry} /><span>{row.via}{#if row.rank !== undefined}{' '}· Rank {formatNumber(row.rank + 1)}{/if}{#if row.chance !== undefined}{' '}· {formatNumber(row.chance)}% Recorded Chance{/if}{#if row.target}{' '}· {row.target}{/if}</span></li>{/each}</ul></details>{/if}
        {#if document.worldSources.length}<div class="world">
          <h3>World Interactions By Place</h3>
          <p>Counts summarize source objects, not a guarantee that every object is accessible.</p>
          <ul class="sources">{#each document.worldSources.slice(0, 8) as source}<li>{#if source.place}<EntityLink ref={source.place} {registry} />{:else}Unmapped Place{/if}<span>{source.family} · {formatNumber(source.sourceCount)} {source.sourceCount === 1 ? 'Source' : 'Sources'}{#if source.labels.length}{' '}· {source.labels.join(', ')}{/if}</span></li>{/each}</ul>
          {#if document.worldSources.length > 8}<details><summary>Show {formatNumber(document.worldSources.length - 8)} More Places</summary><ul class="sources">{#each document.worldSources.slice(8) as source}<li>{#if source.place}<EntityLink ref={source.place} {registry} />{:else}Unmapped Place{/if}<span>{source.family} · {formatNumber(source.sourceCount)} {source.sourceCount === 1 ? 'Source' : 'Sources'}{#if source.labels.length}{' '}· {source.labels.join(', ')}{/if}</span></li>{/each}</ul></details>{/if}
        </div>{/if}
      </Section>{/if}
      {#if document.checkedBy.length}<Section id="checked-by" title="Checked By Requirements" count={document.checkedBy.length} line="A requirement may check for an active or inactive effect without applying it.">
        <ul class="sources">{#each document.checkedBy.slice(0, 8) as row}<li>{#if row.owner}<EntityLink ref={row.owner} {registry} />{:else}Recorded Requirement{/if}<span>{row.label} · Checks {row.state} On {row.target}{#if row.group}{' '}· {row.group}{/if}{#if row.count !== undefined}{' '}· {formatNumber(row.count)} {row.count === 1 ? 'Source' : 'Sources'}{/if}</span></li>{/each}</ul>
        {#if document.checkedBy.length > 8}<details><summary>Show {formatNumber(document.checkedBy.length - 8)} More Requirements</summary><ul class="sources">{#each document.checkedBy.slice(8) as row}<li>{#if row.owner}<EntityLink ref={row.owner} {registry} />{:else}Recorded Requirement{/if}<span>{row.label} · Checks {row.state} On {row.target}{#if row.group}{' '}· {row.group}{/if}{#if row.count !== undefined}{' '}· {formatNumber(row.count)} {row.count === 1 ? 'Source' : 'Sources'}{/if}</span></li>{/each}</ul></details>{/if}
      </Section>{/if}
    </Sections>
  </DetailFrame>
</article>

<style>
  .description { color: var(--c-text-strong); }
  .note { color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.5; }
  .actions, .sources { display: grid; gap: .5rem; padding: 0; margin: 0; list-style: none; }
  .actions li { line-height: 1.5; overflow-wrap: anywhere; }
  .actions strong { color: var(--c-text-strong); margin-right: .35rem; }
  .sources li { display: flex; min-width: 0; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: .2rem .8rem; border-bottom: 1px solid var(--c-line-soft); padding: .35rem 0; overflow-wrap: anywhere; }
  .sources li:last-child { border-bottom: 0; }
  .sources span { min-width: 0; color: var(--c-text-dim); overflow-wrap: anywhere; }
  .rank, .world { display: grid; gap: .6rem; }
  .rank + .rank { border-top: 1px solid var(--c-line-soft); padding-top: 1rem; }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 1.05rem/1.3 var(--c-serif); }
  details { margin-top: .65rem; }
  summary { width: fit-content; color: var(--c-accent); cursor: pointer; }
  .world { margin-top: 1rem; }
</style>
