<script lang="ts">
  import { base } from '$app/paths';
  import type { EntityRef } from '@afallon/contracts/public';
  export let guide: EntityRef;
  export let stepId: string;
  export let label = 'How it works';
</script>

<a class="how-it-works" href={`${base}/mechanics/${guide.slug}/#step-${stepId}`}><span class="mark" aria-hidden="true">?</span><span class="label">{label}</span></a>

<!-- The underline sits on the label only: a parent underline also draws under the "?" mark and cannot be removed there. -->
<style>
  /* `fit-content` keeps the link as wide as its text inside a grid or a column flexbox, which would otherwise stretch it
     and its focus outline to the full width. */
  .how-it-works { display: inline-flex; gap: .4rem; align-items: center; width: fit-content; min-height: 1.5rem; color: var(--c-accent); font-size: var(--c-text-small); text-decoration: none; }
  .label { text-decoration: underline; text-underline-offset: .2em; }
  .how-it-works:hover, .how-it-works:focus-visible { color: var(--c-accent-strong); }
  .how-it-works:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; border-radius: .2rem; }
  .mark { display: inline-grid; place-items: center; flex: none; width: 1.25rem; height: 1.25rem; border: 1px solid currentColor; border-radius: 50%; font-size: var(--c-text-small); font-weight: 700; line-height: 1; }
</style>
