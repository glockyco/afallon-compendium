<script lang="ts">
  // Mockup: one tree as a tier grid, the way most talent calculators draw an editable tree.
  import { base } from '$app/paths';
  import type { PublicClass, TalentRow } from '@afallon/contracts/public';

  export let doc: PublicClass;
  export let learned: Record<string, number>;
  export let treeSpent: Record<string, number>;
  export let selected: string;
  export let treeName = 'Stellar Balance';

  let width = 0;
  $: CELL = width ? Math.min(76, Math.floor((width - 16) / columns)) : 76;
  $: NODE = Math.round(CELL * .68);
  $: tree = doc.trees.find((entry) => entry.name === treeName)!;
  $: columns = Math.max(...tree.rows.map((row) => row.position)) + 1;
  $: tiers = Math.max(...tree.rows.map((row) => row.tier));
  $: rowsByAnchor = new Map(tree.rows.map((row) => [row.anchor, row]));
  $: centre = (row: TalentRow) => ({ x: row.position * CELL + CELL / 2, y: (row.tier - 1) * CELL + CELL / 2 });
  $: edges = doc.web.edges.filter((edge) => rowsByAnchor.has(edge.from) && rowsByAnchor.has(edge.to));
  const requirementName = (label: string) => label.replace(/ (learned|rank \d+ or higher)$/, '');
  $: byName = new Map(doc.trees.flatMap((entry) => entry.rows).map((row) => [row.name, row]));
  $: available = (row: TalentRow) => row.requirements.every((group) => group.requirements.every((requirement) => {
    const needed = byName.get(requirementName(requirement.label));
    return !needed || (learned[needed.anchor] ?? 0) > 0;
  }));
  const iconOf = (row: TalentRow) => (row.ability && 'icon' in row.ability ? row.ability.icon : undefined) ?? row.icon;
</script>

<div class="trees" role="tablist" aria-label="Talent trees">
  {#each doc.trees as entry}
    <button role="tab" class="tree-tab" class:active={entry.name === treeName} aria-selected={entry.name === treeName}>
      <span>{entry.name}</span>{#if treeSpent[entry.name]}<span class="count">{treeSpent[entry.name]}</span>{/if}
    </button>
  {/each}
</div>

<div class="grid-frame" bind:clientWidth={width}>
  <svg class="links" width={columns * CELL} height={tiers * CELL} aria-hidden="true">
    {#each edges as edge}
      {@const from = centre(rowsByAnchor.get(edge.from)!)}
      {@const to = centre(rowsByAnchor.get(edge.to)!)}
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} class:lit={(learned[edge.from] ?? 0) > 0 && (learned[edge.to] ?? 0) > 0} />
    {/each}
  </svg>
  <div class="grid" style={`width: ${columns * CELL}px; height: ${tiers * CELL}px`}>
    {#each tree.rows as row}
      {@const rank = learned[row.anchor] ?? 0}
      {@const icon = iconOf(row)}
      {@const point = centre(row)}
      <button class="node" class:learned={rank > 0} class:full={rank === row.ranks} class:blocked={rank === 0 && !available(row)} class:selected={row.anchor === selected} class:round={!row.ability}
        style={`left: ${point.x - NODE / 2}px; top: ${point.y - NODE / 2}px; width: ${NODE}px; height: ${NODE}px`} aria-label={`${row.name}, rank ${rank} of ${row.ranks}`}>
        {#if icon}<img src={`${base}/data/${icon.url}`} alt="" />{/if}
        <span class="rank">{rank}/{row.ranks}</span>
      </button>
    {/each}
  </div>
</div>
<div class="legend"><span><i class="swatch learned"></i>Learned</span><span><i class="swatch open"></i>Can learn</span><span><i class="swatch blocked"></i>Needs another talent first</span></div>

<style>
  .trees { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
  .tree-tab { display: inline-flex; align-items: center; gap: .5rem; padding: .45rem .8rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-1); color: var(--c-text-soft); font: inherit; cursor: pointer; }
  .tree-tab.active { border-color: var(--c-accent-line); background: var(--c-accent-surface); color: var(--c-accent-strong); }
  .count { min-width: 1.6rem; padding: .05rem .4rem; border-radius: 999px; background: var(--c-surface-3); color: var(--c-text); font-size: .8rem; font-variant-numeric: tabular-nums; text-align: center; }
  .tree-tab.active .count { background: var(--c-frame); color: var(--c-text-strong); }
  .grid-frame { position: relative; display: grid; place-items: center; padding: 1.25rem 0; overflow-x: auto; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-sunken); }
  .links { position: absolute; top: 1.25rem; left: 50%; transform: translateX(-50%); }
  .links line { stroke: var(--c-line-strong); stroke-width: 2; }
  .links line.lit { stroke: var(--c-accent-muted); stroke-width: 3; }
  .grid { position: relative; }
  .node { position: absolute; padding: 3px; border: 2px solid var(--c-line-strong); border-radius: 10px; background: var(--c-surface-2); cursor: pointer; }
  .node.round { border-radius: 50%; }
  .node img { width: 100%; height: 100%; border-radius: inherit; object-fit: contain; filter: saturate(.55) brightness(.75); }
  .node.learned { border-color: var(--c-accent-muted); }
  .node.learned img { filter: none; }
  .node.full { border-color: var(--c-accent); }
  .node.blocked { opacity: .38; }
  .node.blocked img { filter: grayscale(1) brightness(.7); }
  .node.selected { box-shadow: 0 0 0 3px var(--c-surface-sunken), 0 0 0 5px var(--c-accent-strong); }
  .rank { position: absolute; right: -10px; bottom: -9px; min-width: 2rem; padding: 0 .3rem; border: 1px solid var(--c-line-strong); border-radius: 999px; background: var(--c-surface-deep); color: var(--c-text-soft); font-size: .72rem; font-weight: 600; line-height: 1.35; font-variant-numeric: tabular-nums; text-align: center; }
  .node.learned .rank { border-color: var(--c-accent-muted); color: var(--c-accent-strong); }
  .node.blocked .rank { display: none; }
  .legend { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; margin-top: .75rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .legend span { display: inline-flex; align-items: center; gap: .4rem; }
  .swatch { display: inline-block; width: .8rem; height: .8rem; border: 2px solid var(--c-line-strong); border-radius: 3px; }
  .swatch.learned { border-color: var(--c-accent); background: var(--c-accent-surface); }
  .swatch.blocked { opacity: .4; }
  @media (max-width: 640px) {
    .grid-frame { padding: .75rem 0; }
    .trees { flex-wrap: nowrap; margin-right: -1rem; padding-right: 1rem; overflow-x: auto; scrollbar-width: none; }
    .tree-tab { flex: none; }
  }
</style>
