<script lang="ts">
  import { tick } from 'svelte';
  import { base } from '$app/paths';
  import type { EntityRef, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityTooltip from './EntityTooltip.svelte';
  import { kindGlyphSvg } from './kind-icon';

  export let ref: Ref;
  export let registry: PublicKindEntry[];
  export let tooltip = true;
  export let rankIndex: number | undefined = undefined;
  /** An item link carries its rarity on the name and the icon ring, as the game does. */
  export let rarity: string | undefined = undefined;

  // A list page shows a thousand links, so a link mounts its tooltip only when a reader first points at it or focuses
  // it. The identifier ties the link to its tooltip from that moment. Hover and keyboard focus each keep the tooltip
  // open: the pointer leaving does not close it while the link has keyboard focus, and a blur does not close it while
  // the pointer is on the link. Focus from a mouse click does not count, so a clicked link closes when the pointer leaves.
  let tooltipController: EntityTooltip | undefined;
  let anchorElement: HTMLElement | undefined;
  let tooltipId: string | undefined;
  let hovered = false;
  let keyboardFocused = false;
  async function openTooltip(action: (controller: EntityTooltip) => void): Promise<void> {
    tooltipId ??= `entity-tooltip-${crypto.randomUUID()}`;
    if (!tooltipController) await tick();
    if ((hovered || keyboardFocused) && tooltipController) action(tooltipController);
  }
  function onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    hovered = true;
    void openTooltip((controller) => controller.showAfterIntent());
  }
  function onPointerLeave(): void {
    hovered = false;
    if (!keyboardFocused) tooltipController?.closeAfterIntent();
  }
  function onFocus(event: FocusEvent): void {
    keyboardFocused = event.currentTarget instanceof HTMLElement && event.currentTarget.matches(':focus-visible');
    void openTooltip((controller) => controller.show());
  }
  function onBlur(): void {
    keyboardFocused = false;
    if (!hovered) tooltipController?.close();
  }
  $: resolved = ref.key !== null ? ref : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved?.kind) : undefined;
  $: linked = Boolean(resolved?.slug && kind?.pages);
  $: href = resolved && kind ? `${base}/${kind.route}/${resolved.slug}/${resolved.variant ? `#${resolved.variant}` : ''}` : '';
  $: glyph = kindGlyphSvg(kind?.icon);
</script>

{#if resolved && linked && kind}
  {#if tooltip}
    <!-- The tooltip follows the anchor without a space, so punctuation after a link stays next to its name. -->
    <span class="tooltip-anchor" role="group" bind:this={anchorElement} on:pointerenter={() => tooltipController?.keepOpen()} on:pointerleave={onPointerLeave}>
      <a class="entity-link" data-rarity={rarity} {href} aria-describedby={tooltipId} on:pointerenter={onPointerEnter} on:focus={onFocus} on:blur={onBlur} on:keydown={(event) => tooltipController?.handleKeydown(event)}>{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}<span class="name">{resolved.name}</span></a>
    </span>{#if tooltipId}<EntityTooltip bind:this={tooltipController} ref={resolved} {registry} {rankIndex} anchor={anchorElement} id={tooltipId} />{/if}
  {:else}
    <a class="entity-link" data-rarity={rarity} {href}>{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}<span class="name">{resolved.name}</span></a>
  {/if}
{:else if resolved}
  <span class="entity-text" data-rarity={rarity}>{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{/if}<span class="name">{resolved.name}</span></span>
{:else if ref.key === null}
  <span class="entity-text">{ref.label}</span>
{/if}

<style>
  /* A link flows with the text around it: the name sits on the line's baseline, so commas and words next to it line up,
     and the icon centers on the letters. */
  .tooltip-anchor { position: relative; }
  /* A name wraps between words. It breaks inside a word only when that one word is wider than its column. */
  .entity-link, .entity-text { overflow-wrap: break-word; }
  .entity-link { color: var(--c-accent); text-decoration: none; }
  .entity-link:hover { color: var(--c-accent-strong); }
  .entity-link:hover .name { text-decoration: underline; text-underline-offset: .18em; }
  .entity-text { color: var(--c-text); }
  /* The icon scales with the text. `middle` centers it on the lower-case letters, and the lift moves it to the
     center of the whole line of letters. */
  img, .kind-icon { box-sizing: border-box; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; vertical-align: middle; position: relative; top: -.12em; }
  .kind-icon { display: inline-grid; place-items: center; border-color: var(--c-frame); background: var(--c-surface-2); color: var(--c-text-mute); }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
  .entity-link[data-rarity], .entity-text[data-rarity] { color: var(--c-rarity); }
  .entity-link[data-rarity]:hover { color: color-mix(in srgb, var(--c-rarity) 75%, var(--c-text-strong)); }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
</style>
