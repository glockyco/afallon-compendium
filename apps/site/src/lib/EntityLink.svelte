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
  $: resolved = ref.key !== null ? ref as EntityRef : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved?.kind) : undefined;
  $: linked = Boolean(resolved?.slug && kind?.pages);
  $: glyph = kindGlyphSvg(kind?.icon);
</script>

{#if resolved && linked && kind}
  {#if tooltip}
    <span class="tooltip-anchor" role="group" bind:this={anchorElement} on:pointerenter={() => tooltipController.keepOpen()} on:pointerleave={() => tooltipController.closeAfterIntent()}>
      <a class="entity-link" data-rarity={rarity} href={`${base}/${kind.route}/${resolved.slug}/`} aria-describedby={tooltipId} on:pointerenter={(event) => { if (event.pointerType !== 'touch') tooltipController.showAfterIntent(); }} on:focus={() => void tooltipController.show()} on:blur={() => tooltipController.close()} on:keydown={(event) => tooltipController.handleKeydown(event)}>
        {#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}
        <span>{resolved.name}</span>
      </a>
    </span>
    <EntityTooltip bind:this={tooltipController} ref={resolved} {registry} {rankIndex} anchor={anchorElement} id={tooltipId} />
  {:else}
    <a class="entity-link" data-rarity={rarity} href={`${base}/${kind.route}/${resolved.slug}/`}>
      {#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{@html glyph ?? ''}</span>{/if}
      <span>{resolved.name}</span>
    </a>
  {/if}
{:else if resolved}
  <span class="entity-text" data-rarity={rarity}>{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{/if}<span>{resolved.name}</span></span>
{:else if ref.key === null}
  <span class="entity-text">{ref.label}</span>
{/if}

<style>
  .tooltip-anchor { position: relative; display: inline-flex; max-width: 100%; }
  .entity-link, .entity-text { display: inline-flex; max-width: 100%; align-items: center; gap: .45rem; vertical-align: middle; }
  .entity-link { color: var(--c-accent); text-decoration: none; text-underline-offset: .18em; }
  .entity-link:hover { color: var(--c-accent-strong); text-decoration: underline; }
  .entity-text { color: var(--c-text); }
  img, .kind-icon { width: 1.4rem; height: 1.4rem; flex: none; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: #141514; object-fit: contain; }
  .kind-icon { display: inline-grid; place-items: center; border-color: #4a463c; background: var(--c-surface-2); color: #8d8778; }
  .kind-icon :global(svg) { width: .9rem; height: .9rem; }
  span { overflow-wrap: anywhere; }
  .entity-link[data-rarity], .entity-text[data-rarity] { color: var(--c-rarity); }
  .entity-link[data-rarity]:hover { color: color-mix(in srgb, var(--c-rarity) 75%, #ffffff); }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
</style>
