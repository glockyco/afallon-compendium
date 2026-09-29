<script lang="ts" context="module">
  /** What a control that shows a hint attaches: its focus, click, and key events, and its description. */
  export interface HintControl {
    show: () => void;
    close: () => void;
    keydown: (event: KeyboardEvent) => void;
    describedBy: string | undefined;
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { FloatingController, placeBeside } from './floating';

  /** The explanation, in one or two short sentences. */
  export let text: string;
  /**
   * The slot holds its own focusable control, such as a sort button. The control attaches the `control` slot props, so
   * the hint follows it instead of adding a button of its own.
   */
  export let wrapsControl = false;
  /** The accessible name of the hint button when its visible term is not a word, such as a dash. */
  export let label: string | undefined = undefined;

  let open = false;
  let anchor: HTMLElement | undefined;
  let panel: HTMLElement | undefined;
  let id: string | undefined;

  // A tap outside closes the hint, because a touch screen gives no pointer leave and does not always move focus.
  function closeOutside(event: PointerEvent): void {
    if (!(event.target instanceof Node)) return;
    if (anchor?.contains(event.target) || panel?.contains(event.target)) return;
    floating.close();
  }

  const floating = new FloatingController(() => {
    open = true;
    document.addEventListener('pointerdown', closeOutside, true);
  }, () => {
    open = false;
    document.removeEventListener('pointerdown', closeOutside, true);
  });

  onMount(() => { id = `hint-${crypto.randomUUID()}`; });
  onDestroy(() => {
    floating.destroy();
    if (typeof document !== 'undefined') document.removeEventListener('pointerdown', closeOutside, true);
  });

  function position(node: HTMLElement) {
    if (!anchor) return;
    return { destroy: placeBeside(anchor, node) };
  }

  function pointerEnter(event: PointerEvent): void {
    floating.keepOpen();
    // A touch opens the hint with its tap, so it does not open twice.
    if (event.pointerType !== 'touch') floating.showAfterIntent();
  }

  $: control = {
    show: () => floating.show(),
    close: () => floating.close(),
    keydown: (event: KeyboardEvent) => floating.handleKeydown(event, open),
    describedBy: open ? id : undefined,
  } satisfies HintControl;
</script>

<span class="hint" bind:this={anchor} role="group" on:pointerenter={pointerEnter} on:pointerleave={() => floating.closeAfterIntent()}>
  {#if wrapsControl}<slot {control} />
  {:else}<button type="button" class="term" aria-label={label} aria-describedby={control.describedBy} on:focus={control.show} on:blur={control.close} on:click={control.show} on:keydown={control.keydown}><slot {control} /></button>{/if}
</span>
{#if open}<span {id} bind:this={panel} class="hint-panel" role="tooltip" use:position on:pointerenter={() => floating.keepOpen()} on:pointerleave={() => floating.closeAfterIntent()}>{text}</span>{/if}

<style>
  .hint { display: inline-flex; max-width: 100%; }
  .term { padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-align: inherit; text-transform: inherit; cursor: help; }
  .term, .hint :global(.hint-term) { text-decoration: underline dotted; text-decoration-color: color-mix(in srgb, currentcolor 60%, transparent); text-underline-offset: .22em; }
  .term:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .hint-panel { position: fixed; z-index: 45; top: 0; left: 0; visibility: hidden; width: max-content; max-width: min(20rem, calc(100vw - 2rem)); overflow: auto; padding: .45rem .6rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-0); box-shadow: 0 8px 24px var(--c-shadow); color: var(--c-text-strong); font: .78rem/1.45 system-ui, sans-serif; letter-spacing: normal; text-align: left; text-transform: none; white-space: normal; }
  @media (max-width: 640px) { .hint-panel { inset: auto 1rem 1rem !important; width: auto !important; max-width: none !important; visibility: visible; } }
</style>
