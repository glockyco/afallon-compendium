<script lang="ts">
  import type { PublicKindEntry, RequirementGroup } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import RequirementList from './RequirementList.svelte';

  // Page requirements link the entities they name. Tooltips use TooltipRequirements.
  export let requirements: RequirementGroup[];
  export let registry: PublicKindEntry[];
  export let emptyExplanation: string | undefined = undefined;
  export let kindLabels = true;
</script>

{#if requirements.length === 0}
  {#if emptyExplanation}<MissingValue explanation={emptyExplanation} />{/if}
{:else}
  <RequirementList {requirements} {kindLabels} let:ref><EntityLink {ref} {registry} /></RequirementList>
{/if}
