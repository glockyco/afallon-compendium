<script lang="ts">
  import { onMount } from 'svelte';
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

  let tooltipController: EntityTooltip;
  let anchorElement: HTMLElement | undefined;
  let tooltipId: string | undefined;
  onMount(() => { tooltipId = `entity-tooltip-${crypto.randomUUID()}`; });
  $: resolved = ref.key !== null ? ref : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved?.kind) : undefined;
  $: linked = Boolean(resolved?.slug && kind?.pages);
  $: href = resolved && kind ? `${base}/${kind.route}/${resolved.slug}/${resolved.variant ? `#${resolved.variant}` : ''}` : '';
  $: glyph = kindGlyphSvg(kind?.icon);
</script>

{#if resolved && linked && kind}
  {#if tooltip}
    <!-- The tooltip follows the anchor without a space, so punctuation after a link stays next to its name. -->
    <span class="tooltip-anchor" role="group" bind:this={anchorElement} on:pointerenter={() => tooltipController.keepOpen()} on:pointerleave={() => tooltipController.closeAfterIntent()}>
      <a class="entity-link" data-rarity={rarity} {href} aria-describedby={tooltipId} on:pointerenter={(event) => { if (event.pointerType !== 'touch') tooltipController.showAfterIntent(); }} on:focus={() => void tooltipController.show()} on:blur={() => tooltipController.close()} on:keydown={(event) => tooltipController.handleKeydown(event)}>{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}<span class="name">{resolved.name}</span></a>
    </span><EntityTooltip bind:this={tooltipController} ref={resolved} {registry} {rankIndex} anchor={anchorElement} id={tooltipId} />
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
  img, .kind-icon { box-sizing: border-box; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: #141514; object-fit: contain; vertical-align: middle; position: relative; top: -.12em; }
  .kind-icon { display: inline-grid; place-items: center; border-color: #4a463c; background: var(--c-surface-2); color: #8d8778; }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
  .entity-link[data-rarity], .entity-text[data-rarity] { color: var(--c-rarity); }
  .entity-link[data-rarity]:hover { color: color-mix(in srgb, var(--c-rarity) 75%, #ffffff); }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
</style>
