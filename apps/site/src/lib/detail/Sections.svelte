<script lang="ts">
  import { onMount } from 'svelte';
  import { followLocation, provideDetailNavigation } from './detail-navigation';
  import SectionLens from './SectionLens.svelte';

  // The sections below register themselves as they render. The section lens follows them and floats over the page, so
  // the section column keeps its full width at every screen size.
  const navigation = provideDetailNavigation();
  const sections = navigation.sections;
  onMount(() => followLocation(navigation));
</script>

<div class="c-sections"><slot /></div>
<SectionLens sections={$sections} />
