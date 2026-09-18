<script lang="ts">
  import { base } from '$app/paths';
  import type { EntityRef, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityTooltip from './EntityTooltip.svelte';

  export let ref: Ref;
  export let registry: PublicKindEntry[];
  export let tooltip = true;

  let tooltipController: EntityTooltip;
  $: resolved = ref.key !== null ? ref as EntityRef : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved?.kind) : undefined;
  $: linked = Boolean(resolved?.slug && kind?.pages);
</script>

{#if resolved && linked && kind}
  {#if tooltip}
    <span class="tooltip-anchor">
      <a class="entity-link" href={`${base}/${kind.route}/${resolved.slug}/`} on:pointerenter={() => tooltipController.showAfterIntent()} on:pointerleave={() => tooltipController.close()} on:focus={() => void tooltipController.show()} on:blur={() => tooltipController.close()} on:keydown={(event) => tooltipController.handleKeydown(event)}>
        {#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{kind.icon.slice(0, 1).toLocaleUpperCase()}</span>{/if}
        <span>{resolved.name}</span>
      </a>
      <EntityTooltip bind:this={tooltipController} ref={resolved} {registry} />
    </span>
  {:else}
    <a class="entity-link" href={`${base}/${kind.route}/${resolved.slug}/`}>
      {#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else}<span class="kind-icon" aria-hidden="true">{kind.icon.slice(0, 1).toLocaleUpperCase()}</span>{/if}
      <span>{resolved.name}</span>
    </a>
  {/if}
{:else if resolved}
  <span class="entity-text">{#if resolved.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" loading="lazy" />{:else if kind}<span class="kind-icon" aria-hidden="true">{kind.icon.slice(0, 1).toLocaleUpperCase()}</span>{/if}<span>{resolved.name}</span></span>
{:else if ref.key === null}
  <span class="entity-text">{ref.label}</span>
{/if}

<style>
  .tooltip-anchor { position: relative; display: inline-flex; max-width: 100%; }
  .entity-link, .entity-text { display: inline-flex; max-width: 100%; align-items: center; gap: .4rem; vertical-align: middle; }
  .entity-link { color: #d9bd79; text-underline-offset: .18em; }
  img, .kind-icon { width: 1.5rem; height: 1.5rem; flex: none; border-radius: 2px; object-fit: contain; }
  .kind-icon { display: inline-grid; place-items: center; border: 1px solid #5a5549; background: #252622; color: #d5b978; font: 700 .65rem/1 Georgia, serif; }
  span { overflow-wrap: anywhere; }
</style>
