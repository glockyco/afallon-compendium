<script lang="ts">
  import { pushState } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { readable } from 'svelte/store';
  import type { ArtRef, PublicKindEntry, TalentRow, TalentTree, TalentWeb } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import Requirements from '../../Requirements.svelte';
  import TalentEffect from '../../TalentEffect.svelte';
  import { detailNavigation } from '../detail-navigation';
  import { fragmentId, withTab } from '../tab-state';
  import { drawPoint, fitView, LABEL_PX, labelArc, panBy, requirementChain, viewBox, wedgePath, zoomAt, type WebView } from '../talent-web-view';

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
  // A selected talent lights up every talent that it needs, back to its tree's first tier, and the talents that it unlocks.
  $: chain = selected ? requirementChain(web.edges, anchor) : new Set<string>();
  $: unlocks = web.edges.filter((edge) => edge.from === anchor).flatMap((edge) => talents.get(edge.to) ?? []);
  $: related = new Set([...chain, ...unlocks.map((entry) => entry.row.anchor)]);
  $: lit = (edge: { from: string; to: string }) => chain.has(edge.to) && chain.has(edge.from) || edge.from === anchor;
  // The list view of this page with the same talent, keeping the reader's other choices in the address.
  const listAddress = (url: URL, talent: string) => { const next = withTab(url, 'view', 'list', false); next.hash = talent; return `${next.search}${next.hash}`; };
  const iconOf = (row: TalentRow): ArtRef | undefined => (row.ability && 'icon' in row.ability ? row.ability.icon : undefined) ?? row.icon;

  // The server renders the web at this size, so the page holds every tree and talent anchor before scripts run. The
  // browser then measures the box and fits the web to it.
  const SERVER_BOX = 720;
  let width = SERVER_BOX;
  let height = SERVER_BOX;
  let view: WebView | undefined;
  // The view follows the fit through resizes until the reader moves or zooms the web.
  let following = true;
  $: fitted = width && height ? fitView(outer, width, height) : undefined;
  $: if (fitted && (following || !view)) view = fitted;
  let glideFrame = 0;
  const move = (next: WebView) => { cancelAnimationFrame(glideFrame); following = false; view = next; };
  // A move that the reader did not make directly glides, so the reader can follow it.
  function glide(target: WebView): void {
    if (!view || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { move(target); return; }
    move(view);
    const from = view, started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 240), eased = 1 - (1 - t) ** 3;
      view = { cx: from.cx + (target.cx - from.cx) * eased, cy: from.cy + (target.cy - from.cy) * eased, zoom: from.zoom + (target.zoom - from.zoom) * eased };
      if (t < 1) glideFrame = requestAnimationFrame(step);
    };
    glideFrame = requestAnimationFrame(step);
  }

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
  // The scroll wheel scrolls the page. With Ctrl or ⌘, or a trackpad pinch, it zooms around the pointer.
  function wheel(event: WheelEvent): void {
    if (!(event.ctrlKey || event.metaKey) || !view || !fitted) return;
    event.preventDefault();
    const box = svg.getBoundingClientRect();
    move(zoomAt(view, Math.exp(-event.deltaY * 0.0025), event.clientX - box.left, event.clientY - box.top, width, height, fitted.zoom));
  }
  const zoomBy = (factor: number) => { if (view && fitted) move(zoomAt(view, factor, width / 2, height / 2, width, height, fitted.zoom)); };
  const fit = () => { cancelAnimationFrame(glideFrame); following = true; if (fitted) view = fitted; };

  // The drawing point of a talent, or of the middle of a tree's wedge.
  function targetPoint(id: string): [number, number] | undefined {
    const node = web.nodes.find((entry) => entry.talent === id);
    if (node) return drawPoint(node.x, node.y);
    const wedge = web.wedges.find((entry) => entry.tree === id);
    const radius = (RING_START + outer) / 2;
    return wedge && drawPoint(radius * Math.cos(wedge.angle * Math.PI / 180), radius * Math.sin(wedge.angle * Math.PI / 180));
  }
  // A talent or a tree that is outside the view glides to its middle at the same zoom. One inside the view stays put.
  function bringIntoView(id: string): void {
    const point = targetPoint(id);
    if (!point || !view || !width || !height) return;
    const margin = NODE / 2 * view.zoom + 4;
    const x = (point[0] - view.cx) * view.zoom + width / 2, y = (point[1] - view.cy) * view.zoom + height / 2;
    if (x < margin || x > width - margin || y < margin || y > height - margin) glide({ cx: point[0], cy: point[1], zoom: view.zoom });
  }

  // Links to a talent or a tree of the web select it without the browser's jump to the target. A link inside the web
  // selects in place: the page stays put, and the web only moves to a talent outside its view. A link from elsewhere on
  // the page, such as a tree in the side card, also scrolls the web into view. The web's link to the list switches the
  // view on this page, as the view tabs do. A click that ends a drag selects nothing.
  let root: HTMLDivElement;
  function followLink(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target : null;
    if (dragged && target && svg?.contains(target)) { event.preventDefault(); event.stopPropagation(); dragged = false; return; }
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !navigation) return;
    const link = target?.closest('a[href]');
    const href = link instanceof HTMLAnchorElement ? link.href : link instanceof SVGAElement ? new URL(link.href.baseVal, window.location.href).href : null;
    if (!link || !href) return;
    const url = new URL(href), current = new URL(window.location.href);
    if (url.origin !== current.origin || url.pathname !== current.pathname) return;
    const id = fragmentId(url.hash), inWeb = root.contains(link);
    if (url.search !== current.search) {
      if (!inWeb) return;
      event.preventDefault();
      pushState(url, {});
      navigation.location.set(url);
      return;
    }
    if (!talents.has(id) && !treesByAnchor.has(id)) return;
    event.preventDefault();
    if (url.href !== current.href) pushState(url, {});
    if (inWeb) { navigation.showInPlace(url); bringIntoView(id); }
    else navigation.location.set(url);
  }

  onMount(() => {
    document.addEventListener('click', followLink, true);
    const removeRevealer = navigation?.addRevealer(async (id) => {
      if (!targetPoint(id)) return false;
      bringIntoView(id);
      return true;
    });
    return () => { document.removeEventListener('click', followLink, true); removeRevealer?.(); cancelAnimationFrame(glideFrame); };
  });
</script>

<div class="talent-web" bind:this={root}>
  <div class="canvas" data-anchor-frame bind:clientWidth={width} bind:clientHeight={height}>
    {#if view}
      <!-- The pointer handlers only move and zoom the web. Keyboard readers select talents through their links and zoom with
           the buttons. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <svg bind:this={svg} viewBox={viewBox(view, width, height)} role="group" aria-label="Talent web" on:pointerdown={pointerDown} on:pointermove={pointerMove} on:pointerup={pointerUp} on:pointercancel={pointerUp} on:wheel|nonpassive={wheel}>
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
          <polyline class="edge" class:related={selected && lit(edge)} class:dim={selected && !lit(edge)} points={edge.points.map(([x, y]) => drawPoint(x, y).join(',')).join(' ')} />
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
      <a class="c-link list" href={$location ? listAddress($location, selected.row.anchor) : `?view=list#${selected.row.anchor}`}>Show in the list</a>
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
