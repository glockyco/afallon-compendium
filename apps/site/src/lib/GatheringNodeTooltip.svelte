<script lang="ts">
  import type { PublicGatheringNode } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';

  export let document: PublicGatheringNode;

  $: facts = [
    ...(document.facts.skill ? [{ label: 'Skill', value: document.facts.skill.key === null ? document.facts.skill.label : document.facts.skill.name }] : []),
    ...(document.facts.requiredLevel !== undefined ? [{ label: 'Required level', value: String(document.facts.requiredLevel) }] : []),
    ...(document.facts.skillExperience !== undefined ? [{ label: 'Skill experience', value: String(document.facts.skillExperience) }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} {facts} description={document.description} compact /></article>
