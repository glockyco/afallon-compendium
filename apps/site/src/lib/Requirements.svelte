<script lang="ts">
  import type { PublicKindEntry, RequirementRef } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';

  export let requirements: RequirementRef[];
  export let registry: PublicKindEntry[];
  export let emptyExplanation: string | undefined = undefined;
</script>

{#if requirements.length === 0}{#if emptyExplanation}<MissingValue explanation={emptyExplanation} />{:else}<span class="none">None</span>{/if}{:else}<ul>{#each requirements as requirement}<li>{requirement.label}{requirement.mandatory ? '' : ' (optional)'}{#if requirement.target}{' · '}<EntityLink ref={requirement.target} {registry} />{/if}{#if requirement.amount !== undefined} × {requirement.amount}{/if}{#if requirement.secondaryAmount !== undefined} / {requirement.secondaryAmount}{/if}</li>{/each}</ul>{/if}

<style>
  ul { margin: 0; padding-left: 1rem; }
  li + li { margin-top: .25rem; }
  .none { color: #aaa69d; }
</style>
