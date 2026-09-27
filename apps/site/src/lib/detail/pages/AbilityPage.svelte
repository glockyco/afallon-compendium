<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import AbilityTooltip from '../../AbilityTooltip.svelte';
  import Hero from '../Hero.svelte';
  import AbilityReferencesSection from '../sections/AbilityReferencesSection.svelte';
  import AbilityVersionsSection from '../sections/AbilityVersionsSection.svelte';
  import LearnedBySection from '../sections/LearnedBySection.svelte';
  import Requirements from '../../Requirements.svelte';
  import FactList from '../FactList.svelte';
  import FactRow from '../FactRow.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length > chosen.usedBy.length ? version : chosen);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />

  <Hero view="wide">
    <div slot="view" class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>
    {#if main.useRequirements.length}<FactList><FactRow label="Requirements"><Requirements requirements={main.useRequirements} {registry} kindLabels={false} /></FactRow></FactList>{/if}
  </Hero>

  <div class="c-sections">
    <AbilityVersionsSection versions={document.versions} {registry} />
    <LearnedBySection versions={document.versions} {registry} />
    <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />
    <AbilityReferencesSection versions={document.versions} relation="taughtBy" {registry} />
  </div>
</article>
