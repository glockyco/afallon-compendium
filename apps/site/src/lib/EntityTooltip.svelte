<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { EntityRef, PublicKindEntry, StaticDocument } from '@afallon/contracts/public';
  import { clientMapLoader } from './client-publication';
  import type { VirtualElement } from '@floating-ui/dom';
  import { FloatingController, placeBeside } from './floating';
  import TooltipPresenter from './TooltipPresenter.svelte';

  export let ref: EntityRef;
  export let registry: PublicKindEntry[];
  export let rankIndex: number | undefined = undefined;
  export let id: string | undefined = undefined;
  /** The link that owns this tooltip. A relation table scrolls, so the tooltip is positioned
      against the viewport instead of the anchor's clipping box. */
  export let anchor: HTMLElement | undefined = undefined;
  /** The pointer over the link, if any, so a link that wraps onto two lines places the card beside the hovered line. */
  export let pointer: () => { x: number; y: number } | null = () => null;

  let open = false;
  let loading = false;
  let error = '';
  let page: StaticDocument | null = null;

  const floating = new FloatingController(() => { open = true; void load(); }, () => { open = false; });

  async function load(): Promise<void> {
    if (page || loading) return;
    const activeLoader = clientMapLoader();
    if (!activeLoader) return;
    loading = true;
    error = '';
    try {
      page = await activeLoader.loadPageForRef(ref);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  export function show(): void { floating.show(); }
  export function showAfterIntent(): void { floating.showAfterIntent(); }
  export function keepOpen(): void { floating.keepOpen(); }
  export function closeAfterIntent(): void { floating.closeAfterIntent(); }
  export function close(): void { floating.close(); }
  export function handleKeydown(event: KeyboardEvent): void { floating.handleKeydown(event, open); }

  onDestroy(() => floating.destroy());

  // A layout can stretch the anchor across its row, as in a list of materials. The card goes beside the visible link
  // content instead: the union of the icon and the name, which also ends at the ellipsis of a truncated name. A name
  // that wraps has one box per line, and the union of both lines spans the whole paragraph, so the card goes beside the
  // line under the pointer, or beside the first line when the link has keyboard focus.
  function linkContent(anchorElement: HTMLElement): VirtualElement {
    return {
      contextElement: anchorElement,
      getBoundingClientRect() {
        const parts = [...(anchorElement.querySelector('.entity-link')?.children ?? [])]
          .flatMap((part) => [...part.getClientRects()]).filter((rect) => rect.width > 0);
        if (!parts.length) return anchorElement.getBoundingClientRect();
        const lines: DOMRect[][] = [];
        for (const rect of [...parts].sort((a, b) => a.top - b.top)) {
          const middle = (rect.top + rect.bottom) / 2;
          const line = lines.find((boxes) => boxes.some((box) => middle >= box.top && middle <= box.bottom));
          if (line) line.push(rect);
          else lines.push([rect]);
        }
        const at = pointer();
        const line = (at && lines.find((boxes) => boxes.some((box) => at.y >= box.top && at.y <= box.bottom))) ?? lines[0]!;
        const left = Math.min(...line.map((rect) => rect.left)), right = Math.max(...line.map((rect) => rect.right));
        const top = Math.min(...line.map((rect) => rect.top)), bottom = Math.max(...line.map((rect) => rect.bottom));
        return { x: left, y: top, left, top, right, bottom, width: right - left, height: bottom - top };
      },
    };
  }

  function position(node: HTMLElement) {
    if (!anchor) return;
    return { destroy: placeBeside(linkContent(anchor), node) };
  }
</script>

{#if open}
  <span {id} class="entity-tooltip" role="tooltip" use:position>
    {#if loading}<span class="tooltip-status">Loading details…</span>
    {:else if error}<span class="tooltip-status error">Details are unavailable.</span>
    {:else if page}<TooltipPresenter {page} {registry} {rankIndex} variant={ref.variant} />{/if}
  </span>
{/if}

<style>
  .entity-tooltip { position: fixed; z-index: 40; top: 0; left: 0; visibility: hidden; pointer-events: none; width: min(28rem, calc(100vw - 2rem)); overflow: auto; padding: .85rem; border: 1px solid var(--c-frame-strong); border-radius: var(--c-radius); background: var(--c-surface-1); box-shadow: 0 10px 30px var(--c-shadow); color: var(--c-text); text-align: left; }
  .tooltip-status { display: block; color: var(--c-text-soft); font-size: var(--c-text-small); }
  .tooltip-status.error { color: var(--c-danger); }
  @media (max-width: 640px) { .entity-tooltip { inset: auto 1rem 1rem !important; width: auto !important; max-height: 60vh !important; } }
</style>
