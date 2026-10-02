<script lang="ts">
  import { onMount } from 'svelte';
  import { followLocation, provideDetailNavigation, scrollToAnchor } from './detail-navigation';
  import SectionLens from './SectionLens.svelte';
  import { fragmentId } from './tab-state';

  // The sections below register themselves as they render. The section lens follows them and floats over the page, so
  // the section column keeps its full width at every screen size.
  const navigation = provideDetailNavigation();
  const sections = navigation.sections;
  onMount(() => {
    const stopFollowing = followLocation(navigation);
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin || link.pathname !== window.location.pathname || !link.hash || link.hash !== window.location.hash) return;
      const id = fragmentId(link.hash);
      void navigation.reveal(id).then(() => requestAnimationFrame(() => scrollToAnchor(id)));
    };
    document.addEventListener('click', onClick);
    return () => { stopFollowing(); document.removeEventListener('click', onClick); };
  });
</script>

<div class="c-sections"><slot /></div>
<SectionLens sections={$sections} />
