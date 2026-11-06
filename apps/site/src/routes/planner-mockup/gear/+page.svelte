<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import ItemTooltip from '$lib/ItemTooltip.svelte';
  import Workspace from '../kit/Workspace.svelte';
  import SlotList from '../kit/SlotList.svelte';
  import GearEditor from '../kit/GearEditor.svelte';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: preview = $page.url.searchParams.has('preview');
  $: helmet = mock.slots.find((slot) => slot.placement === 'helmet')!;
  $: worn = new Set(mock.slots.flatMap((slot) => slot.document ? [slot.document.ref.key] : []));
  $: items = mock.slots.filter((slot) => slot.document).length;
  const signed = (amount: number, percent: boolean) => `+${amount.toLocaleString('en-US')}${percent ? '%' : ''}`;
</script>

<Workspace {data} view="gear" {preview}>
  <AnswerCard slot="answer" title="Gear Score">
    <div class="score">
      <strong>{mock.gearScore.toLocaleString('en-US')}</strong>
      <p>From the flat stats of {items} items and the staff’s average damage. In the Heroic Tier, creatures grow 0.08% stronger per point, up to +100% at 1,250.</p>
    </div>
    <a class="c-link more" href={`${base}/mechanics/heroic-tier/`}>How the Heroic Tier Works</a>
  </AnswerCard>

  <svelte:fragment slot="inspector">
    <div class="c-game-frame wide-only"><ItemTooltip document={helmet.document} registry={data.registry} corruptionLevel={helmet.corruption ?? 0} heroic={Boolean(helmet.heroic)} /></div>
    <div class="wide-only"><SideCard title="Helmet"><GearEditor entry={helmet} registry={data.registry} id="side" /></SideCard></div>
  </svelte:fragment>

  <Sections>
    <Section id="equipment" title="Equipment">
      <SlotList slots={mock.slots} selected="helmet" editable>
        <GearEditor slot="expanded" entry={helmet} registry={data.registry} id="inline" />
      </SlotList>
    </Section>
    <Section id="sets" title="Sets">
      <div class="sets">
        {#each mock.sets as set}
          <div class="set">
            <h3>{set.name} <span class="count">{set.worn.length} of {set.members.length} pieces</span></h3>
            <ul class="tiers">
              {#each set.tiers as tier}
                <li class:active={set.worn.length >= tier.equipped}>
                  <span class="need">{tier.equipped}</span>
                  <span class="bonus">{tier.stats.map((row) => `${signed(row.amount, row.percent)} ${row.stat}`).join(', ')}</span>
                  <span class="state">{set.worn.length >= tier.equipped ? 'Active' : `${tier.equipped - set.worn.length} more`}</span>
                </li>
              {/each}
            </ul>
            <p class="missing"><span>Not in this plan:</span> {#each set.members.filter((member) => !worn.has(member.key)) as member, index}{index ? ', ' : ''}<a class="c-link" href={`${base}/items/${member.slug}/`}>{member.name}</a>{/each}</p>
          </div>
        {/each}
      </div>
    </Section>
  </Sections>
</Workspace>

<style>
  .score { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 1.25rem; }
  .score strong { color: var(--c-text-strong); font: 700 2rem var(--c-serif); font-variant-numeric: tabular-nums; }
  .score p { margin: 0; color: var(--c-text-dim); }
  .more { width: fit-content; font-size: var(--c-text-small); }
  .sets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .set { display: grid; align-content: start; gap: .75rem; padding: .9rem 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  .set h3 { margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-lead) var(--c-serif); }
  .count { display: block; margin-top: .15rem; color: var(--c-text-dim); font: 400 var(--c-text-small) inherit; font-family: inherit; }
  .tiers { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; font-size: var(--c-text-small); }
  .tiers li { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr) auto; align-items: baseline; gap: .5rem; color: var(--c-text-mute); }
  .tiers li.active { color: var(--c-text); }
  .need { display: inline-grid; place-items: center; width: 1.3rem; height: 1.3rem; border: 1px solid var(--c-line); border-radius: 50%; font-size: .75rem; font-variant-numeric: tabular-nums; }
  .active .need { border-color: var(--c-accent-line); color: var(--c-accent-strong); }
  .state { white-space: nowrap; }
  .active .state { color: var(--c-positive); }
  .missing { margin: 0; color: var(--c-text-soft); font-size: var(--c-text-small); }
  .missing span { color: var(--c-text-dim); }
  @media (max-width: 640px) {
    .sets { grid-template-columns: minmax(0, 1fr); }
    .score { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
  }
</style>
