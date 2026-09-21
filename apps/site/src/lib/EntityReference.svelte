<script lang="ts">
  import { base } from '$app/paths';
  import type { EntityRef, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import { kindGlyphSvg } from './kind-icon';

  export let ref: Ref;
  export let registry: PublicKindEntry[];
  export let rarity: string | undefined = undefined;

  $: resolved = ref.key !== null ? ref as EntityRef : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved.kind) : undefined;
  $: glyph = kindGlyphSvg(kind?.icon);
</script>

<span class="entity-reference" data-rarity={rarity}>
  {#if resolved?.icon}
    <img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" />
  {:else if resolved && glyph}
    <span class="kind-icon" aria-hidden="true">{@html glyph}</span>
  {/if}
  <span>{resolved?.name ?? (ref.key === null ? ref.label : '')}</span>
</span>

<style>
  .entity-reference { display: inline-flex; max-width: 100%; align-items: center; gap: .45rem; color: var(--c-text); vertical-align: middle; }
  img, .kind-icon { width: 1.4rem; height: 1.4rem; flex: none; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: #141514; object-fit: contain; }
  .kind-icon { display: inline-grid; place-items: center; border-color: #4a463c; background: var(--c-surface-2); color: #8d8778; }
  .kind-icon :global(svg) { width: .9rem; height: .9rem; }
  span { overflow-wrap: anywhere; }
  [data-rarity] { color: var(--c-rarity); }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
</style>
