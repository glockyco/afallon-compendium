<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import type { EntityRef, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityTooltip from './EntityTooltip.svelte';
  import { kindGlyphSvg, plainKind } from './kind-icon';

  export let ref: Ref;
  export let registry: PublicKindEntry[];
  export let tooltip = true;
  export let rankIndex: number | undefined = undefined;
  /** An item link carries its rarity on the name and the icon ring, as the game does. */
  export let rarity: string | undefined = undefined;
  /**
   * Keeps the name on one line and ends a long name with an ellipsis. The link then fills the width of its container,
   * and the hover card shows the full name; a link without a hover card names it in its title.
   */
  export let truncate = false;
  /** A link inside game text, such as a name in an item tooltip: no icon, the colour of the text around it. */
  export let plain = false;
  /** Lists can show a stat's ordinary entity identity even though inline stat references read as plain game text. */
  export let forceIcon = false;

  // A list page shows a thousand links, so a link mounts its preview only on focus, pointer intent, or tap.
  // A pointer leaving closes it even if the link retains focus; keyboard-only focus keeps it
  // open until blur or Escape. Touch opens it on the first tap and follows the link on the second.
  let tooltipController: EntityTooltip | undefined;
  let anchorElement: HTMLElement | undefined;
  let linkElement: HTMLAnchorElement | undefined;
  let tooltipId: string | undefined;
  let hovered = false;
  let keyboardFocused = false;
  let touchFocused = false;
  let touchPreviewSeen = false;
  let pointerX = 0;
  let pointerY = 0;
  function trackPointer(event: PointerEvent): void {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }
  function onViewportMove(): void {
    // Scrolling or resizing moves links underneath a stationary pointer without dispatching pointerleave.
    // The card does not receive pointer events, so hit-testing the link also works beside it.
    if (linkElement?.contains(document.elementFromPoint(pointerX, pointerY))) return;
    onPointerLeave();
  }
  function onHoverKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    tooltipController?.close();
    event.preventDefault();
    event.stopPropagation();
  }
  onMount(() => () => {
    window.removeEventListener('scroll', onViewportMove, true);
    window.removeEventListener('resize', onViewportMove);
    window.removeEventListener('keydown', onHoverKeydown, true);
  });
  async function openTooltip(action: (controller: EntityTooltip) => void): Promise<void> {
    tooltipId ??= `entity-tooltip-${crypto.randomUUID()}`;
    if (!tooltipController) await tick();
    if ((hovered || keyboardFocused || touchFocused) && tooltipController) action(tooltipController);
  }
  function onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    hovered = true;
    trackPointer(event);
    window.addEventListener('scroll', onViewportMove, true);
    window.addEventListener('resize', onViewportMove);
    window.addEventListener('keydown', onHoverKeydown, true);
    void openTooltip((controller) => controller.showAfterIntent());
  }
  function onPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') {
      // A mouse click must not turn an earlier keyboard focus into a persistent card.
      keyboardFocused = false;
      return;
    }
    touchFocused = true;
    void openTooltip((controller) => controller.show());
  }
  function onClick(event: MouseEvent): void {
    if (!touchFocused || touchPreviewSeen) return;
    event.preventDefault();
    touchPreviewSeen = true;
  }
  function onPointerLeave(): void {
    hovered = false;
    window.removeEventListener('scroll', onViewportMove, true);
    window.removeEventListener('resize', onViewportMove);
    window.removeEventListener('keydown', onHoverKeydown, true);
    if (!touchFocused) tooltipController?.close();
  }
  function onFocus(event: FocusEvent): void {
    keyboardFocused = event.currentTarget instanceof HTMLElement && event.currentTarget.matches(':focus-visible');
    void openTooltip((controller) => controller.show());
  }
  function onBlur(): void {
    keyboardFocused = false;
    touchFocused = false;
    touchPreviewSeen = false;
    if (!hovered) tooltipController?.close();
  }
  $: resolved = ref.key !== null ? ref : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved?.kind) : undefined;
  $: linked = Boolean(resolved?.slug && kind?.pages);
  $: bare = !forceIcon && (plain || plainKind(resolved?.kind));
  // A link to a part of the page that the reader is on is a fragment link, so it keeps the reader's tabs and views.
  $: pagePath = resolved && kind ? `${base}/${kind.route}/${resolved.slug}/` : '';
  $: href = !pagePath ? '' : resolved?.variant ? `${pagePath === $page.url.pathname ? '' : pagePath}#${resolved.variant}` : pagePath;
  $: glyph = kindGlyphSvg(kind?.icon);
  $: art = resolved?.kind === 'npcs' && resolved.portrait ? resolved.portrait : resolved?.icon;
</script>

