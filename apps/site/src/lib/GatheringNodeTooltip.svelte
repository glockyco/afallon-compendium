<script lang="ts">
  import type { PublicGatheringNode } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { formatNumber, nameOf } from './format';

  export let document: PublicGatheringNode;
  $: skill = document.facts.skill ? nameOf(document.facts.skill) : undefined;
  $: tools = document.facts.requirements.filter((group) => group.mode === 'all' && !group.checkCount).flatMap((group) => group.requirements)
    .filter((requirement) => !skill || !requirement.label.toLocaleLowerCase().startsWith(`${skill.toLocaleLowerCase()} `))
    .map((requirement) => ({ label: requirement.label, name: requirement.spans.filter((span) => 'ref' in span).map((span) => nameOf(span.ref)).join(', ') }));
  $: yields = [...new Set(document.yields.map((row) => nameOf(row.counterpart)))];
  $: gives = yields.length ? `${yields.slice(0, 2).join(', ')}${yields.length > 2 ? ` and ${formatNumber(yields.length - 2)} more` : ''}` : undefined;
  $: facts = [
    ...(skill ? [{ label: 'Skill', value: skill }] : []),
    ...(document.facts.requiredLevel !== undefined ? [{ label: 'Required level', value: formatNumber(document.facts.requiredLevel) }] : []),
    ...tools.map((requirement) => /^uses up \d+/i.test(requirement.label)
      ? { label: 'Consumed per use', value: requirement.name ? `${requirement.label.match(/^uses up (\d+)/i)?.[1]} ${requirement.name}` : requirement.label.replace(/^uses up /i, '') }
      : /^has /i.test(requirement.label) && requirement.name
        ? { label: 'Needs', value: requirement.name }
        : { label: 'To gather', value: requirement.label }),
    ...(gives ? [{ label: 'Gives', value: gives }] : []),
  ] satisfies HeaderFact[];
</script>

<article><EntityHeader name={document.ref.name} art={document.art.icon ?? document.ref.icon} {facts} description={document.description} compact /></article>
