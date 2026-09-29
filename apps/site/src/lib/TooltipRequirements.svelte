<script lang="ts">
  import type { PublicKindEntry, RequirementGroup } from '@afallon/contracts/public';
  import EntityReference from './EntityReference.svelte';
  import RequirementList from './RequirementList.svelte';

  // Tooltips name entities with EntityReference, as every tooltip does: EntityLink imports the tooltip presenter,
  // so a tooltip that imported it would import itself. `fulfilled` shows the list as met, as the game's item
  // tooltip does for the synthetic character state.
  export let requirements: RequirementGroup[];
  export let registry: PublicKindEntry[];
  export let fulfilled = false;
</script>

<div class:fulfilled>
  <RequirementList {requirements} let:ref><EntityReference {ref} {registry} /></RequirementList>
</div>

<style>
  .fulfilled { color: var(--c-positive); }
  .fulfilled :global(.count) { color: inherit; }
</style>
