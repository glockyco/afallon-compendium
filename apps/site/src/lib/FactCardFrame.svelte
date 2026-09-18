<script lang="ts">
  import { base } from '$app/paths';
  import type { ArtRef } from '@afallon/contracts/public';

  export let name: string;
  export let description: string | null;
  export let art: ArtRef | undefined = undefined;
  export let artRole = 'icon';
  export let fallbackIcon: string | undefined = undefined;
  export let compact = false;
</script>

<article class:compact class="fact-card">
  <header>
    {#if art}<img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt={`${name} ${artRole}`} />{:else if fallbackIcon}<span class="fallback-icon" aria-label={`${name} ${artRole}`}>{fallbackIcon.slice(0, 1).toLocaleUpperCase()}</span>{/if}
    <div>{#if compact}<h3>{name}</h3>{:else}<h1>{name}</h1>{/if}{#if description}<p>{description}</p>{/if}</div>
  </header>
  <slot />
</article>

<style>
  .fact-card { color: #e9e4d9; }
  header { display: flex; align-items: flex-start; gap: 1rem; }
  img, .fallback-icon { width: min(10rem, 28vw); height: auto; max-height: 14rem; flex: none; border: 1px solid #4a4b46; border-radius: 3px; background: #171818; object-fit: contain; }
  .fallback-icon { display: grid; aspect-ratio: 1; place-items: center; color: #d5b978; font: 600 2rem/1 Georgia, serif; }
  h1, h3 { margin: 0; color: #f1ecdf; font-family: Georgia, serif; line-height: 1.2; }
  h1 { font-size: clamp(1.65rem, 4vw, 2.45rem); } h3 { font-size: 1rem; }
  p { max-width: 58rem; margin: .55rem 0 0; color: #c0bcb2; line-height: 1.55; white-space: pre-line; }
  .compact header { gap: .65rem; } .compact img, .compact .fallback-icon { width: 4rem; max-height: 4rem; }
  .compact p { font-size: .78rem; line-height: 1.4; }
  :global(.facts) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.2rem; margin: 1rem 0 0; }
  :global(.facts > div) { display: grid; grid-template-columns: minmax(7rem, .7fr) minmax(0, 1fr); gap: .6rem; padding: .45rem 0; border-bottom: 1px solid #383a36; }
  :global(.facts dt) { color: #aaa69d; font-size: .72rem; }
  :global(.facts dd) { margin: 0; font-size: .82rem; overflow-wrap: anywhere; }
  .compact :global(.facts) { grid-template-columns: 1fr; }
  @media (max-width: 640px) { header { align-items: center; } .fact-card:not(.compact) img, .fact-card:not(.compact) .fallback-icon { width: 5.5rem; max-height: 7rem; } :global(.facts) { grid-template-columns: 1fr; } }
</style>
