<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import TabSet from '$lib/detail/TabSet.svelte';
  import TalentWeb from '$lib/detail/sections/TalentWeb.svelte';
  import TalentTreeSection from '$lib/detail/sections/TalentTreeSection.svelte';
  import Workspace from '../kit/Workspace.svelte';
  import TreeGrid from '../TreeGrid.svelte';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock.talents;
  $: doc = mock.doc;
  $: preview = $page.url.searchParams.has('preview');
  $: left = mock.total - mock.spent;
  $: rankLabels = new Map(Object.entries(mock.learned).map(([anchor, rank]) => {
    const row = doc.trees.flatMap((tree) => tree.rows).find((entry) => entry.anchor === anchor);
    return [anchor, `${rank}/${row?.ranks ?? rank}`];
  }));
  $: learnedSet = new Set([...Object.keys(mock.learned), mock.selected.anchor]);
  $: webTrees = doc.trees.map((tree) => ({ ...tree, name: mock.treeSpent[tree.name] ? `${tree.name} ${mock.treeSpent[tree.name]}` : tree.name }));
  $: allAnchors = doc.trees.flatMap((tree) => [tree.anchor, ...tree.rows.map((row) => row.anchor)]);
  $: views = [
    { key: 'tree', label: 'Tree', anchors: [] },
    { key: 'web', label: 'Web', anchors: allAnchors },
    { key: 'list', label: 'List', anchors: [] },
    { key: 'order', label: 'By Level', anchors: [] },
  ];
  $: treeTabs = doc.trees.map((tree) => ({ key: tree.anchor, label: tree.name, anchors: [] }));
  $: shownRuns = mock.runs.slice(0, 10);
  const levels = (from: number, to: number) => from === to ? String(from) : `${from}–${to}`;
  const ranksText = (run: { from: number; to: number; ranks: number }) => run.from === run.to ? `${run.to} of ${run.ranks}` : `${run.from}–${run.to} of ${run.ranks}`;
</script>

<Workspace {data} view="talents" {preview}>
  <AnswerCard slot="answer" title="Talent Points">
    <div class="budget">
      <p class="left"><strong>{left}</strong> left</p>
      <p class="of">{mock.spent} of {mock.total} spent <button class="pm-help" title="Level {mock.level} gives {mock.total} Talent Points. Points from game effects aren’t included."><span class="c-help-mark" aria-hidden="true">?</span></button></p>
      <div class="budget-actions"><button class="text-button">Undo</button><button class="text-button">Reset Build</button></div>
    </div>
    <div class="bar" aria-hidden="true"><span style={`width: ${(mock.spent / mock.total) * 100}%`}></span></div>
  </AnswerCard>

  <SideCard slot="inspector" title="Selected Talent">
    <div class="talent-head">
      {#if mock.selected.icon}<img class="pm-icon-lg" src={`${base}/data/${mock.selected.icon.url}`} alt="" />{/if}
      <div><a class="c-link name" href={`${base}/classes/druid/#${mock.selected.anchor}`}>{mock.selected.name}</a><p class="pm-note">Stellar Balance · Rank {mock.selected.rank} of {mock.selected.ranks}</p></div>
    </div>
    <dl class="pm-dl">
      <div><dt>Now</dt><dd>+{mock.selected.current} Critical Hit Chance</dd></div>
      <div><dt>Next Rank</dt><dd>+{mock.selected.next} Critical Hit Chance<small>1 Talent Point</small></dd></div>
      <div><dt>Requires</dt><dd><span class="met" aria-hidden="true">✓</span> {mock.selected.requirement}</dd></div>
    </dl>
    <span class="pm-tag ok">Can learn</span>
    <div class="pm-row-actions"><button class="c-action">− Remove Rank</button><button class="c-action primary">+ Learn Rank</button></div>
  </SideCard>

  <Sections>
    <Section id="talent-trees" title="Talent Trees">
      <TabSet tabs={views} label="Talent Tree View" idPrefix="planner-view" param="view" let:key={view}>
        {#if view === 'tree'}
          <TreeGrid {doc} learned={mock.learned} treeSpent={mock.treeSpent} selected={mock.selected.anchor} />
          <p class="tree-line">31 points in Stellar Balance · <button class="text-button">Reset Tree</button></p>
        {:else if view === 'web'}
          <TalentWeb web={doc.web} trees={webTrees} registry={data.registry} selectedAnchor={mock.selected.anchor} {rankLabels} highlighted={learnedSet} showDetail={false} />
        {:else if view === 'list'}
          <TabSet tabs={treeTabs} label="Talent Trees" idPrefix="planner-trees" let:key>
            {#each doc.trees.filter((tree) => tree.anchor === key) as tree (tree.anchor)}<TalentTreeSection {tree} registry={data.registry} />{/each}
          </TabSet>
        {:else}
          <p class="order-note">Talents in the order you learned them, with the earliest level your points allow each one.</p>
          <div class="c-table-scroll">
            <table class="c-table">
              <thead><tr><th class="c-num">Level</th><th>Talent</th><th class="c-num">Ranks</th><th>Tree</th></tr></thead>
              <tbody>
                {#each shownRuns as run}
                  <tr>
                    <td class="c-num">{levels(run.fromLevel, run.toLevel)}</td>
                    <td><span class="pm-name">{#if run.icon}<img class="pm-icon" src={`${base}/data/${run.icon.url}`} alt="" />{/if}<a class="c-link" href={`#${run.anchor}`}>{run.name}</a></span></td>
                    <td class="c-num">{ranksText(run)}</td>
                    <td>{run.tree}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <button class="c-action more">Show {mock.runs.length - shownRuns.length} More</button>
        {/if}
      </TabSet>
    </Section>
  </Sections>

  <div slot="phone-bar" class="phone-bar" aria-label="Selected talent">
    {#if mock.selected.icon}<img src={`${base}/data/${mock.selected.icon.url}`} alt="" />{/if}
    <div class="phone-name"><strong>{mock.selected.name}</strong><span>Rank {mock.selected.rank} of {mock.selected.ranks} · Can learn</span></div>
    <div class="phone-actions"><button class="c-action" aria-label="Remove rank">−</button><button class="c-action primary" aria-label="Learn rank">+</button></div>
  </div>
</Workspace>

<style>
  .budget { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: baseline; gap: 1rem; }
  .budget p { margin: 0; }
  .left { color: var(--c-text-strong); font: 400 1.05rem var(--c-serif); }
  .left strong { font-size: 2rem; font-weight: 700; }
  .of { display: inline-flex; align-items: center; gap: .4rem; color: var(--c-text-dim); }
  .budget-actions { display: flex; gap: 1rem; }
  .bar { height: .4rem; overflow: hidden; border-radius: 999px; background: var(--c-surface-sunken); }
  .bar span { display: block; height: 100%; background: var(--c-accent-muted); }
  .talent-head { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); gap: .75rem; align-items: center; }
  .talent-head .name { font: 600 1.05rem var(--c-serif); }
  .met { color: var(--c-positive); }
  .tree-line { margin: .75rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .order-note { margin: 0 0 .75rem; color: var(--c-text-dim); }
  .more { margin-top: .75rem; }
  @media (max-width: 640px) {
    .budget { grid-template-columns: auto minmax(0, 1fr); }
    .budget-actions { grid-column: 1 / -1; }
  }
</style>