{#if resolved && linked && kind}
  {#if tooltip}
    <!-- The tooltip follows the anchor without a space, so punctuation after a link stays next to its name. -->
    <span class="tooltip-anchor" class:truncate role="group" bind:this={anchorElement}>
      <a class="entity-link" class:truncate class:plain={bare} data-rarity={rarity} {href} aria-describedby={tooltipId} bind:this={linkElement} on:pointerenter={onPointerEnter} on:pointermove={trackPointer} on:pointerdown={onPointerDown} on:pointerleave={onPointerLeave} on:focus={onFocus} on:blur={onBlur} on:click={onClick} on:keydown={(event) => tooltipController?.handleKeydown(event)}>{#if bare}{:else if art}<img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}<span class="name">{resolved.name}</span></a>
    </span>{#if tooltipId}<EntityTooltip bind:this={tooltipController} ref={resolved} {registry} {rankIndex} anchor={anchorElement} id={tooltipId} pointer={() => (hovered ? { x: pointerX, y: pointerY } : null)} />{/if}
  {:else}
    <a class="entity-link" class:truncate class:plain={bare} data-rarity={rarity} {href} title={truncate ? resolved.name : undefined}>{#if bare}{:else if art}<img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}<span class="name">{resolved.name}</span></a>
  {/if}
{:else if resolved}
  <span class="entity-text" class:truncate class:plain={bare} data-rarity={rarity} title={truncate ? resolved.name : undefined}>{#if art && !bare}<img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt="" loading="lazy" />{/if}<span class="name">{resolved.name}</span></span>
{:else if ref.key === null}
  <span class="entity-text">{#if ref.icon}<img src={`${base}/data/${ref.icon.url}`} width={ref.icon.width} height={ref.icon.height} alt="" loading="lazy" />{/if}<span class="name">{ref.label}</span></span>
{/if}

<style>
  /* A link flows with the text around it: the name sits on the line's baseline, so commas and words next to it line up,
     and the icon centers on the letters. The hover card opens at the end of the page, so the anchor around a link stays
     unpositioned: a card that stretches its link over the whole card is then clickable everywhere, not only on the name. */
  /* A name wraps between words. It breaks inside a word only when that one word is wider than its column. */
  .entity-link, .entity-text { overflow-wrap: break-word; }
  .entity-link { color: var(--c-accent); text-decoration: none; }
  .entity-link:hover { color: var(--c-accent-strong); }
  .entity-link:hover .name { text-decoration: underline; text-underline-offset: .18em; }
  .entity-text { color: var(--c-text); }
  /* A plain link takes the colour of the game text around it and shows that it is a link by its underline on hover. */
  .plain.entity-link, .plain.entity-text { color: inherit; }
  .plain.entity-link:hover { color: inherit; }
  .plain.entity-link .name { text-decoration: underline dotted color-mix(in srgb, currentcolor 45%, transparent); text-underline-offset: .2em; }
  .plain.entity-link:hover .name { text-decoration: underline solid; }
  /* The icon scales with the text. `middle` centers it on the lower-case letters, and the lift moves it to the
     center of the whole line of letters. */
  img, .kind-icon { box-sizing: border-box; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; vertical-align: middle; position: relative; top: -.12em; }
  /* Tables show pictures at 2rem. A kind glyph has no picture, so it keeps the text size and centers in the same 2rem
     slot: names still line up when a column mixes pictures and glyphs. */
  :global(.relation-table) img { width: 2rem; height: 2rem; }
  :global(.relation-table) .kind-icon { margin-left: calc((2rem - 1.45em) / 2); margin-right: calc((2rem - 1.45em) / 2 + .35em); }
  :global(.relation-table) .entity-link img[src], :global(.relation-table) .entity-text img[src] { object-fit: cover; }
  .kind-icon { display: inline-grid; place-items: center; border-color: var(--c-frame); background: var(--c-surface-2); color: var(--c-text-mute); }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
  .entity-link[data-rarity], .entity-text[data-rarity] { color: var(--c-rarity); }
  .entity-link[data-rarity]:hover { color: color-mix(in srgb, var(--c-rarity) 75%, var(--c-text-strong)); }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
  /* A truncated link is a one-line flex row: the icon keeps its size and the name shrinks to an ellipsis. The link is as
     wide as its icon and name, up to its container, so hovering the empty space beside a short name does nothing. */
  .tooltip-anchor.truncate { display: inline-flex; max-width: 100%; min-width: 0; vertical-align: middle; }
  .truncate.entity-link, .truncate.entity-text { display: inline-flex; align-items: center; max-width: 100%; min-width: 0; white-space: nowrap; vertical-align: middle; }
  .truncate img, .truncate .kind-icon { flex: none; top: 0; }
  .truncate .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
</style>
