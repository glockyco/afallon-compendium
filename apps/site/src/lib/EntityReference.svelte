<script lang="ts">
  import { base } from '$app/paths';
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import { kindGlyphSvg } from './kind-icon';

  export let ref: Ref;
  export let registry: PublicKindEntry[];
  export let rarity: string | undefined = undefined;
  /** A reference inside game text: no icon, the colour of the text around it. */
  export let plain = false;

  $: resolved = ref.key !== null ? ref : null;
  $: kind = resolved ? registry.find((entry) => entry.kind === resolved.kind) : undefined;
  $: glyph = kindGlyphSvg(kind?.icon);
</script>

<!-- A reference flows with the text around it, like a page link, so its name sits on the line's baseline. -->
<span class="entity-reference" class:plain data-rarity={rarity}>{#if plain}{:else if resolved?.icon}<img src={`${base}/data/${resolved.icon.url}`} width={resolved.icon.width} height={resolved.icon.height} alt="" />{:else if resolved && glyph}<span class="kind-icon" aria-hidden="true">{@html glyph}</span>{/if}<span>{resolved?.name ?? (ref.key === null ? ref.label : '')}</span></span>

<style>
  .entity-reference { color: var(--c-text); overflow-wrap: break-word; }
  /* The icon scales with the text. `middle` centers it on the lower-case letters, and the lift moves it to the
     center of the whole line of letters. */
  img, .kind-icon { box-sizing: border-box; width: 1.45em; height: 1.45em; margin-right: .35em; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); object-fit: contain; vertical-align: middle; position: relative; top: -.12em; }
  .kind-icon { display: inline-grid; place-items: center; border-color: var(--c-frame); background: var(--c-surface-2); color: var(--c-text-mute); }
  .kind-icon :global(svg) { width: .65em; height: .65em; }
  [data-rarity] { color: var(--c-rarity); }
  .plain { color: inherit; }
  [data-rarity] img { border-color: color-mix(in srgb, var(--c-rarity) 60%, transparent); }
</style>
