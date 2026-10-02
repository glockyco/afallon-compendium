<script lang="ts">
  import type { PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import MaterialsList from './MaterialsList.svelte';
  import type { Material } from './MaterialsList.svelte';
  export let materials: Material[];
  export let product: Ref | undefined = undefined;
  export let yieldCount = 1;
  export let registry: PublicKindEntry[];
  export let skill: Ref | undefined = undefined;
  export let requiredLevel: number | undefined = undefined;
  export let station: string | undefined = undefined;
</script>

<div class="equation">
  <MaterialsList {materials} {registry} variant="equation" />
  {#if product}<span class="arrow" aria-label="Makes">→</span><div class="product"><EntityLink ref={product} {registry} />{#if yieldCount > 1}<span>×{yieldCount}</span>{/if}</div>{/if}
</div>
{#if skill || requiredLevel !== undefined || station}
  <p class="recipe-meta">{#if skill}<EntityLink ref={skill} {registry} />{/if}{#if requiredLevel !== undefined}{#if skill}{' '}{/if}Level {requiredLevel}{/if}{#if station}{' '}· {station}{/if}</p>
{/if}

<style>
  .equation { display: grid; grid-template-columns: minmax(0, auto) auto minmax(0, 1fr); justify-content: start; align-items: center; gap: .75rem; min-width: 0; }
  .arrow { color: var(--c-text-mute); font-size: 1.5rem; }
  .product { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .4rem; justify-self: start; min-width: 0; padding: .35rem .7rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius); background: var(--c-surface-0); }
  .recipe-meta { margin: .75rem 0 0; color: var(--c-text-dim); font-size: var(--c-text-small); }
  @media (max-width: 640px) { .equation { grid-template-columns: minmax(0, 1fr); } .arrow { transform: rotate(90deg); justify-self: start; margin-left: 1rem; } }
</style>
