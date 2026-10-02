<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { readable } from 'svelte/store';
  import type { ArtRef, PublicKindEntry, TalentRow, TalentTree, TalentWeb } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import TalentEffect from '../../TalentEffect.svelte';
  import { detailNavigation } from '../detail-navigation';
  import { fragmentId } from '../tab-state';
  import { drawPoint, fitView, LABEL_PX, labelArc, panBy, viewBox, wedgePath, zoomAt, type WebView } from '../talent-web-view';

  /** A class's talents as the game's talent screen lays them out, with the trees whose rows the nodes show. */
  export let web: TalentWeb;
  export let trees: TalentTree[];
  export let registry: PublicKindEntry[];

  // The game's node size and the radius of its first ring, in game units (TalentWebPanel nodeSize and ringStart).
  const NODE = 100;
  const RING_START = 300;
  const navigation = detailNavigation();
  const location = navigation?.location ?? readable<URL | null>(null);

  $: talents = new Map(trees.flatMap((tree) => tree.rows.map((row) => [row.anchor, { row, tree }] as const)));
  $: treesByAnchor = new Map(trees.map((tree) => [tree.anchor, tree]));
  $: outer = Math.max(RING_START, ...web.nodes.map((node) => Math.hypot(node.x, node.y))) + NODE;

  // The address selects: a talent's anchor selects the talent, and a tree's anchor marks the tree.
  $: anchor = $location ? fragmentId($location.hash) : '';
  $: selected = talents.get(anchor);
  $: markedTree = treesByAnchor.get(anchor)?.anchor ?? selected?.tree.anchor;
  $: requires = new Set(web.edges.filter((edge) => edge.to === anchor).map((edge) => edge.from));
  $: unlocks = web.edges.filter((edge) => edge.from === anchor).flatMap((edge) => talents.get(edge.to) ?? []);
  $: related = new Set([anchor, ...requires, ...unlocks.map((entry) => entry.row.anchor)]);
  const iconOf = (row: TalentRow): ArtRef | undefined => (row.ability && 'icon' in row.ability ? row.ability.icon : undefined) ?? row.icon;

  let width = 0;
  let height = 0;
  let view: WebView | undefined;
  // The view follows the fit through resizes until the reader moves or zooms the web.
  let following = true;
  $: fitted = width && height ? fitView(outer, width, height) : undefined;
  $: if (fitted && (following || !view)) view = fitted;
  const move = (next: WebView) => { following = false; view = next; };

  // Dragging moves the web, and two fingers zoom it. A drag that started on a talent does not select it.
  const pointers = new Map<number, { x: number; y: number }>();
  let dragged = false;
  let start = { x: 0, y: 0 };
  let svg: SVGSVGElement;
  function pointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) { dragged = false; start = { x: event.clientX, y: event.clientY }; }
  }
  function pointerMove(event: PointerEvent): void {
    const previous = pointers.get(event.pointerId);
    if (!previous || !view || !fitted) return;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const other = a === previous ? b! : a!;
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      const box = svg.getBoundingClientRect();
      if (before > 0) move(zoomAt(view, after / before, (event.clientX + other.x) / 2 - box.left, (event.clientY + other.y) / 2 - box.top, width, height, fitted.zoom));
      dragged = true;
    } else {
      if (!dragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) return;
      if (!dragged) svg.setPointerCapture(event.pointerId);
      dragged = true;
      move(panBy(view, event.clientX - previous.x, event.clientY - previous.y));
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
  function pointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId);
  }
  function suppressDragClick(event: MouseEvent): void {
    if (dragged) { event.preventDefault(); event.stopPropagation(); dragged = false; }
  }
  // The scroll wheel scrolls the page. With Ctrl or ⌘, or a trackpad pinch, it zooms around the pointer.
  function wheel(event: WheelEvent): void {
    if (!(event.ctrlKey || event.metaKey) || !view || !fitted) return;
    event.preventDefault();
    const box = svg.getBoundingClientRect();
    move(zoomAt(view, Math.exp(-event.deltaY * 0.0025), event.clientX - box.left, event.clientY - box.top, width, height, fitted.zoom));
  }
  const zoomBy = (factor: number) => { if (view && fitted) move(zoomAt(view, factor, width / 2, height / 2, width, height, fitted.zoom)); };
  const fit = () => { following = true; if (fitted) view = fitted; };

  // A link to a talent or a tree centres it, so it is in view when the page scrolls to it.
  onMount(() => navigation?.addRevealer(async (id) => {
    const node = web.nodes.find((entry) => entry.talent === id);
    const wedge = web.wedges.find((entry) => entry.tree === id);
    if ((!node && !wedge) || !fitted) return Boolean(node || wedge);
    const zoom = Math.max(view?.zoom ?? fitted.zoom, fitted.zoom * (node ? 2.5 : 1.6));
    const radius = (RING_START + outer) / 2;
    const [cx, cy] = node ? drawPoint(node.x, node.y) : drawPoint(radius * Math.cos(wedge!.angle * Math.PI / 180), radius * Math.sin(wedge!.angle * Math.PI / 180));
    move({ cx, cy, zoom });
    return true;
  }));
