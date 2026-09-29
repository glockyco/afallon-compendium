<script lang="ts">
  import '../compendium.css';
  import { sectionIconSvg, type SectionIcon } from './section-icons';

  /** The anchor of the section. Hero lines and other links scroll to it. */
  export let id: string;
  export let title: string;
  export let icon: SectionIcon;
  /** The number of rows. A section of prose or facts has no count. */
  export let count: number | undefined = undefined;
  /** One sentence that explains the values or states the values that all rows share. */
  export let line: string | undefined = undefined;
</script>

<section class="section" {id} aria-labelledby={`${id}-title`}>
  <header>
    <h2 id={`${id}-title`}><span class="icon" aria-hidden="true">{@html sectionIconSvg(icon)}</span>{title}{#if count !== undefined}<span class="count">{count}</span>{/if}</h2>
    {#if line}<p class="line">{line}</p>{/if}
  </header>
  <div class="panel"><slot /></div>
</section>

<style>
  .section { scroll-margin-top: 1rem; }
  header { display: grid; gap: .3rem; margin-bottom: .6rem; }
  h2 { display: flex; align-items: center; gap: .55rem; margin: 0; color: var(--c-text-strong); font: 600 var(--c-text-title)/1.3 var(--c-serif); }
  .icon { display: inline-grid; flex: none; width: 1.7rem; height: 1.7rem; place-items: center; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-accent); }
  .icon :global(svg) { width: .95rem; height: .95rem; }
  .count { color: var(--c-text-mute); font: 500 var(--c-text-small)/1 Inter, ui-sans-serif, system-ui, sans-serif; font-variant-numeric: tabular-nums; }
  .line { margin: 0; color: var(--c-text-dim); font-size: var(--c-text-body); line-height: 1.5; }
  .panel { min-width: 0; padding: .85rem 1rem; border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface-1); }
  @media (max-width: 640px) { .panel { padding: .7rem .75rem; } }
</style>
