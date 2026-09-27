<script lang="ts">
  import type { PublicAbility, PublicKindEntry } from '@afallon/contracts/public';
  import AbilityTooltip from '../../AbilityTooltip.svelte';
  import Hero from '../Hero.svelte';
  import AbilityReferencesSection from '../sections/AbilityReferencesSection.svelte';
  import AbilityVersionsSection from '../sections/AbilityVersionsSection.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: PublicAbility;
  export let registry: PublicKindEntry[];

  $: main = document.versions.reduce((chosen, version) => version.usedBy.length > chosen.usedBy.length ? version : chosen);
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />

  <Hero view="wide">
    <div slot="view" class="c-game-frame"><AbilityTooltip {document} variant={main.anchor} /></div>
  </Hero>

  <div class="c-sections">
    <AbilityVersionsSection versions={document.versions} />
    <AbilityReferencesSection versions={document.versions} relation="usedBy" {registry} />
    <AbilityReferencesSection versions={document.versions} relation="taughtBy" {registry} />
  </div>
</article>