</script>

<div class="talent-web">
  <div class="canvas" bind:clientWidth={width} bind:clientHeight={height}>
    {#if view}
      <!-- The pointer handlers only move and zoom the web, and the click handler only stops a drag from selecting. Keyboard
           readers select talents through their links and zoom with the buttons. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
      <svg bind:this={svg} viewBox={viewBox(view, width, height)} role="group" aria-label="Talent web" on:pointerdown={pointerDown} on:pointermove={pointerMove} on:pointerup={pointerUp} on:pointercancel={pointerUp} on:click|capture={suppressDragClick} on:wheel|nonpassive={wheel}>
        <defs>
          <clipPath id="talent-web-circle"><circle r={NODE / 2 - 9} /></clipPath>
          <clipPath id="talent-web-square"><rect x={-(NODE / 2 - 9)} y={-(NODE / 2 - 9)} width={NODE - 18} height={NODE - 18} rx="10" /></clipPath>
          {#each web.wedges as wedge (wedge.tree)}<path id={`talent-web-label-${wedge.tree}`} d={labelArc(wedge.angle, wedge.width, outer, view.zoom)} />{/each}
        </defs>
        {#each web.wedges as wedge (wedge.tree)}
          {@const tree = treesByAnchor.get(wedge.tree)}
          <path class="wedge" class:marked={markedTree === wedge.tree} d={wedgePath(wedge.angle, wedge.width, RING_START - NODE, outer)} />
          {#if tree}<a href={`#${wedge.tree}`} class="tree-name"><text id={wedge.tree} style:font-size={`${LABEL_PX / view.zoom}px`} class:marked={markedTree === wedge.tree}><textPath href={`#talent-web-label-${wedge.tree}`} startOffset="50%">{tree.name}</textPath></text></a>{/if}
        {/each}
        {#each web.edges as edge (`${edge.from}>${edge.to}`)}
          <polyline class="edge" class:related={selected && (edge.from === anchor || edge.to === anchor)} class:dim={selected && edge.from !== anchor && edge.to !== anchor} points={edge.points.map(([x, y]) => drawPoint(x, y).join(',')).join(' ')} />
        {/each}
        {#each web.nodes as node (node.talent)}
          {@const entry = talents.get(node.talent)}
          {#if entry}
            {@const [x, y] = drawPoint(node.x, node.y)}
            {@const icon = iconOf(entry.row)}
            {@const ability = Boolean(entry.row.ability)}
            <a href={`#${node.talent}`} class="node" class:selected={node.talent === anchor} class:dim={selected && !related.has(node.talent)} aria-label={`${entry.row.name}, ${entry.tree.name}, tier ${entry.row.tier}`}>
              <g id={node.talent} transform={`translate(${x} ${y})`}>
                <title>{entry.row.name}</title>
                {#if ability}<rect class="shape" x={-NODE / 2} y={-NODE / 2} width={NODE} height={NODE} rx="16" />{:else}<circle class="shape" r={NODE / 2} />{/if}
                {#if icon}<image href={`${base}/data/${icon.url}`} x={-(NODE / 2 - 9)} y={-(NODE / 2 - 9)} width={NODE - 18} height={NODE - 18} clip-path={`url(#talent-web-${ability ? 'square' : 'circle'})`} preserveAspectRatio="xMidYMid slice" />{/if}
                {#if entry.row.ranks > 1}<text class="ranks" x={NODE / 2 - 4} y={NODE / 2 - 4}>{entry.row.ranks}</text>{/if}
              </g>
            </a>
          {/if}
        {/each}
      </svg>
    {/if}
  </div>
  <div class="toolbar">
    <button type="button" on:click={() => zoomBy(1.4)} aria-label="Zoom in">+</button>
    <button type="button" on:click={() => zoomBy(1 / 1.4)} aria-label="Zoom out">−</button>
    <button type="button" on:click={fit}>Fit</button>
    <p>Drag to move the web. Zoom with the buttons, a pinch, or Ctrl and the scroll wheel.</p>
  </div>

  <div class="detail" aria-live="polite">
    {#if selected}
      {@const icon = iconOf(selected.row)}
      <h3>{#if selected.row.ability}<EntityLink ref={selected.row.ability} {registry} />{:else}{#if icon}<img src={`${base}/data/${icon.url}`} width={icon.width} height={icon.height} alt="" />{/if}{selected.row.name}{/if}</h3>
      <p class="meta">{selected.tree.name} · Tier {selected.row.tier} · {selected.row.ranks} {selected.row.ranks === 1 ? 'rank' : 'ranks'}</p>
      {#if selected.row.first || selected.row.last}<TalentEffect row={selected.row} {registry} />{/if}
      {#if selected.row.requirements.length}<div class="requires"><span>Requires</span> <Requirements requirements={selected.row.requirements} {registry} /></div>{/if}
      {#if unlocks.length}<p class="unlocks"><span>Unlocks</span> {#each unlocks as entry, index (entry.row.anchor)}{index ? ', ' : ''}<a class="c-link" href={`#${entry.row.anchor}`}>{entry.row.name}</a>{/each}</p>{/if}
      <a class="c-link list" href={`?view=list#${selected.row.anchor}`}>Show in the list</a>
    {:else}
      <p class="hint">Select a talent to see its ranks, effect, and requirements.</p>
    {/if}
  </div>
</div>

<style>
  .talent-web { display: grid; gap: 1rem; }
  .canvas { position: relative; aspect-ratio: 1; max-height: min(78vh, 760px); border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-sunken); overflow: hidden; }
  svg { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; user-select: none; }
  svg:active { cursor: grabbing; }
  .wedge { fill: var(--c-surface-1); stroke: var(--c-line-soft); stroke-width: 4; }
  .wedge.marked { fill: var(--c-tint-hover); stroke: var(--c-accent); }
  .tree-name text { fill: var(--c-text-dim); font-weight: 600; font-family: var(--c-serif); text-anchor: middle; }
  .tree-name text.marked, .tree-name:hover text { fill: var(--c-accent-strong); }
  .edge { fill: none; stroke: var(--c-frame); stroke-width: 10; stroke-linejoin: round; }
  .edge.related { stroke: var(--c-accent); stroke-width: 14; }
  .edge.dim { opacity: .35; }
  .node .shape { fill: var(--c-surface-2); stroke: var(--c-frame); stroke-width: 6; }
  .node:hover .shape, .node:focus-visible .shape { stroke: var(--c-accent-strong); }
  .node:focus-visible { outline: none; }
  .node.selected .shape { stroke: var(--c-accent); stroke-width: 14; }
  .node.dim { opacity: .4; }
  .ranks { fill: var(--c-text-strong); font: 700 30px var(--c-sans, inherit); text-anchor: end; paint-order: stroke; stroke: var(--c-surface-sunken); stroke-width: 8; }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; margin-top: -.5rem; }
  .toolbar p { flex: 1 1 14rem; margin: 0 0 0 .4rem; color: var(--c-text-dim); font-size: var(--c-text-small); }
  .toolbar button { min-width: 2.2rem; height: 2.2rem; padding: 0 .55rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-strong); font: inherit; cursor: pointer; }
  .toolbar button:hover { border-color: var(--c-accent); }
  .detail { display: grid; gap: .6rem; padding: 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 1.1rem/1.3 var(--c-serif); }
  h3 img { box-sizing: border-box; width: 2rem; height: 2rem; margin-right: .45rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); vertical-align: middle; }
  .meta, .hint { margin: 0; color: var(--c-text-dim); }
  .requires span, .unlocks span { color: var(--c-text-mute); font-weight: 600; }
  .unlocks { margin: 0; }
  .list { width: fit-content; font-size: var(--c-text-small); }
</style>
