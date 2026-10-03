<script lang="ts">
  import { onMount } from 'svelte';
  import { followLocation, provideDetailNavigation, scrollToAnchor } from './detail-navigation';
  import SectionLens from './SectionLens.svelte';
  import { fragmentId } from './tab-state';

  // The section control precedes the sections in reading order. On wide screens it can float in the page margin.
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

<SectionLens sections={$sections} />
<div class="c-sections"><slot /></div>
